export function animeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown error"
}

export function logAnimeInfo(event: string, fields: Record<string, unknown>) {
  console.info(`[anime] ${event}`, fields)
}

export function logAnimeError(event: string, fields: Record<string, unknown>) {
  console.error(`[anime] ${event}`, fields)
}
