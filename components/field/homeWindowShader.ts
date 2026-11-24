import { SPECTRAL_DIRECTION_GLSL } from "./spectralField"

// Reuse the original lake, cloud, branch and spectral-water formulas inside the
// actual rear glazing. The photographed room layer is disabled at runtime.
export const HOME_WINDOW_FRAGMENT = `
precision highp float;
in vec2 homeUv;
out vec4 colour;
uniform sampler2D uLake;
uniform sampler2D uRoom;
uniform sampler2D uSky;
uniform sampler2D uClouds;
uniform sampler2D uBranch;
uniform sampler2D uSkyRegion;
uniform sampler2D uRoomLight;
uniform vec2 uSize;
uniform vec4 uRoomRect;
uniform vec4 uLakeRect;
uniform vec2 uLook;
uniform float uStrength;
uniform float uTime;
uniform float uWorldTime;
uniform float uAmbientBlend;
uniform float uInteriorOpacity;
uniform float uReveal;
uniform float uWindowCrop;
uniform vec4 uEffects;
${SPECTRAL_DIRECTION_GLSL}
float rise(float a,float b,float x){ float v=clamp((x-a)/(b-a),0.,1.); return v*v*(3.-2.*v); }
float waterMask(vec2 p){
  float xs[8]=float[8](0.,103.,252.,459.,802.,1118.,1414.,1672.);
  float ys[8]=float[8](579.,558.,552.,549.,548.,545.,546.,544.);
  float edge=ys[7]/877.; float x=clamp(p.x*1672.,0.,1672.);
  for(int i=0;i<7;i++) if(x>=xs[i] && x<=xs[i+1]) edge=mix(ys[i],ys[i+1],(x-xs[i])/(xs[i+1]-xs[i]))/877.;
  return rise(edge+.012,edge+.06,p.y)*(1.-rise(.80,.86,p.y))*rise(.09,.16,p.x)*(1.-rise(.96,.99,p.x));
}
// Water's parameter domain: fine waves at the distant bank, broader nearby.
// The field itself is unchanged; the object supplies its own coordinate map.
vec2 waterDomain(vec2 p) {
  float depth = max(p.y - .62, 0.);
  return vec2((p.x-.5)*2. / (depth+.20), log(depth+.025)*1.4);
}
float skyCoverage(vec2 p) {
  if(any(lessThan(p,vec2(0.))) || any(greaterThan(p,vec2(1.)))) return 0.;
  return texture(uSkyRegion,vec2(p.x,1.-p.y)).r;
}
float windTravel(float seconds) {
  return seconds + .6*(1.-cos(seconds*6.2831853/24.));
}
vec4 cloudTile(vec2 p) {
  if(p.x<=0. || p.x>=1. || p.y<=0. || p.y>=316./877.) return vec4(0.);
  vec4 value=texture(uClouds,vec2(p.x,1.-p.y/(316./877.)));
  value.a*=.30*rise(0.,.03,p.x)*(1.-rise(.97,1.,p.x));
  return value;
}
vec4 cloudAt(vec2 p,float seconds) {
  // Repeated sprites cross the edges outside the view; no wrap seam sweeps the sky.
  float travel=mod(windTravel(seconds)/uLakeRect.z,2.4);
  vec4 a=cloudTile(p-vec2(travel,0.));
  vec4 b=cloudTile(p-vec2(travel-2.4,0.));
  return a.a>b.a ? a : b;
}
vec4 nearBranch(vec2 p,float seconds) {
  float gust=.85+.15*sin(seconds*6.2831853/24.);
  vec2 sway=vec2(sin(seconds*6.2831853/6.)+.18*sin(seconds*1.73),.25*sin(seconds*6.2831853/6.+1.));
  vec2 q=p-sway*(3./1.18)*gust*(1.-rise(.13,.23,p.y))/uLakeRect.zw;
  if(q.x<0. || q.x>168./1672. || q.y<0. || q.y>246./877.) return vec4(0.);
  vec4 value=texture(uBranch,vec2(q.x/(168./1672.),1.-q.y/(246./877.)));
  value.a*=1.-rise(.20,.28,q.y);
  return value;
}
void main(){
  vec2 pixel=vec2(homeUv.x,1.-homeUv.y)*uSize;
  vec2 r=(pixel-uRoomRect.xy)/uRoomRect.zw;
  float border=step(.04,r.x)*(1.-step(.96,r.x))*step(.025,r.y)*(1.-step(.84,r.y));
  float wallAlpha=mix(1.,border,uWindowCrop);
  vec4 interior=texture(uRoom,vec2(r.x,1.-r.y));
  interior.a*=uInteriorOpacity;
  if(uAmbientBlend>0.) {
    vec3 receiver=texture(uRoomLight,vec2(r.x,1.-r.y)).rgb;
    float sunlight=cloudAt(receiver.rg,uWorldTime*uEffects.z).a;
    // Authored direct contribution only. The environment base remains lit.
    interior.rgb*=1.-uAmbientBlend*.30*receiver.b*sunlight;
  }
  if(interior.a>.99999){ colour=vec4(interior.rgb,wallAlpha); return; }
  vec2 p=(pixel-uLakeRect.xy+uLook)/uLakeRect.zw;
  float mask=waterMask(p);
  vec2 response=vec2(0.);
  if(mask>0. && uStrength>0.) response=spectralWaterDirection(waterDomain(p),uTime)*mask*uStrength/uLakeRect.zw;
  vec2 samplePoint=p+response;
  vec3 exterior=texture(uLake,vec2(samplePoint.x,1.-samplePoint.y)).rgb;
  if(uAmbientBlend>0.) {
    float coverage=skyCoverage(p);
    if(coverage>0.) {
      vec3 clearSky=texture(uSky,vec2(p.x,1.-p.y)).rgb;
      vec4 cloud=cloudAt(p,uWorldTime*uEffects.x);
      clearSky=mix(clearSky,cloud.rgb,cloud.a);
      vec4 leaves=nearBranch(p,uWorldTime*uEffects.w);
      clearSky=mix(clearSky,leaves.rgb,leaves.a);
      exterior=mix(exterior,clearSky,coverage*uAmbientBlend);
    }
    // Cloud reflection stays disabled: the candidate clean plate changed
    // protected photographic water detail and failed registration review.
  }
  colour=vec4(mix(exterior,interior.rgb,interior.a),max(interior.a,1.-uReveal)*wallAlpha);
}`
