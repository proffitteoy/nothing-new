import { DurableObject, WorkerEntrypoint } from "cloudflare:workers"
import worker, { DOQueueHandler as OpenNextDOQueueHandler } from "./.open-next/worker.js"

export { DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js"

// Loopback calls stay in this deployment, including branch Previews.
function withSelfReference(env, ctx) {
  return { ...env, WORKER_SELF_REFERENCE: ctx.exports.default }
}

// Keep the application's existing KV interface while using strongly consistent SQLite writes.
// Existing immutable content remains readable from KV without copying all covers again.
function runtimeStorage(env, scope, fallback) {
  const store = (key) => env.SITE_RUNTIME.getByName(`store:${scope}:${key}`)
  const read = async (key) => {
    const stored = await store(key).readValue()
    return (
      stored ??
      (fallback
        ? await fallback.getWithMetadata(key, { type: "arrayBuffer", cacheTtl: 60 })
        : { value: null, metadata: null })
    )
  }
  const decode = (value, options) => {
    if (value === null) return null
    const type = typeof options === "string" ? options : options?.type
    if (type === "arrayBuffer") return value
    const text = new TextDecoder().decode(value)
    return type === "json" ? JSON.parse(text) : text
  }
  return {
    async get(key, options) {
      return decode((await read(key)).value, options)
    },
    async getWithMetadata(key, options) {
      const stored = await read(key)
      return { value: decode(stored.value, options), metadata: stored.metadata }
    },
    async put(key, value, options = {}) {
      const body = await new Response(value).arrayBuffer()
      await store(key).writeValue(body, options.metadata ?? null)
    },
    async delete(key) {
      await store(key).deleteValue()
    },
  }
}

export class SiteRuntime extends DurableObject {
  async fetch(request) {
    // A DurableObjectState lasts across requests; OpenNext and blob write visibility must not.
    const ctx = {
      exports: this.ctx.exports,
      waitUntil: this.ctx.waitUntil.bind(this.ctx),
      passThroughOnException() {},
    }
    const env = {
      ...this.env,
      NEXT_INC_CACHE_KV: runtimeStorage(this.env, "cache"),
      SITE_CONTENT: runtimeStorage(this.env, "content", this.env.SITE_CONTENT),
    }
    return worker.fetch(request, withSelfReference(env, ctx), ctx)
  }

  async readValue() {
    return this.ctx.storage.transaction(async (storage) => {
      const meta = await storage.get("meta")
      if (!meta) return null
      if (meta.deleted) return { value: null, metadata: null }
      const keys = Array.from({ length: meta.chunks }, (_, index) => String(index))
      const chunks = keys.length ? await storage.get(keys) : new Map()
      const value = new Uint8Array(meta.size)
      let offset = 0
      for (const key of keys) {
        const chunk = chunks.get(key)
        if (!chunk) throw new Error("Stored content is incomplete")
        value.set(new Uint8Array(chunk), offset)
        offset += chunk.byteLength
      }
      return { value: value.buffer, metadata: meta.metadata }
    })
  }

  async writeValue(value, metadata) {
    // A cover can reach 8 MiB; each SQLite KV value must stay below its 8 MB limit.
    const chunkSize = 2 * 1024 * 1024
    const chunks = Math.ceil(value.byteLength / chunkSize)
    await this.ctx.storage.transaction(async (storage) => {
      const previous = await storage.get("meta")
      const entries = { meta: { size: value.byteLength, chunks, metadata } }
      for (let index = 0; index < chunks; index++) {
        entries[String(index)] = value.slice(index * chunkSize, (index + 1) * chunkSize)
      }
      await storage.put(entries)
      const obsolete = Array.from(
        { length: Math.max(0, (previous?.chunks ?? 0) - chunks) },
        (_, index) => String(chunks + index),
      )
      if (obsolete.length) await storage.delete(obsolete)
    })
  }

  async deleteValue() {
    await this.ctx.storage.transaction(async (storage) => {
      const previous = await storage.get("meta")
      const keys = Array.from({ length: previous?.chunks ?? 0 }, (_, index) => String(index))
      if (keys.length) await storage.delete(keys)
      // A tombstone prevents a deleted value from reappearing through the legacy KV fallback.
      await storage.put("meta", { deleted: true })
    })
  }
}

export class DOQueueHandler extends OpenNextDOQueueHandler {
  constructor(ctx, env) {
    super(ctx, withSelfReference(env, ctx))
  }
}

export default class CloudflareWorker extends WorkerEntrypoint {
  async scheduled() {
    if (!this.env.CRON_SECRET) throw new Error("Anime cron secret is not configured")
    const response = await this.fetch(
      new Request("https://nothing-new.cn/api/anime/sync", {
        headers: { Authorization: `Bearer ${this.env.CRON_SECRET}` },
      }),
    )
    if (!response.ok) throw new Error(`Anime cron returned ${response.status}`)
    await response.arrayBuffer()
  }

  async fetch(request) {
    const url = new URL(request.url)
    // OpenNext does not apply Next rewrites when resolving a static asset.
    if (url.pathname === "/avatar" && ["GET", "HEAD"].includes(request.method)) {
      url.pathname = "/avatar.jpg"
      const asset = await this.env.ASSETS.fetch(new Request(url, request))
      const response = new Response(asset.body, asset)
      response.headers.set(
        "Cache-Control",
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      )
      return response
    }
    // SQLite Durable Objects provide the Free plan's 30-second server execution budget.
    return this.env.SITE_RUNTIME.getByName(`request:${url.pathname}`).fetch(request)
  }
}
