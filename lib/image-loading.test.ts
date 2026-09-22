import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import {
  getImageLoadingPolicy,
  getSizedMusicCoverUrl,
  isNeteaseMusicCoverUrl,
  useNearViewport,
} from "./image-loading"

describe("image loading policies", () => {
  it("uses separate mobile and desktop anime policies", () => {
    assert.deepEqual(getImageLoadingPolicy("anime", { desktop: false }), {
      immediateBudget: 4,
      nearViewportMarginPx: 256,
    })
    assert.deepEqual(getImageLoadingPolicy("anime", { desktop: true }), {
      immediateBudget: 6,
      nearViewportMarginPx: 320,
    })
  })

  it("reduces eager work on Save-Data and 2G connections", () => {
    assert.deepEqual(getImageLoadingPolicy("anime", { desktop: true, saveData: true }), {
      immediateBudget: 2,
      nearViewportMarginPx: 0,
    })
    assert.deepEqual(getImageLoadingPolicy("anime", { desktop: false, effectiveType: "slow-2g" }), {
      immediateBudget: 2,
      nearViewportMarginPx: 0,
    })
    assert.deepEqual(getImageLoadingPolicy("chatter", { desktop: false, effectiveType: "2g" }), {
      immediateBudget: 1,
      nearViewportMarginPx: 0,
    })
  })

  it("keeps chatter startup at the two-column mobile minimum", () => {
    assert.deepEqual(getImageLoadingPolicy("chatter", { desktop: false }), {
      immediateBudget: 2,
      nearViewportMarginPx: 256,
    })
    assert.deepEqual(getImageLoadingPolicy("chatter", { desktop: true }), {
      immediateBudget: 2,
      nearViewportMarginPx: 320,
    })
  })
})

describe("near viewport server rendering", () => {
  function Cover({ immediate }: { immediate: boolean }) {
    const { elementRef, shouldLoad } = useNearViewport<HTMLSpanElement>(immediate, 256)
    return createElement(
      "span",
      { ref: elementRef },
      shouldLoad ? createElement("img", { src: "/cover.webp", alt: "", loading: "lazy" }) : null,
    )
  }

  it("includes immediate images in server output", () => {
    assert.match(renderToStaticMarkup(createElement(Cover, { immediate: true })), /<img /)
  })

  it("does not expose deferred image URLs before reaching the viewport", () => {
    assert.equal(renderToStaticMarkup(createElement(Cover, { immediate: false })), "<span></span>")
  })
})

describe("music cover sizing", () => {
  it("adds and replaces NetEase image sizing parameters", () => {
    const cover = "https://p2.music.126.net/path/cover.jpg"
    assert.equal(getSizedMusicCoverUrl(cover, 256), `${cover}?param=256y256`)
    assert.equal(
      getSizedMusicCoverUrl(`${cover}?param=64y64&foo=bar`, 128),
      `${cover}?param=128y128&foo=bar`,
    )
  })

  it("leaves other and invalid URLs unchanged", () => {
    const external = "https://images.example/cover.jpg"
    assert.equal(getSizedMusicCoverUrl(external, 256), external)
    assert.equal(getSizedMusicCoverUrl("not a url", 128), "not a url")
    assert.equal(isNeteaseMusicCoverUrl(external), false)
    assert.equal(isNeteaseMusicCoverUrl("https://music.126.net/cover.jpg"), true)
  })
})
