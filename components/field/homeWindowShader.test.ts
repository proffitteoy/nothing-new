import test from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { HOME_WINDOW_FRAGMENT } from "./homeWindowShader"

test("initial homepage retains the pre-transition composition and shader formulas", () => {
  // This digest comes from c966422's original homepage shader, with version and
  // blank lines removed. Transition-only alpha controls must not alter its RGB.
  const resting = HOME_WINDOW_FRAGMENT.replace("uniform float uReveal;", "")
    .replace("uniform float uWindowCrop;", "")
    .replace(
      "  float border=step(.04,r.x)*(1.-step(.96,r.x))*step(.025,r.y)*(1.-step(.84,r.y));",
      "",
    )
    .replace("  float wallAlpha=mix(1.,border,uWindowCrop);", "")
    .replaceAll("homeUv", "uv")
    .replace("colour=vec4(interior.rgb,wallAlpha)", "colour=vec4(interior.rgb,1.)")
    .replace("max(interior.a,1.-uReveal)*wallAlpha", "1.")
    .split("\n")
    .filter((line) => line.trim())
    .join("\n")
    .trim()
  assert.equal(
    createHash("sha256").update(resting).digest("hex"),
    "0ce117cd2cf46f1cd51aea736613ea332fd06b595ce8099696dc93e5345fc6e2",
  )
})
