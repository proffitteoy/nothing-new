"use client";

/*
 * Portions of this visualizer are adapted from XxHuberrr/Mineradio
 * public/index.html (GPL-3.0).
 *
 * Copyright (C) 2026 XxHuberrr.
 * GPL text: docs/licenses/Mineradio-GPL-3.0.txt
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

type MineradioParticleFieldProps = {
  coverUrl: string;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  volume: number;
  seed: string | number;
  className?: string;
};

type RuntimeState = {
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  volume: number;
};

type Ripple = {
  x: number;
  y: number;
  age: number;
  str: number;
};

const PLANE_SIZE = 4.8;
const RIPPLE_MAX = 12;

function clampRange(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeCoverResolution(value: number) {
  return clampRange(Number(value) || 1, 0.75, 1.55);
}

function coverParticleGridForResolution(value: number) {
  let grid = Math.round(118 * normalizeCoverResolution(value));
  grid = Math.max(88, Math.min(183, grid));
  return grid % 2 ? grid : grid + 1;
}

function hashSeed(value: string | number) {
  const input = String(value || "mineradio");
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFrom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function makeDotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 31);
    gradient.addColorStop(0, "rgba(255,255,255,0.96)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.78)");
    gradient.addColorStop(0.72, "rgba(255,255,255,0.22)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function makeSolidTexture(color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 4, 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function makeEdgeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(128,0,0,255)";
    ctx.fillRect(0, 0, 4, 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function buildCoverParticleGeometry(resolution: number, seed: string | number) {
  const grid = coverParticleGridForResolution(resolution);
  const count = grid * grid;
  const rand = randomFrom(hashSeed(seed));
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const randoms = new Float32Array(count);
  const texelStep = 1 / grid;

  for (let index = 0; index < count; index += 1) {
    const gx = index % grid;
    const gy = Math.floor(index / grid);
    const u = (gx + 0.5) * texelStep;
    const v = (gy + 0.5) * texelStep;
    const px = gx / (grid - 1);
    const py = gy / (grid - 1);

    positions[index * 3] = (px - 0.5) * PLANE_SIZE;
    positions[index * 3 + 1] = (py - 0.5) * PLANE_SIZE;
    positions[index * 3 + 2] = 0;
    uvs[index * 2] = u;
    uvs[index * 2 + 1] = v;
    randoms[index] = rand();
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("aRand", new THREE.BufferAttribute(randoms, 1));
  return geometry;
}

function createRippleTexture() {
  const data = new Float32Array(RIPPLE_MAX * 4);
  for (let index = 0; index < RIPPLE_MAX; index += 1) {
    data[index * 4 + 2] = -10;
  }

  const texture = new THREE.DataTexture(data, 1, RIPPLE_MAX, THREE.RGBAFormat, THREE.FloatType);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return { data, texture };
}

const vertexShader = `
precision highp float;
uniform float uTime, uBass, uMid, uTreble, uBeat, uEnergy, uBurstAmt;
uniform float uPreset, uIntensity, uDepth, uPointScale, uSpeed, uTwist;
uniform float uVinylSpin;
uniform float uColorBoost, uScatter, uCoverRes, uBgFade;
uniform float uHasCover, uHasDepth, uEdgeEnabled, uAiBoost;
uniform float uMouseActive, uPixel, uColorMixT, uLoading;
uniform sampler2D uCoverTex, uPrevCoverTex, uEdgeTex, uRippleTex;
uniform int uRippleCount;
uniform vec2 uMouseXY, uHandXY;
uniform float uHandActive, uGestureGrip;
uniform vec3 uTintColor;
uniform float uTintStrength;
attribute vec2 aUv;
attribute float aRand;
varying vec3 vColor;
varying float vBright, vRipple, vEdgeBoost, vAlpha, vSourceLum;

#define PI 3.14159265359

vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289v(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 perm(vec4 x){return mod289v(((x*34.0)+1.0)*x);}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=perm(perm(perm(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=inversesqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float hash11(float p) {
  return fract(sin(p * 127.1) * 43758.5453123);
}

vec2 safeCoverUv(vec2 uv) {
  return clamp(uv, vec2(0.0012), vec2(0.9988));
}

vec3 sampleNewCoverColor(vec2 uv) {
  return texture2D(uCoverTex, safeCoverUv(uv)).rgb;
}

vec3 samplePrevCoverColor(vec2 uv) {
  return texture2D(uPrevCoverTex, safeCoverUv(uv)).rgb;
}

vec4 sampleEdgeColor(vec2 uv) {
  return texture2D(uEdgeTex, safeCoverUv(uv));
}

float rippleSumAt(vec2 p, out float maxAmp) {
  float sum = 0.0; maxAmp = 0.0;
  for (int ri = 0; ri < 12; ri++) {
    if (ri >= uRippleCount) break;
    float vCoord = (float(ri) + 0.5) / 12.0;
    vec4 rd = texture2D(uRippleTex, vec2(0.5, vCoord));
    float age = rd.z; float str = rd.w;
    if (str < 0.005 || age < 0.0 || age > 2.0) continue;
    float dx = p.x - rd.x, dy = p.y - rd.y;
    float dist = sqrt(dx*dx + dy*dy);
    float lifeN = age / 2.0;
    float fadeIn  = smoothstep(0.0, 0.06, age);
    float fadeOut = 1.0 - smoothstep(0.7, 1.0, lifeN);
    float env = fadeIn * fadeOut;
    float bulgeW = 0.55 + age * 0.80;
    float bulge  = exp(-dist*dist / (2.0 * bulgeW * bulgeW)) * (1.0 - smoothstep(0.0, 0.55, lifeN));
    float waveR  = age * 2.10;
    float ringW  = 0.40 + age * 0.22;
    float ring   = exp(-pow((dist - waveR) / ringW, 2.0));
    float local  = (bulge * 2.4 + ring * 1.30) * env * str;
    sum += local;
    maxAmp = max(maxAmp, abs(local));
  }
  return sum;
}

void main(){
  float t = uTime * uSpeed;
  vec3 pos;
  vec2 sampleUv = safeCoverUv(aUv);
  vec3 newCol = sampleNewCoverColor(sampleUv);
  vec3 prevCol = samplePrevCoverColor(sampleUv);
  vec3 coverColor = mix(prevCol, newCol, clamp(uColorMixT, 0.0, 1.0));
  vec4 edge = sampleEdgeColor(sampleUv);
  float depthVal = edge.r;
  float edgeVal  = edge.g;
  float fgMask   = edge.b;
  float maxRippleAmp = 0.0;
  float rippleZ = 0.0;

  vec3 defaultColor = mix(
    vec3(0.36, 0.28, 0.72),
    mix(vec3(0.85, 0.55, 0.95), vec3(0.45, 0.78, 0.95), aUv.x),
    aUv.y
  );
  vColor = mix(defaultColor, coverColor, uHasCover);
  vAlpha = 1.0;

  float K = uIntensity * 1.6;

  if (uPreset < 0.5) {
    pos = position;
    rippleZ = rippleSumAt(pos.xy, maxRippleAmp);

    float midN = snoise(vec3(pos.x*1.4, pos.y*1.4, t*0.55)) * 0.6
               + snoise(vec3(pos.x*2.8+5.0, pos.y*2.8-3.0, t*0.85)) * 0.4;
    float midMask = 0.55 + 0.45 * snoise(vec3(pos.x*0.4, pos.y*0.4, t*0.18));
    float midDisp = midN * uMid * 0.55 * midMask * K;

    float trebleJ = snoise(vec3(pos.x*6.5, pos.y*6.5, t*3.5 + aRand*4.0)) * uTreble * 0.18 * K;
    float bassBreath = snoise(vec3(pos.x*0.35, pos.y*0.35, t*0.4)) * uBass * 0.42 * K;
    float depthZ = (depthVal - 0.5) * uAiBoost * uDepth * 1.40 * uHasDepth;

    pos.z = rippleZ * 1.30 + midDisp + trebleJ + bassBreath + depthZ;
  } else {
    float bassGlow = smoothstep(0.07, 0.78, uBass) * 0.34 + uBeat * 0.014;
    float midGlow = smoothstep(0.07, 0.62, uMid) * 0.42;
    float highGlow = smoothstep(0.04, 0.46, uTreble) * 0.46;
    float lane = aUv.y;
    float transition = clamp(uBurstAmt, 0.0, 1.0);

    if (lane < 0.80) {
      float laneWarp = snoise(vec3(aUv.x * 0.42, lane * 1.7, t * 0.026)) * 0.11 + (hash11(aRand * 73.1) - 0.5) * 0.045;
      float warpedLane = clamp(lane + laneWarp, 0.0, 0.80);
      float bandCoord = warpedLane / 0.80 * 5.65 + snoise(vec3(aUv.x * 0.82, lane * 2.25, t * 0.032)) * 0.62;
      float band = floor(bandCoord);
      float local = fract(bandCoord + hash11(band * 9.13 + aRand * 2.4) * 0.18);
      float bandN = clamp((band + 0.5) / 5.65, 0.0, 1.0);
      float seed = hash11(band * 19.17 + aRand * 31.0);
      float flow = fract(aUv.x + t * (0.0034 + bandN * 0.0038 + seed * 0.0022) + seed * 0.53);
      float arc = (flow - 0.5) * PI * (1.35 + bandN * 0.72 + seed * 0.24);
      float armCurve = sin(arc + bandN * 2.2 + seed * 5.3);
      float spiralRadius = 9.2 + bandN * 11.8 + seed * 6.0 + local * 2.9;
      float x = cos(arc * 0.72 + bandN * 0.92 + seed * 1.3) * spiralRadius + (flow - 0.5) * (13.5 + bandN * 9.5);
      float ribbonPhase = flow * PI * 2.0 * (0.55 + bandN * 0.24 + seed * 0.10) + t * (0.010 + bandN * 0.007) + seed * 5.7;
      float broadWave = sin(ribbonPhase) * 0.92;
      float fineWave = sin(ribbonPhase * (1.36 + seed * 0.62) - t * 0.044 + seed * 5.0) * 0.045;
      float yBase = (bandN - 0.5) * 13.2 + armCurve * (2.3 + bandN * 1.6) + (seed - 0.5) * 1.85 + snoise(vec3(bandN * 2.0, flow * 0.62, seed)) * 0.92;
      float ridgeCenter = 0.43 + (seed - 0.5) * 0.18;
      float ridge = exp(-pow((local - ridgeCenter) / (0.25 + seed * 0.04), 2.0));
      float softMask = smoothstep(0.010, 0.12, lane) * (1.0 - smoothstep(0.72, 0.81, lane));
      float ribbonNoise = snoise(vec3(flow * 1.18 + seed, bandN * 2.0, t * 0.018)) * 0.74;
      float zLayer = mix(-23.5, 15.5, bandN) + (seed - 0.5) * 6.0;

      pos.x = x + ribbonNoise * 1.40 + sin(t * 0.012 + seed * 8.0) * 0.22;
      pos.y = yBase + broadWave + fineWave + (local - 0.5) * (0.58 + ridge * 0.14);
      pos.z = zLayer + broadWave * 1.35 + ribbonNoise * 1.85;

      float pulseLine = 0.5 + 0.5 * sin(ribbonPhase * (1.7 + seed * 0.9) - t * 0.32 + seed * 6.0);
      vec3 aurora = mix(vec3(0.52, 0.86, 1.0), vec3(0.70, 0.58, 1.0), bandN);
      aurora = mix(aurora, vec3(0.96, 0.98, 0.92), bassGlow * 0.05);
      vAlpha = (0.18 + ridge * 0.78 + pulseLine * highGlow * 0.035 + bassGlow * 0.025) * softMask * (0.96 + transition * 0.02);
      vColor = mix(coverColor, aurora, 0.62 + ridge * 0.22) * (0.76 + ridge * 0.86 + pulseLine * highGlow * 0.05 + bassGlow * 0.04);
      maxRippleAmp = max(maxRippleAmp, ridge * (0.12 + midGlow * 0.05) + pulseLine * highGlow * 0.045 + bassGlow * 0.030);
    } else {
      float q = (lane - 0.80) / 0.20;
      float seed = hash11(aRand * 917.0 + floor(q * 130.0));
      float depth = mix(-32.0, 18.0, seed);
      float drift = fract(aUv.x + t * (0.0014 + seed * 0.0048) + seed * 0.63);
      float cluster = snoise(vec3(seed * 2.0, q * 3.2, t * 0.007));
      float x = (drift - 0.5) * (45.0 + seed * 22.0) + cluster * 3.4;
      float y = (hash11(aRand * 331.0 + seed * 5.0) - 0.5) * 22.0 + sin(t * (0.018 + seed * 0.028) + seed * 7.0) * 0.86;
      float z = depth + sin(t * (0.020 + seed * 0.032) + aRand * 8.0) * 1.05;
      float twinkle = pow(0.5 + 0.5 * sin(t * (0.24 + seed * 0.42) + aRand * 17.0), 5.0);
      float dust = smoothstep(0.22, 0.98, hash11(aRand * 661.0 + floor(q * 160.0)));

      pos = vec3(x, y, z);
      vAlpha = dust * (0.16 + twinkle * 0.46 + highGlow * 0.025 + bassGlow * 0.018) * (1.0 - q * 0.06);
      vColor = mix(coverColor, vec3(0.92, 0.97, 1.0), 0.62 + twinkle * 0.14) * (0.72 + twinkle * 0.62 + bassGlow * 0.025);
      maxRippleAmp = max(maxRippleAmp, twinkle * highGlow * 0.055 + dust * bassGlow * 0.030);
    }

    if (transition > 0.001) {
      float bloom = smoothstep(0.0, 1.0, transition);
      vec2 burstVec = pos.xy + vec2(hash11(aRand * 31.0) - 0.5, hash11(aRand * 47.0) - 0.5) * 0.75;
      vec2 burstDir = burstVec / max(length(burstVec), 0.001);
      pos.xy += burstDir * bloom * 0.026;
      pos.xy += vec2(snoise(vec3(aRand, t * 0.014, 1.0)), snoise(vec3(aRand, t * 0.014, 5.0))) * bloom * 0.06;
      pos.xy *= 1.0 + bloom * 0.014;
      pos.z += (hash11(aRand * 123.0) - 0.5) * bloom * 0.18;
      vAlpha *= 0.86 + bloom * 0.22;
      maxRippleAmp = max(maxRippleAmp, bloom * 0.10);
    }
  }

  if (uMouseActive > 0.5 && uPreset < 0.5) {
    float mdx = pos.x - uMouseXY.x;
    float mdy = pos.y - uMouseXY.y;
    float md = sqrt(mdx*mdx + mdy*mdy);
    if (md < 1.0) {
      float push = (1.0 - md) * (1.0 - md);
      pos.z += push * 0.55;
    }
  }

  if (uScatter > 0.001) {
    vec2 jdir = vec2(cos(aRand * 6.2831), sin(aRand * 6.2831));
    pos.xy += jdir * uScatter * (0.05 + uTreble * 0.10);
  }
  if (uTwist > 0.001 && uPreset < 0.5) {
    float ta = uTwist * pos.z * 0.6;
    float cs = cos(ta), sn = sin(ta);
    pos.xy = mat2(cs, -sn, sn, cs) * pos.xy;
  }

  float edgeBoost = uEdgeEnabled * edgeVal;
  vSourceLum = dot(max(vColor, vec3(0.0)), vec3(0.299, 0.587, 0.114));
  float blackParticleGuard = 1.0 - smoothstep(0.025, 0.115, vSourceLum);
  vEdgeBoost = edgeBoost * (1.0 - blackParticleGuard);
  vColor = pow(max(vColor, vec3(0.0)), vec3(1.0 / max(0.35, uColorBoost)));
  vColor = mix(vColor, vColor + vec3(0.20), edgeBoost * 0.50 * (1.0 - blackParticleGuard));
  float tintLum = max(max(vColor.r, vColor.g), vColor.b);
  vec3 tintedColor = uTintColor * max(0.24, tintLum * 1.12);
  vColor = mix(vColor, tintedColor, clamp(uTintStrength, 0.0, 1.0) * (1.0 - blackParticleGuard));

  vBright = 0.82 + maxRippleAmp * 0.55 + uBass * 0.10 + edgeBoost * 0.30 + uEnergy * 0.05 + uBurstAmt * 0.40;
  if (uPreset > 4.5) {
    vBright = 0.94 + maxRippleAmp * 0.34 + uBass * 0.020 + uEnergy * 0.026 + uBurstAmt * 0.025;
  }
  vRipple = clamp(maxRippleAmp * 1.5, 0.0, 1.0);

  if (uHasDepth > 0.5 && uPreset < 0.5) {
    float bgMul = mix(1.0, 0.55, uBgFade * (1.0 - fgMask));
    vBright *= bgMul;
  }

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  float depthSize = 36.0 / max(0.5, -mvPos.z);
  float audioBoost = 1.0 + maxRippleAmp * 0.7 + edgeBoost * 0.55 + uBeat * 0.30 + uBurstAmt * 0.5;
  float sz = clamp(depthSize * audioBoost, 1.05, 4.95);
  if (uPreset > 4.5) {
    float flowDrive = uBass * 0.070 + uMid * 0.046 + uTreble * 0.060 + uBurstAmt * 0.090 + uBeat * 0.055;
    sz = clamp(depthSize * (1.05 + flowDrive), 1.00, 5.45);
  }
  gl_PointSize = sz * uPixel * uPointScale;
  gl_Position = projectionMatrix * mvPos;
}
`;

const fragmentShader = `
precision highp float;
uniform sampler2D uDotTex;
uniform float uAlpha, uPreset, uParticleDim;
varying vec3 vColor;
varying float vBright, vRipple, vEdgeBoost, vAlpha, vSourceLum;

void main(){
  vec4 tex = texture2D(uDotTex, gl_PointCoord);
  if (tex.a < 0.02) discard;
  vec3 col = vColor * vBright;
  col = mix(col, col * 1.3 + vec3(0.05), vEdgeBoost * 0.35);
  col = mix(col, col * 1.2, vRipple * 0.4);
  float keepBlack = 1.0 - smoothstep(0.025, 0.115, vSourceLum);
  float nonBlack = 1.0 - keepBlack;
  float dotDist = length(gl_PointCoord - vec2(0.5)) * 2.0;
  float readableRim = smoothstep(0.44, 0.94, dotDist) * (1.0 - smoothstep(0.94, 1.08, dotDist)) * tex.a;
  float outLum = dot(col, vec3(0.299, 0.587, 0.114));
  float lightParticle = smoothstep(0.50, 0.82, outLum) * nonBlack;
  float darkParticle = (1.0 - smoothstep(0.20, 0.50, outLum)) * nonBlack;
  col = mix(col, vec3(0.0), readableRim * lightParticle * 0.38);
  col = mix(col, vec3(1.0), readableRim * darkParticle * 0.20);
  col = clamp(col, vec3(0.0), vec3(1.6));
  gl_FragColor = vec4(col, tex.a * uAlpha * uParticleDim * vAlpha);
}
`;

const bloomVertexShader = vertexShader
  .replace("uniform float uMouseActive, uPixel, uColorMixT, uLoading;", "uniform float uMouseActive, uPixel, uColorMixT, uLoading, uBloomSize;")
  .replace("gl_PointSize = sz * uPixel * uPointScale;", "gl_PointSize = sz * uPixel * uPointScale * uBloomSize;");

const bloomFragmentShader = `
precision highp float;
uniform sampler2D uDotTex;
uniform float uAlpha, uBloomStrength, uPreset, uParticleDim;
varying vec3 vColor;
varying float vBright, vRipple, vEdgeBoost, vAlpha, vSourceLum;

void main(){
  vec4 tex = texture2D(uDotTex, gl_PointCoord);
  if (tex.a < 0.01) discard;
  float soft = tex.a * tex.a;
  vec3 col = vColor * (0.55 + vBright * 0.62);
  col = mix(col, col + vec3(0.22, 0.18, 0.10), vEdgeBoost * 0.35);
  col = clamp(col, vec3(0.0), vec3(1.8));
  float pulse = 1.0 + vRipple * 0.65;
  float keepBlack = 1.0 - smoothstep(0.025, 0.115, vSourceLum);
  float bloomKeep = 1.0 - keepBlack * 0.92;
  gl_FragColor = vec4(col, soft * uAlpha * uBloomStrength * uParticleDim * pulse * 0.55 * vAlpha * bloomKeep);
}
`;

function deriveSyntheticBands(state: RuntimeState, elapsed: number) {
  const volume = clampRange(state.volume || 0, 0, 1);
  const playing = state.isPlaying && volume > 0.02;
  const time = (state.currentTime || 0) + elapsed * 0.08;
  const beatWave = (Math.sin(time * Math.PI * 2 * 0.92) + 1) / 2;
  const subBeat = (Math.sin(time * Math.PI * 2 * 1.74 + 0.7) + 1) / 2;
  const airy = (Math.sin(time * Math.PI * 2 * 0.37 + 2.4) + 1) / 2;
  const progress = clampRange((state.progress || 0) / 100, 0, 1);

  if (!playing) {
    return {
      bass: 0.035,
      mid: 0.045 + airy * 0.025,
      treble: 0.035 + progress * 0.025,
      beat: 0.02,
      energy: 0.05,
    };
  }

  const transient = Math.pow(beatWave, 6);
  const syncopation = Math.pow(subBeat, 9) * 0.45;

  return {
    bass: clampRange((0.12 + transient * 0.72 + syncopation) * volume, 0, 1),
    mid: clampRange((0.10 + Math.pow(airy, 2.2) * 0.44 + transient * 0.08) * volume, 0, 0.78),
    treble: clampRange((0.08 + Math.pow(1 - beatWave, 3.2) * 0.30 + progress * 0.10) * volume, 0, 0.68),
    beat: clampRange((transient * 0.74 + syncopation) * volume, 0, 1),
    energy: clampRange((0.18 + transient * 0.22 + airy * 0.26) * volume, 0, 0.9),
  };
}

export default function MineradioParticleField({
  coverUrl,
  isPlaying,
  progress,
  currentTime,
  volume,
  seed,
  className = "",
}: MineradioParticleFieldProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<RuntimeState>({ isPlaying, progress, currentTime, volume });

  useEffect(() => {
    stateRef.current = { isPlaying, progress, currentTime, volume };
  }, [isPlaying, progress, currentTime, volume]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = reduceQuery.matches;
    let frame = 0;
    let last = performance.now();
    let disposed = false;
    let width = 1;
    let height = 1;
    let lastRippleAt = 0;
    let rippleCursor = 0;
    const ripples: Ripple[] = Array.from({ length: RIPPLE_MAX }, () => ({ x: 0, y: 0, age: -10, str: 0 }));

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.className = "h-full w-full";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90);
    camera.position.set(0, 0, 7.2);
    camera.lookAt(0, 0, 0);

    const resolution = width < 640 || reduceMotion ? 0.78 : 1.0;
    const geometry = buildCoverParticleGeometry(resolution, `${seed}-${coverUrl}`);
    const dotTexture = makeDotTexture();
    const edgeTexture = makeEdgeTexture();
    const prevCoverTexture = makeSolidTexture("#101722");
    let coverTexture: THREE.Texture = makeSolidTexture("#111827");
    const { data: rippleData, texture: rippleTexture } = createRippleTexture();

    const uniforms = {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uBeat: { value: 0 },
      uEnergy: { value: 0 },
      uBurstAmt: { value: 0.35 },
      uVinylSpin: { value: 0 },
      uPreset: { value: stateRef.current.isPlaying ? 0 : 5 },
      uIntensity: { value: 0.9 },
      uDepth: { value: 1.0 },
      uPointScale: { value: reduceMotion ? 0.86 : 1.08 },
      uSpeed: { value: reduceMotion ? 0.08 : 1.0 },
      uTwist: { value: 0.12 },
      uColorBoost: { value: 1.1 },
      uScatter: { value: 0.02 },
      uCoverRes: { value: resolution },
      uBgFade: { value: 0.2 },
      uBloomStrength: { value: reduceMotion ? 0.18 : 0.52 },
      uBloomSize: { value: 2.65 },
      uTintColor: { value: new THREE.Color("#9db8cf") },
      uTintStrength: { value: 0.12 },
      uCoverTex: { value: coverTexture },
      uPrevCoverTex: { value: prevCoverTexture },
      uColorMixT: { value: 1 },
      uEdgeTex: { value: edgeTexture },
      uRippleTex: { value: rippleTexture },
      uRippleCount: { value: RIPPLE_MAX },
      uDotTex: { value: dotTexture },
      uHasCover: { value: 0 },
      uHasDepth: { value: 0 },
      uEdgeEnabled: { value: 0.35 },
      uAiBoost: { value: 0 },
      uMouseXY: { value: new THREE.Vector2(-999, -999) },
      uMouseActive: { value: 0 },
      uHandXY: { value: new THREE.Vector2(-999, -999) },
      uHandActive: { value: 0 },
      uGestureGrip: { value: 0 },
      uPixel: { value: renderer.getPixelRatio() },
      uAlpha: { value: 0 },
      uParticleDim: { value: 1 },
      uFloatAlpha: { value: 0 },
      uLoading: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const bloomMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: bloomVertexShader,
      fragmentShader: bloomFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const bloomParticles = new THREE.Points(geometry, bloomMaterial);
    bloomParticles.frustumCulled = false;
    bloomParticles.renderOrder = 0;
    scene.add(bloomParticles);

    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    particles.renderOrder = 1;
    scene.add(particles);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      coverUrl,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        coverTexture.dispose();
        coverTexture = texture;
        uniforms.uCoverTex.value = texture;
        uniforms.uHasCover.value = 1;
        uniforms.uBurstAmt.value = Math.max(uniforms.uBurstAmt.value, 0.46);
      },
      undefined,
      () => {
        uniforms.uHasCover.value = 0;
      },
    );

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      uniforms.uPixel.value = renderer.getPixelRatio();
      camera.aspect = width / height;
      camera.position.z = width < 640 ? 8.2 : 7.2;
      camera.updateProjectionMatrix();
      if (reduceMotion) renderer.render(scene, camera);
    };

    const pushRipple = (x: number, y: number, strength: number) => {
      const ripple = ripples[rippleCursor];
      ripple.x = x;
      ripple.y = y;
      ripple.age = 0;
      ripple.str = strength;
      rippleCursor = (rippleCursor + 1) % RIPPLE_MAX;
    };

    const updateRipples = (delta: number) => {
      for (let index = 0; index < ripples.length; index += 1) {
        const ripple = ripples[index];
        if (ripple.age >= 0) ripple.age += delta;
        if (ripple.age > 2) {
          ripple.age = -10;
          ripple.str = 0;
        }

        rippleData[index * 4] = ripple.x;
        rippleData[index * 4 + 1] = ripple.y;
        rippleData[index * 4 + 2] = ripple.age;
        rippleData[index * 4 + 3] = ripple.str;
      }
      rippleTexture.needsUpdate = true;
    };

    const render = (now: number) => {
      const delta = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const state = stateRef.current;
      const elapsed = now / 1000;
      const bands = deriveSyntheticBands(state, elapsed);
      const active = state.isPlaying && (state.volume || 0) > 0.02;
      const targetPreset = active ? 0 : 5;
      const ease = Math.min(1, delta * 8);

      uniforms.uTime.value += reduceMotion ? delta * 0.04 : delta;
      uniforms.uPreset.value = reduceMotion ? 5 : targetPreset;
      uniforms.uIntensity.value = 0.82 + clampRange(state.volume || 0, 0, 1) * 0.34;
      uniforms.uPointScale.value += ((reduceMotion ? 0.78 : active ? 1.16 : 0.94) - uniforms.uPointScale.value) * ease;
      uniforms.uSpeed.value += ((reduceMotion ? 0.06 : active ? 1.0 : 0.42) - uniforms.uSpeed.value) * ease;
      uniforms.uBloomStrength.value += ((reduceMotion ? 0.16 : active ? 0.58 : 0.38) - uniforms.uBloomStrength.value) * ease;
      uniforms.uAlpha.value += ((reduceMotion ? 0.64 : 0.92) - uniforms.uAlpha.value) * Math.min(1, delta * 2.8);
      uniforms.uBurstAmt.value *= Math.pow(0.09, delta);
      uniforms.uBass.value += (bands.bass - uniforms.uBass.value) * Math.min(1, delta * 8.5);
      uniforms.uMid.value += (bands.mid - uniforms.uMid.value) * Math.min(1, delta * 6.5);
      uniforms.uTreble.value += (bands.treble - uniforms.uTreble.value) * Math.min(1, delta * 7.5);
      uniforms.uBeat.value += (bands.beat - uniforms.uBeat.value) * Math.min(1, delta * 10);
      uniforms.uEnergy.value += (bands.energy - uniforms.uEnergy.value) * Math.min(1, delta * 5.5);
      uniforms.uTintStrength.value = active ? 0.08 + bands.energy * 0.18 : 0.16;
      uniforms.uVinylSpin.value = (uniforms.uVinylSpin.value + delta * (0.4 + bands.bass * 0.09)) % (Math.PI * 2);

      if (!reduceMotion && bands.beat > 0.56 && now - lastRippleAt > 260) {
        lastRippleAt = now;
        const rippleX = (Math.random() - 0.5) * 1.2;
        const rippleY = (Math.random() - 0.5) * 0.9;
        pushRipple(rippleX, rippleY, clampRange(0.35 + bands.beat * 0.62, 0.35, 0.96));
      }
      updateRipples(delta);

      const targetRotY = active ? Math.sin(elapsed * 0.42) * 0.08 : Math.sin(elapsed * 0.22) * 0.04;
      const targetRotX = active ? Math.cos(elapsed * 0.36) * 0.052 : Math.cos(elapsed * 0.2) * 0.025;
      particles.rotation.y += (targetRotY - particles.rotation.y) * 0.055;
      particles.rotation.x += (targetRotX - particles.rotation.x) * 0.055;
      bloomParticles.rotation.copy(particles.rotation);

      renderer.render(scene, camera);
      if (!reduceMotion) frame = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) {
        handlePointerLeave();
        return;
      }
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      uniforms.uMouseXY.value.set(x * (PLANE_SIZE / 2), y * (PLANE_SIZE / 2) * (rect.height / rect.width));
      uniforms.uMouseActive.value = 1;
    };

    const handlePointerLeave = () => {
      uniforms.uMouseActive.value = 0;
      uniforms.uMouseXY.value.set(-999, -999);
    };

    const handleMotionChange = () => {
      reduceMotion = reduceQuery.matches;
      window.cancelAnimationFrame(frame);
      last = performance.now();
      frame = window.requestAnimationFrame(render);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("blur", handlePointerLeave);
    reduceQuery.addEventListener("change", handleMotionChange);
    frame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handlePointerLeave);
      reduceQuery.removeEventListener("change", handleMotionChange);
      window.cancelAnimationFrame(frame);
      scene.remove(particles);
      scene.remove(bloomParticles);
      geometry.dispose();
      material.dispose();
      bloomMaterial.dispose();
      dotTexture.dispose();
      edgeTexture.dispose();
      prevCoverTexture.dispose();
      coverTexture.dispose();
      rippleTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [coverUrl, seed]);

  return (
    <div
      ref={mountRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
