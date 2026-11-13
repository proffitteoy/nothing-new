import "server-only"

import { fetchBlob, putBlob, readBlobJson, readBlobText } from "../blob"

export function getAnimePublicAssetPath(pathname: string) {
  const cleanPath = pathname.replace(/^\/+/, "").replace(/^anime\//, "")
  return `/anime/blob/${cleanPath}`
}

export const putAnimeBlob = putBlob
export const fetchAnimeBlob = fetchBlob
export const readAnimeBlobJson = readBlobJson
export const readAnimeBlobText = readBlobText
