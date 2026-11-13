// Keep only the self-contained model. Each mounted scene owns
// its decoded images, geometry, spatial index and GPU resources independently.
let pending: Promise<ArrayBuffer> | null = null
export function preloadRoomAssets(): Promise<ArrayBuffer> {
  if (!pending) {
    const signal = AbortSignal.timeout(20000)
    pending = fetch("/projects-room/study.glb", { signal })
      .then((response) => {
        if (!response.ok) throw new Error("Room asset unavailable")
        return response.arrayBuffer()
      })
      .catch((error) => {
        pending = null
        throw error
      })
  }
  return pending
}
