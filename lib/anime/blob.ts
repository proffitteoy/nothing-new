import "server-only"

import { fetchBlob, getBlobUrl, putBlob, readBlobJson, readBlobText } from "../blob"

export function getAnimeBlobUrl(pathname: string) {
  return getBlobUrl(pathname)
}

export function getAnimePublicAssetPath(pathname: string) {
  const cleanPath = pathname.replace(/^\/+/, "").replace(/^anime\//, "")
  return `/anime/blob/${cleanPath}`
}

export const putAnimeBlob = putBlob
export const fetchAnimeBlob = fetchBlob
export const readAnimeBlobJson = readBlobJson
export const readAnimeBlobText = readBlobText
