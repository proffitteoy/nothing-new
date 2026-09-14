export type BlobCachePolicy = {
  browser: string
  cdn: string
}

export const SITE_IMAGE_CACHE_POLICY: BlobCachePolicy = {
  browser: "public, max-age=3600, stale-while-revalidate=86400",
  cdn: "public, max-age=86400, stale-while-revalidate=604800, stale-if-error=604800",
}

export function buildBlobResponse(upstream: Response, cachePolicy: BlobCachePolicy) {
  if (upstream.status !== 200 && upstream.status !== 304) {
    return new Response("Not found", {
      status: upstream.status === 404 ? 404 : 502,
      headers: { "Cache-Control": "no-store" },
    })
  }

  const headers = new Headers({
    "Cache-Control": cachePolicy.browser,
    "CDN-Cache-Control": cachePolicy.cdn,
    "Vercel-CDN-Cache-Control": cachePolicy.cdn,
    "X-Content-Type-Options": "nosniff",
  })
  for (const name of ["content-type", "content-length", "etag", "last-modified"]) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }

  return new Response(upstream.status === 304 ? null : upstream.body, {
    status: upstream.status,
    headers,
  })
}
