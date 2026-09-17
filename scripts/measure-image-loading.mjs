import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
const windowsNpxCli = path.join(
  path.dirname(process.execPath),
  "node_modules",
  "npm",
  "bin",
  "npx-cli.js",
)
const agentBrowser = process.platform === "win32" ? process.execPath : "npx"
const agentBrowserPrefix = process.platform === "win32" ? [windowsNpxCli] : []
const allVariants = [
  "native",
  "gate-unbounded",
  "fixed-2",
  "fixed-4",
  "fixed-6",
  "fixed-8",
  "fixed-12",
  "adaptive",
]
const routeAliases = {
  anime: "/anime",
  "anime-watched": "/anime#watched",
  chatter: "/chatter",
}
const profiles = {
  desktop: {
    viewport: [1440, 900],
    cpuRate: 1,
    network: { latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
  },
  "mobile-network": {
    viewport: [390, 844],
    cpuRate: 4,
    network: { latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 },
  },
  "mobile-cpu": {
    viewport: [390, 844],
    cpuRate: 6,
    network: { latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
  },
}

function parseArgs(argv) {
  const values = Object.fromEntries(
    argv.map((argument) => {
      const [key, ...rest] = argument.replace(/^--/, "").split("=")
      return [key, rest.join("=") || "true"]
    }),
  )
  const list = (key, defaults) => (values[key] ? values[key].split(",") : defaults)
  const runs = Number(values.runs ?? 5)
  if (!Number.isInteger(runs) || runs < 1) throw new Error("--runs must be a positive integer")

  const selectedVariants = list("variants", allVariants)
  const selectedRoutes = list("routes", Object.keys(routeAliases))
  const selectedProfiles = list("profiles", Object.keys(profiles))
  selectedVariants.forEach((value) => {
    if (!allVariants.includes(value)) throw new Error(`Unknown variant: ${value}`)
  })
  selectedRoutes.forEach((value) => {
    if (!(value in routeAliases)) throw new Error(`Unknown route alias: ${value}`)
  })
  selectedProfiles.forEach((value) => {
    if (!(value in profiles)) throw new Error(`Unknown profile: ${value}`)
  })

  return {
    baseUrl: values["base-url"] ?? "http://localhost:3000",
    runs,
    variants: selectedVariants,
    routes: selectedRoutes,
    profiles: selectedProfiles,
    output:
      values.output ??
      path.join(
        tmpdir(),
        `nothing-new-image-lab-${new Date().toISOString().replace(/[:.]/g, "-")}`,
      ),
  }
}

function runAgent(session, args, input) {
  return new Promise((resolve, reject) => {
    const commandArgs = ["--yes", "agent-browser", "--session", session, ...args]
    const child = spawn(agentBrowser, [...agentBrowserPrefix, ...commandArgs], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => (stdout += chunk))
    child.stderr.on("data", (chunk) => (stderr += chunk))
    child.on("error", reject)
    // agent-browser starts a session daemon that can inherit pipe handles on Windows.
    // The wrapper process has already produced its complete output when it exits,
    // while waiting for "close" can hang until that daemon terminates.
    child.on("exit", (code) => {
      if (code === 0) resolve(stdout.trim())
      else
        reject(new Error(`agent-browser ${args.join(" ")} failed (${code}): ${stderr || stdout}`))
    })
    if (input !== undefined) child.stdin.end(input)
    else child.stdin.end()
  })
}

function parseNestedJson(output) {
  let value = output
  for (let index = 0; index < 3 && typeof value === "string"; index += 1) {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    try {
      value = JSON.parse(trimmed)
    } catch {
      const jsonLine = trimmed
        .split(/\r?\n/)
        .reverse()
        .find((line) => line.trim().startsWith("{") || line.trim().startsWith('"'))
      if (!jsonLine) throw new Error(`Unable to parse agent-browser output: ${output}`)
      value = JSON.parse(jsonLine)
    }
  }
  return value
}

async function evaluate(session, source) {
  const output = await runAgent(session, ["eval", "--stdin"], source)
  return parseNestedJson(output)
}

class CdpClient {
  constructor(url) {
    this.url = url
    this.nextId = 1
    this.pending = new Map()
  }

  async connect() {
    this.socket = new WebSocket(this.url)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out connecting to CDP")), 10_000)
      this.socket.addEventListener(
        "open",
        () => {
          clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )
      this.socket.addEventListener(
        "error",
        (event) => {
          clearTimeout(timeout)
          reject(event.error ?? new Error("CDP WebSocket failed"))
        },
        { once: true },
      )
    })
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data)
      if (!message.id) return
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result)
    })
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++
    const payload = { id, method, params }
    if (sessionId) payload.sessionId = sessionId
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Timed out waiting for CDP method ${method}`))
      }, 10_000)
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeout)
          resolve(value)
        },
        reject: (error) => {
          clearTimeout(timeout)
          reject(error)
        },
      })
      this.socket.send(JSON.stringify(payload))
    })
  }

  close() {
    this.socket?.close()
  }
}

async function configureChrome(session, profile) {
  const output = await runAgent(session, ["get", "cdp-url", "--json"])
  const response = parseNestedJson(output)
  const cdpUrl = response?.data?.cdpUrl
  if (!cdpUrl) throw new Error("agent-browser did not return a CDP URL")

  const client = new CdpClient(cdpUrl)
  await client.connect()
  const { targetInfos } = await client.send("Target.getTargets")
  const pageTarget = targetInfos.find((target) => target.type === "page")
  if (!pageTarget) throw new Error("No page target is available for the browser session")
  const { sessionId } = await client.send("Target.attachToTarget", {
    targetId: pageTarget.targetId,
    flatten: true,
  })
  await client.send("Network.enable", {}, sessionId)
  await client.send("Network.clearBrowserCache", {}, sessionId)
  await client.send(
    "Network.emulateNetworkConditions",
    {
      offline: false,
      latency: profile.network.latency,
      downloadThroughput: profile.network.downloadThroughput,
      uploadThroughput: profile.network.uploadThroughput,
      connectionType: profile.network.latency > 0 ? "cellular4g" : "none",
    },
    sessionId,
  )
  await client.send("Emulation.setCPUThrottlingRate", { rate: profile.cpuRate }, sessionId)
  return client
}

async function waitForSnapshot(session, predicate, timeoutMs = 20_000) {
  const startedAt = Date.now()
  let latest
  while (Date.now() - startedAt < timeoutMs) {
    latest = await evaluate(
      session,
      "JSON.stringify(window.__imageLoadingLab?.snapshot?.() ?? null)",
    )
    if (latest && predicate(latest)) return latest
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Image lab did not reach the expected state: ${JSON.stringify(latest)}`)
}

