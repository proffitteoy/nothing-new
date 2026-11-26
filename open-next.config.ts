import { defineCloudflareConfig } from "@opennextjs/cloudflare"
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache"
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue"
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache"

export default defineCloudflareConfig({
  incrementalCache: {
    name: "site-runtime-cache",
    get: kvIncrementalCache.get.bind(kvIncrementalCache),
    set: kvIncrementalCache.set.bind(kvIncrementalCache),
    delete: kvIncrementalCache.delete.bind(kvIncrementalCache),
  },
  queue: doQueue,
  tagCache: doShardedTagCache(),
})
