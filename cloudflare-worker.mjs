import { WorkerEntrypoint } from "cloudflare:workers"
import worker, { DOQueueHandler as OpenNextDOQueueHandler } from "./.open-next/worker.js"

export { DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js"

// Loopback calls stay in this deployment, including branch Previews.
function withSelfReference(env, ctx) {
  return { ...env, WORKER_SELF_REFERENCE: ctx.exports.default }
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
    return worker.fetch(request, withSelfReference(this.env, this.ctx), this.ctx)
  }
}
