// Keep only the two compressed source files (3.4 MiB). Each mounted scene owns
// its decoded images, geometry, spatial index and GPU resources independently.
let pending: Promise<[ArrayBuffer, Blob]> | null = null
export function preloadRoomAssets(): Promise<[ArrayBuffer, Blob]> {
  if (!pending) {
    const signal = AbortSignal.timeout(20000)
    pending = Promise.all([
      fetch("/projects-room/study.glb", { signal }).then((response) => {
        if (!response.ok) throw new Error("Room asset unavailable")
        return response.arrayBuffer()
      }),
      fetch("/projects-room/study-night.jpg", { signal }).then((response) => {
        if (!response.ok) throw new Error("Night lighting unavailable")
        return response.blob()
      }),
    ]).catch((error) => {
      pending = null
      throw error
    })
  }
  return pending
}
