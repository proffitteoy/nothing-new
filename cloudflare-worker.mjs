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
  fetch(request) {
    return worker.fetch(request, withSelfReference(this.env, this.ctx), this.ctx)
  }
}
