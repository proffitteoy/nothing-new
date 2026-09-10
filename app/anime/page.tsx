import { getAnimeBlobBaseUrl } from "../../lib/anime/blob"
import AnimeShelf from "./AnimeShelf"

export default function AnimePage() {
  let snapshotBaseUrl: string | null = null

  try {
    snapshotBaseUrl = getAnimeBlobBaseUrl()
  } catch (error) {
    console.warn(
      "[AnimePage] Vercel Blob is not configured:",
      error instanceof Error ? error.message : "unknown error",
    )
  }

  return <AnimeShelf snapshotBaseUrl={snapshotBaseUrl} />
}
