const NET_EASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Referer: 'https://music.163.com/',
}

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const OPEN_METEO_GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'

const DEFAULT_WEATHER_LOCATION = {
  name: '上海',
  latitude: 31.2304,
  longitude: 121.4737,
  timezone: 'Asia/Shanghai',
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

type WeatherMood = {
  key: string
  title: string
  subtitle: string
  energy: number
  focus: number
  warmth: number
  keywords: string[]
}

type WeatherInfo = {
  provider: 'open-meteo'
  label: string
  temperature: number | null
  apparentTemperature: number | null
  humidity: number | null
  precipitation: number | null
  windSpeed: number | null
  weatherCode: number | null
  isDay: number | null
  time: string
  location: {
    name: string
    country?: string
    admin1?: string
    latitude: number | null
    longitude: number | null
    timezone: string
    fallback?: boolean
  }
  mood: WeatherMood
  error?: string
  updatedAt: number
}

export type WeatherRadioResult = {
  ok: boolean
  weather: WeatherInfo
  radio: {
    title: string
    subtitle: string
    seedQueries: string[]
    songs: MusicApiSong[]
    updatedAt: number
  }
}

function toNumber(value: unknown, fallback: number | null = null) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
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

  return Promise.all(
    songIds.map(async (songId): Promise<MusicApiSong> => {
      try {
        const detail = await fetchJson<{ songs?: NeteaseSong[] }>(
          `https://music.163.com/api/song/detail/?id=${encodeURIComponent(songId)}&ids=[${encodeURIComponent(songId)}]`,
        )
        const song = detail.songs?.[0]
        const mapped = song ? mapNeteaseSong(song) : null

        if (!mapped) {
          return { id: songId, error: 'not_found' }
        }

        return {
          ...mapped,
          lrc: await fetchNeteaseLyric(songId),
        }
      } catch (error) {
        return {
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
    }),
  )
}

export async function searchNeteaseSongs(keywords: string, limit = 16) {
  const query = keywords.trim()
  if (!query) return []

  const url = new URL('https://music.163.com/api/search/get/web')
  url.searchParams.set('csrf_token', '')
  url.searchParams.set('type', '1')
  url.searchParams.set('s', query)
  url.searchParams.set('offset', '0')
  url.searchParams.set('limit', String(clamp(limit, 1, 30, 16)))

  const body = await fetchJson<{ result?: { songs?: NeteaseSong[] } }>(url.toString())
  return (body.result?.songs || [])
    .map(mapNeteaseSong)
    .filter((song): song is MusicApiSong => Boolean(song))
}

function weatherLabel(code: number | null) {
  if (code === 0) return '晴'
  if (code === 1 || code === 2) return '少云'
  if (code === 3) return '阴'
  if (code === 45 || code === 48) return '雾'
  if ([51, 53, 55, 56, 57].includes(code || -1)) return '毛毛雨'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code || -1)) return '雨'
  if ([71, 73, 75, 77, 85, 86].includes(code || -1)) return '雪'
  if ([95, 96, 99].includes(code || -1)) return '雷雨'
  return '天气'
}

