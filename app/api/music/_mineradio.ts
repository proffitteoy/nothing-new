const NET_EASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Referer: 'https://music.163.com/',
}

export type MusicApiSong = {
  id: string
  name?: string
  artist?: string
  author?: string
  album?: string
  cover?: string
  pic?: string
  url?: string
  lrc?: string
  duration?: number
  source?: 'netease'
  error?: string
}

type NeteaseArtist = {
  id?: string | number
  name?: string
}

type NeteaseAlbum = {
  name?: string
  picUrl?: string
  coverUrl?: string
}

type NeteaseSong = {
  id?: string | number
  name?: string
  ar?: NeteaseArtist[]
  artists?: NeteaseArtist[]
  al?: NeteaseAlbum
  album?: NeteaseAlbum
  dt?: number
  duration?: number
}

async function fetchJson<T>(url: string, timeout = 7000): Promise<T> {
  const res = await fetch(url, {
    headers: NET_EASE_HEADERS,
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

function artistName(song: NeteaseSong) {
  const artists = song.ar || song.artists || []
  const names = artists.map((artist) => artist.name).filter(Boolean)
  return names.join(' / ') || '未知歌手'
}

function mapNeteaseSong(song: NeteaseSong): MusicApiSong | null {
  if (!song.id) return null

  const album = song.al || song.album || {}
  const artist = artistName(song)

  return {
    id: String(song.id),
    name: song.name || `网易云音乐 ${song.id}`,
    artist,
    author: artist,
    album: album.name || '',
    cover: album.picUrl || album.coverUrl || '',
    pic: album.picUrl || album.coverUrl || '',
    url: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`,
    duration: song.dt || song.duration || 0,
    source: 'netease',
  }
}

async function fetchNeteaseLyric(songId: string) {
  try {
    const lyric = await fetchJson<{ lrc?: { lyric?: string } }>(
      `https://music.163.com/api/song/lyric?id=${encodeURIComponent(songId)}&lv=-1&kv=-1&tv=-1`,
    )
    return lyric.lrc?.lyric || ''
  } catch {
    return ''
  }
}

export async function fetchNeteaseSongsByIds(ids: string[]) {
  const songIds = ids.map((id) => id.trim()).filter(Boolean)

  const results: MusicApiSong[] = new Array(songIds.length)
  let nextIndex = 0
  // Each worker awaits both detail and lyric, bounding all upstream work for this batch.
  await Promise.all(
    Array.from({ length: Math.min(4, songIds.length) }, async () => {
      while (nextIndex < songIds.length) {
        const index = nextIndex++
        const songId = songIds[index]
        try {
          const detail = await fetchJson<{ songs?: NeteaseSong[] }>(
            `https://music.163.com/api/song/detail/?id=${encodeURIComponent(songId)}&ids=[${encodeURIComponent(songId)}]`,
          )
          const song = detail.songs?.[0]
          const mapped = song ? mapNeteaseSong(song) : null

          if (!mapped) {
            results[index] = { id: songId, error: 'not_found' }
            continue
          }

          results[index] = {
            ...mapped,
            lrc: await fetchNeteaseLyric(songId),
          }
        } catch (error) {
          results[index] = {
            id: songId,
            name: `网易云音乐 ${songId}`,
            artist: '网易云音乐',
            author: '网易云音乐',
            cover: '',
            pic: '',
            url: `https://music.163.com/song/media/outer/url?id=${songId}.mp3`,
            lrc: '',
            error: error instanceof Error ? error.message : 'fetch_failed',
          }
        }
      }
    }),
  )
  return results
}
