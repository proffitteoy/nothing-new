import { NextResponse, userAgent, type NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const agent = userAgent(request)
  const mobile =
    !agent.isBot &&
    (agent.device.type === "mobile" ||
      agent.device.type === "tablet" ||
      /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(
        request.headers.get("user-agent") ?? "",
      ))
  const response = mobile
    ? NextResponse.redirect(new URL("/blog", request.url), 307)
    : NextResponse.next()
  // Never cache a device-dependent redirect or HTML/RSC for another device.
  response.headers.set("Cache-Control", "private, no-store")
  response.headers.set("Vary", "User-Agent, Sec-CH-UA-Mobile")
  return response
}

export const config = { matcher: "/" }