function moodFromWeather(weather: Pick<WeatherInfo, 'weatherCode' | 'temperature' | 'apparentTemperature' | 'humidity' | 'precipitation' | 'windSpeed' | 'isDay'>): WeatherMood {
  const hour = new Date().getHours()
  const code = weather.weatherCode
  const feels = weather.apparentTemperature ?? weather.temperature ?? 20
  const humidity = weather.humidity ?? 0
  const rain = weather.precipitation ?? 0
  const wind = weather.windSpeed ?? 0
  const night = weather.isDay === 0 || hour < 6 || hour >= 20
  const morning = hour >= 5 && hour < 11
  const dusk = hour >= 17 && hour < 20
  const rainy = rain > 0 || [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code || -1)
  const snowy = [71, 73, 75, 77, 85, 86].includes(code || -1)
  const cloudy = [2, 3, 45, 48].includes(code || -1)
  const storm = [95, 96, 99].includes(code || -1)

  let mood: WeatherMood = {
    key: 'clear',
    title: '晴朗电台',
    subtitle: '让节奏亮一点，像窗边的光',
    energy: 0.62,
    focus: 0.48,
    warmth: 0.58,
    keywords: ['轻快 华语', 'city pop', 'indie pop', 'chill pop', '阳光 歌单'],
  }

  if (storm) {
    mood = {
      key: 'storm',
      title: '雷雨电台',
      subtitle: '低频更厚，适合把世界关小一点',
      energy: 0.46,
      focus: 0.66,
      warmth: 0.34,
      keywords: ['暗色 R&B', 'trip hop', '夜晚 电子', '氛围 摇滚', '雨夜 歌单'],
    }
  } else if (rainy) {
    mood = {
      key: 'rain',
      title: '雨天电台',
      subtitle: '留一点潮湿的空间给旋律',
      energy: 0.38,
      focus: 0.64,
      warmth: 0.42,
      keywords: ['雨天 R&B', 'lofi rainy', '华语 慢歌', 'dream pop', '雨夜 歌单'],
    }
  } else if (snowy || feels <= 3) {
    mood = {
      key: 'snow',
      title: '冷空气电台',
      subtitle: '干净、慢速、带一点冬天的颗粒感',
      energy: 0.34,
      focus: 0.72,
      warmth: 0.28,
      keywords: ['冬天 民谣', 'ambient piano', '日系 冬天', 'indie folk', '安静 歌单'],
    }
  } else if (feels >= 31 || humidity >= 78) {
    mood = {
      key: 'humid',
      title: '闷热电台',
      subtitle: '降低密度，留出一点呼吸',
      energy: 0.48,
      focus: 0.46,
      warmth: 0.76,
      keywords: ['夏日 chill', 'bossa nova', 'city pop 夏天', '轻电子', '海边 歌单'],
    }
  } else if (cloudy) {
    mood = {
      key: 'cloudy',
      title: '阴天电台',
      subtitle: '不急着明亮，先让声音变软',
      energy: 0.4,
      focus: 0.58,
      warmth: 0.46,
      keywords: ['阴天 华语', 'indie rock mellow', 'neo soul', 'chillhop', '独立 民谣'],
    }
  }

  if (night) {
    mood = {
      ...mood,
      key: `${mood.key}-night`,
      title: mood.key === 'clear' ? '夜色电台' : mood.title.replace('电台', '夜听'),
      subtitle: '音量放低一点，让夜色参与编曲',
      energy: Math.min(mood.energy, 0.42),
      focus: Math.max(mood.focus, 0.68),
      keywords: ['夜晚 R&B', 'late night jazz', 'ambient', 'lofi sleep', '夜跑 歌单', ...mood.keywords],
    }
  } else if (morning) {
    mood = {
      ...mood,
      title: mood.key.includes('rain') ? '雨晨电台' : '早晨电台',
      energy: Math.max(mood.energy, 0.52),
      keywords: ['早晨 通勤', 'morning acoustic', '清晨 indie', '轻快 华语', ...mood.keywords],
    }
  } else if (dusk) {
    mood = {
      ...mood,
      title: mood.key.includes('rain') ? '黄昏雨声' : '黄昏电台',
      keywords: ['黄昏 city pop', '日落 歌单', '落日飞车', 'soul pop', ...mood.keywords],
    }
  }

  if (wind >= 28) {
    mood = {
      ...mood,
      energy: Math.max(mood.energy, 0.56),
      keywords: ['公路 摇滚', 'windy day playlist', ...mood.keywords],
    }
  }

  return {
    ...mood,
    keywords: Array.from(new Set(mood.keywords)).slice(0, 7),
  }
}