function buildUrl(baseUrl, route, variant, runId) {
  const url = new URL(route, baseUrl)
  url.searchParams.set("imagePolicy", variant)
  url.searchParams.set("imageRun", runId)
  return url.toString()
}

async function runSample(options, variant, routeAlias, profileName, runNumber) {
  const profile = profiles[profileName]
  const runId = `${routeAlias}-${profileName}-${variant}-${runNumber}`
  const session = `image-lab-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  let cdp
  try {
    await runAgent(session, ["set", "viewport", ...profile.viewport.map(String)])
    cdp = await configureChrome(session, profile)
    await runAgent(session, [
      "open",
      buildUrl(options.baseUrl, routeAliases[routeAlias], variant, runId),
    ])
    const initial = await waitForSnapshot(
      session,
      (snapshot) =>
        snapshot.enabled &&
        snapshot.visible.total > 0 &&
        snapshot.visible.complete >= snapshot.visible.total,
    )
    await runAgent(session, ["scroll", "down", String(Math.round(profile.viewport[1] * 0.9))])
    await runAgent(session, ["wait", "250"])
    const nextScreen = await waitForSnapshot(
      session,
      (snapshot) =>
        snapshot.visible.total > 0 && snapshot.visible.complete >= snapshot.visible.total,
    )
    await runAgent(session, ["scroll", "down", String(profile.viewport[1] * 3)])
    await runAgent(session, ["wait", "250"])
    const fastScroll = await waitForSnapshot(
      session,
      (snapshot) =>
        snapshot.visible.total > 0 && snapshot.visible.complete >= snapshot.visible.total,
    )
    return {
      runId,
      variant,
      route: routeAlias,
      profile: profileName,
      initial,
      nextScreen,
      fastScroll,
    }
  } finally {
    cdp?.close()
    await runAgent(session, ["close"]).catch(() => undefined)
  }
}

function percentile(values, quantile) {
  if (values.length === 0) return undefined
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1))]
}

function summarize(samples) {
  const groups = new Map()
  samples.forEach((sample) => {
    const key = `${sample.route}|${sample.profile}|${sample.variant}`
    const group = groups.get(key) ?? []
    group.push(sample)
    groups.set(key, group)
  })
  return [...groups.entries()].map(([key, group]) => {
    const [route, profile, variant] = key.split("|")
    const initialCompletion = group
      .map((sample) => sample.initial.metrics.visibleCompletionMs)
      .filter(Number.isFinite)
    const lcp = group.map((sample) => sample.initial.lcp?.startTime).filter(Number.isFinite)
    const nextScreenReadiness = group.map((sample) => {
      const total = sample.nextScreen.near.total
      return total > 0 ? sample.nextScreen.near.complete / total : 1
    })
    return {
      route,
      profile,
      variant,
      runs: group.length,
      visibleCompletionMedian: percentile(initialCompletion, 0.5),
      visibleCompletionP75: percentile(initialCompletion, 0.75),
      lcpP75: percentile(lcp, 0.75),
      nextScreenReadyRateMedian: percentile(nextScreenReadiness, 0.5),
      maxCls: Math.max(...group.map((sample) => sample.fastScroll.cls)),
      requestCountMedian: percentile(
        group.map((sample) => sample.fastScroll.metrics.requestCount),
        0.5,
      ),
      transferSizeMedian: percentile(
        group.map((sample) => sample.fastScroll.metrics.transferSize),
        0.5,
      ),
      longTaskTotalMedian: percentile(
        group.map((sample) => sample.fastScroll.longTasks.totalDuration),
        0.5,
      ),
      maxFrameGapP75: percentile(
        group.map((sample) => sample.fastScroll.maxFrameGap),
        0.75,
      ),
      failedCount: group.reduce(
        (total, sample) => total + sample.fastScroll.metrics.failedCount,
        0,
      ),
      timedOutCount: group.reduce(
        (total, sample) => total + sample.fastScroll.metrics.timedOutCount,
        0,
      ),
    }
  })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  await mkdir(options.output, { recursive: true })
  const samples = []
  for (const route of options.routes) {
    for (const profile of options.profiles) {
      for (const variant of options.variants) {
        for (let run = 1; run <= options.runs; run += 1) {
          console.log(`[image-lab] ${route} ${profile} ${variant} ${run}/${options.runs}`)
          const sample = await runSample(options, variant, route, profile, run)
          samples.push(sample)
          await writeFile(path.join(options.output, "raw.json"), JSON.stringify(samples, null, 2))
        }
      }
    }
  }
  const summary = summarize(samples)
  await writeFile(path.join(options.output, "summary.json"), JSON.stringify(summary, null, 2))
  console.log(`[image-lab] raw: ${path.join(options.output, "raw.json")}`)
  console.log(`[image-lab] summary: ${path.join(options.output, "summary.json")}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
