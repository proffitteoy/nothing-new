import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { NextRequest } from "next/server"
import { GET } from "./route"
import { fetchNeteaseSongsByIds } from "./_mineradio"

const request = (ids?: string) => {
  const url = new URL("http://localhost/api/music")
  if (ids !== undefined) url.searchParams.set("ids", ids)
  return new NextRequest(url)
}

describe("music API request boundaries", () => {
  it("rejects empty and invalid IDs before doing any upstream work", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => {
      throw new Error("invalid input must not fetch")
    })
    for (const ids of [
      undefined,
      "",
      " , , ",
      "0",
      "-1",
      "1.5",
      "1e3",
      "01",
      "abc",
      "1,2/x",
      "9007199254740992",
    ]) {
      const response = await GET(request(ids))
      assert.equal(response.status, 400, String(ids))
      assert.equal(typeof (await response.json()).error, "string")
    }
    assert.equal(fetch.mock.callCount(), 0)
  })

  it("rejects over 32 submitted IDs, including repeated IDs, before fetching", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => {
      throw new Error("oversized batches must not fetch")
    })
    for (const ids of [Array.from({ length: 33 }, (_, i) => String(i + 1)), Array(33).fill("1")]) {
      assert.equal((await GET(request(ids.join(",")))).status, 400)
    }
    assert.equal(fetch.mock.callCount(), 0)
  })

  it("trims and deduplicates in first occurrence order without duplicate upstream work", async (t) => {
    const seen: string[] = []
    t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
      const url = new URL(String(input))
      const id = url.searchParams.get("id")!
      seen.push(`${url.pathname}:${id}`)
      return Response.json(
        url.pathname.includes("detail")
          ? { songs: [{ id, name: `Song ${id}` }] }
          : { lrc: { lyric: `Lyrics ${id}` } },
      )
    })
    const response = await GET(request(" 3, 1,3,,2,1 "))
    assert.equal(response.status, 200)
    const songs = await response.json()
    assert.deepEqual(
      songs.map((song: { id: string }) => song.id),
      ["3", "1", "2"],
    )
    assert.deepEqual(
      songs.map((song: { lrc: string }) => song.lrc),
      ["Lyrics 3", "Lyrics 1", "Lyrics 2"],
    )
    assert.equal(seen.length, 6)
    assert.equal(new Set(seen).size, 6)
  })

  it("accepts 32 IDs while bounding detail and lyric requests together to four", async (t) => {
    let active = 0
    let peak = 0
    const completed: string[] = []
    const fetch = t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
      const url = new URL(String(input))
      const id = url.searchParams.get("id")!
      active++
      peak = Math.max(peak, active)
      try {
        // Different completion order must not reorder the returned playlist.
        await new Promise((resolve) => setTimeout(resolve, Number(id) % 4))
        if (url.pathname.includes("detail")) return Response.json({ songs: [{ id }] })
        completed.push(id)
        return Response.json({ lrc: { lyric: "[00:00.00]Test" } })
      } finally {
        active--
      }
    })
    const ids = Array.from({ length: 32 }, (_, i) => String(i + 1))
    const response = await GET(request(ids.join(",")))
    assert.equal(response.status, 200)
    assert.deepEqual(
      (await response.json()).map((song: { id: string }) => song.id),
      ids,
    )
    assert.equal(peak, 4)
    assert.equal(active, 0)
    assert.equal(fetch.mock.callCount(), 64)
    assert.equal(completed.length, 32)
  })

  it("isolates missing songs, detail failures and lyric failures without losing order", async (t) => {
    const lyrics: string[] = []
    t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
      const url = new URL(String(input))
      const id = url.searchParams.get("id")!
      if (url.pathname.includes("detail")) {
        if (id === "2") return Response.json({ songs: [] })
        if (id === "3") return new Response(null, { status: 503 })
        return Response.json({ songs: [{ id, name: `Song ${id}` }] })
      }
      lyrics.push(id)
      if (id === "4") throw new Error("lyric unavailable")
      return Response.json({ lrc: { lyric: "[00:00.00]Test" } })
    })
    const response = await GET(request("1,2,3,4,5"))
    assert.equal(response.status, 200)
    const songs = await response.json()
    assert.deepEqual(
      songs.map((song: { id: string }) => song.id),
      ["1", "2", "3", "4", "5"],
    )
    assert.equal(songs[1].error, "not_found")
    assert.equal(songs[2].error, "HTTP 503")
    assert.equal(songs[3].lrc, "")
    assert.equal(songs[3].name, "Song 4")
    assert.equal(songs[4].lrc, "[00:00.00]Test")
    assert.deepEqual(lyrics.sort(), ["1", "4", "5"])
  })

  it("does no work for an empty internal batch", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => {
      throw new Error("empty batches must not fetch")
    })
    assert.deepEqual(await fetchNeteaseSongsByIds([]), [])
    assert.equal(fetch.mock.callCount(), 0)
  })
})