async function resolveWeatherLocation(params: { city?: string; lat?: string | null; lon?: string | null; timezone?: string }) {
  const lat = toNumber(params.lat)
  const lon = toNumber(params.lon)
  if (lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
    return {
      name: params.city?.trim() || '当前位置',
      country: '',
      admin1: '',
      latitude: lat,
      longitude: lon,
      timezone: params.timezone || 'auto',
    }
  }

  const city = params.city?.trim()
  if (!city) return DEFAULT_WEATHER_LOCATION

  const url = new URL(OPEN_METEO_GEOCODE_URL)
  url.searchParams.set('name', city)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'zh')
  url.searchParams.set('format', 'json')

  const body = await fetchJson<{ results?: Array<{ name?: string; country?: string; admin1?: string; latitude?: number; longitude?: number; timezone?: string }> }>(url.toString())
  const first = body.results?.[0]
  if (!first || typeof first.latitude !== 'number' || typeof first.longitude !== 'number') {
    return { ...DEFAULT_WEATHER_LOCATION, name: city, fallback: true }
  }

  return {
    name: first.name || city,
    country: first.country || '',
    admin1: first.admin1 || '',
    latitude: first.latitude,
    longitude: first.longitude,
    timezone: first.timezone || 'auto',
  }
}

async function fetchWeather(params: { city?: string; lat?: string | null; lon?: string | null; timezone?: string }): Promise<WeatherInfo> {
  const location = await resolveWeatherLocation(params)
  const url = new URL(OPEN_METEO_FORECAST_URL)
  url.searchParams.set('latitude', String(location.latitude))
  url.searchParams.set('longitude', String(location.longitude))
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m')
  url.searchParams.set('forecast_days', '1')
  url.searchParams.set('timezone', location.timezone || 'auto')

  const body = await fetchJson<{
    timezone?: string
    current?: Record<string, unknown>
  }>(url.toString())
  const current = body.current || {}
  const weather: WeatherInfo = {
    provider: 'open-meteo',
    label: weatherLabel(toNumber(current.weather_code)),
    temperature: toNumber(current.temperature_2m),
    apparentTemperature: toNumber(current.apparent_temperature),
    humidity: toNumber(current.relative_humidity_2m),
    precipitation: toNumber(current.precipitation) || toNumber(current.rain) || toNumber(current.showers) || toNumber(current.snowfall) || 0,
    windSpeed: toNumber(current.wind_speed_10m),
    weatherCode: toNumber(current.weather_code),
    isDay: toNumber(current.is_day),
    time: String(current.time || ''),
    location: {
      name: location.name,
      country: 'country' in location ? location.country : '',
      admin1: 'admin1' in location ? location.admin1 : '',
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: body.timezone || location.timezone || '',
      fallback: 'fallback' in location ? location.fallback : false,
    },
    mood: {
      key: 'clear',
      title: '晴朗电台',
      subtitle: '',
      energy: 0,
      focus: 0,
      warmth: 0,
      keywords: [],
    },
    updatedAt: Date.now(),
  }
  weather.mood = moodFromWeather(weather)
  return weather
}

function fallbackWeather(params: { city?: string }, error: unknown): WeatherInfo {
  const name = params.city?.trim() || DEFAULT_WEATHER_LOCATION.name
  const weather: WeatherInfo = {
    provider: 'open-meteo',
    label: '天气暂不可用',
    temperature: null,
    apparentTemperature: null,
    humidity: null,
    precipitation: null,
    windSpeed: null,
    weatherCode: null,
    isDay: null,
    time: '',
    location: {
      name,
      latitude: null,
      longitude: null,
      timezone: DEFAULT_WEATHER_LOCATION.timezone,
      fallback: true,
    },
    mood: {
      key: 'fallback',
      title: '临时电台',
      subtitle: '天气暂时没有回来，先放一组稳妥的歌',
      energy: 0.54,
      focus: 0.55,
      warmth: 0.55,
      keywords: ['华语 流行', 'indie pop', 'city pop', '轻快 歌单', 'chill pop'],
    },
    error: error instanceof Error ? error.message : 'weather_failed',
    updatedAt: Date.now(),
  }
  return weather
}

function seedQueries(mood: WeatherMood) {
  if (mood.key.includes('rain') || mood.key.includes('storm')) {
    return ['陈奕迅 阴天快乐', '周杰伦 雨下一整晚', '孙燕姿 遇见', '林宥嘉 说谎', '毛不易 消愁']
  }
  if (mood.key.includes('snow') || mood.key.includes('cloudy')) {
    return ['陈奕迅 好久不见', '莫文蔚 阴天', '李健 贝加尔湖畔', '朴树 平凡之路', '蔡健雅 达尔文']
  }
  if (mood.key.includes('humid')) {
    return ['落日飞车 My Jinji', '告五人 爱人错过', '夏日入侵企画 想去海边', '陈绮贞 旅行的意义', '王若琳 Lost in Paradise']
  }
  if (mood.key.includes('night')) {
    return ['方大同 特别的人', '陶喆 爱很简单', 'Frank Ocean Pink + White', '林忆莲 夜太黑', "Norah Jones Don't Know Why"]
  }
  return ['孙燕姿 天黑黑', '周杰伦 晴天', '五月天 温柔', '陈奕迅 稳稳的幸福', '王菲']
}

function titleKey(song: MusicApiSong) {
  return String(song.name || '')
    .toLowerCase()
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[\s._\-·'’"“”「」《》:：/\\|]+/g, '')
    .trim()
}

function isLowSignalSong(song: MusicApiSong) {
  const text = `${song.name || ''} ${song.artist || ''} ${song.album || ''}`.toLowerCase()
  if (!text.trim()) return true
  if (/suno|udio|人工智能|生成歌曲|ai歌曲|测试音频|demo|beat\s*maker/i.test(text)) return true
  if (/翻自|翻唱|cover|remix|伴奏|karaoke|instrumental|live版|live\s*版/i.test(text)) return true
  if (/白噪音|雨声|睡眠|助眠|冥想|疗愈频率|环境音|自然声音|asmr/i.test(text)) return true
  return false
}

function scoreSong(song: MusicApiSong, mood: WeatherMood) {
  const text = `${song.name || ''} ${song.artist || ''} ${song.album || ''}`.toLowerCase()
  let score = song.cover ? 4 : 0
  if (song.duration) score += 2
  if (/周杰伦|陈奕迅|孙燕姿|五月天|王菲|陶喆|方大同|林宥嘉|蔡健雅|莫文蔚|李健|毛不易|告五人|落日飞车|陈绮贞|朴树/.test(text)) score += 10
  if (mood.key.includes('rain') && /雨|阴|夜|慢|r&b|soul|陈奕迅|林宥嘉|孙燕姿/.test(text)) score += 5
  if (mood.key.includes('humid') && /夏|海|city|pop|落日|告五人|方大同|陶喆/.test(text)) score += 5
  if (mood.key.includes('night') && /夜|moon|jazz|soul|r&b|方大同|陶喆|王菲/.test(text)) score += 5
  if (mood.key.includes('cloudy') && /阴|民谣|indie|陈绮贞|朴树|李健/.test(text)) score += 5
  return score
}

function orderRadioSongs(songs: MusicApiSong[], mood: WeatherMood) {
  const seenIds = new Set<string>()
  const seenTitles = new Set<string>()
  return songs
    .filter((song) => song.id && !isLowSignalSong(song))
    .sort((a, b) => scoreSong(b, mood) - scoreSong(a, mood))
    .filter((song) => {
      const id = String(song.id)
      const title = titleKey(song)
      if (seenIds.has(id) || (title && seenTitles.has(title))) return false
      seenIds.add(id)
      if (title) seenTitles.add(title)
      return true
    })
}

export async function buildWeatherRadio(params: { city?: string; lat?: string | null; lon?: string | null; timezone?: string; limit?: number }): Promise<WeatherRadioResult> {
  let weather: WeatherInfo
  try {
    weather = await fetchWeather(params)
  } catch (error) {
    weather = fallbackWeather(params, error)
  }

  const queries = seedQueries(weather.mood)
  const keywordQueries = weather.mood.keywords.slice(0, 2)
  const settled = await Promise.allSettled([...queries.slice(0, 4), ...keywordQueries].map((query) => searchNeteaseSongs(query, 6)))
  const songs = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
  const orderedSongs = orderRadioSongs(songs, weather.mood)

  return {
    ok: orderedSongs.length > 0,
    weather,
    radio: {
      title: weather.mood.title,
      subtitle: weather.mood.subtitle,
      seedQueries: queries.slice(0, 4),
      songs: orderedSongs.slice(0, clamp(params.limit, 4, 24, 18)),
      updatedAt: Date.now(),
    },
  }
}
