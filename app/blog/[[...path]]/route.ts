import path from "node:path";
import { readFile, stat } from "node:fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlogRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const blogOutputDir = path.join(process.cwd(), "public", "blog");
const contentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

function resolveBlogFilePath(...segments: string[]) {
  const targetPath = path.normalize(path.join(blogOutputDir, ...segments));
  const relativePath = path.relative(blogOutputDir, targetPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return targetPath;
}

function getCandidatePaths(pathSegments: string[]) {
  if (pathSegments.length === 0) {
    return [resolveBlogFilePath("index.html")];
  }

  const lastSegment = pathSegments[pathSegments.length - 1];
  const parentSegments = pathSegments.slice(0, -1);
  const hasExtension = path.extname(lastSegment) !== "";

  return [
    resolveBlogFilePath(...pathSegments),
    ...(hasExtension ? [resolveBlogFilePath("图片", lastSegment)] : []),
    resolveBlogFilePath(...pathSegments, "index.html"),
    resolveBlogFilePath(...parentSegments, `${lastSegment}.html`),
  ];
}

async function readFirstExistingFile(filePaths: Array<string | null>) {
  for (const filePath of filePaths) {
    if (!filePath) continue;

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        continue;
      }

      return {
        content: await readFile(filePath),
        filePath,
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error.code === "ENOENT" || error.code === "EISDIR")
      ) {
        continue;
      }

      throw error;
    }
  }

  return null;
}

function getContentType(filePath: string) {
  return contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function createFileResponse(content: Buffer, filePath: string, status = 200) {
  const body = new Uint8Array(content.byteLength);
  body.set(content);

  return new Response(body, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=0, must-revalidate",
      "content-type": getContentType(filePath),
    },
  });
}

function createTextResponse(content: string, status = 200) {
  return new Response(content, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=0, must-revalidate",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

async function resolveBlogResponse(context: BlogRouteContext) {
  const { path: pathSegments = [] } = await context.params;
  const file = await readFirstExistingFile(getCandidatePaths(pathSegments));

  if (!file) {
    return createTextResponse("Not Found", 404);
  }

  return createFileResponse(file.content, file.filePath);
}

export async function GET(_request: Request, context: BlogRouteContext) {
  return resolveBlogResponse(context);
}

export async function HEAD(_request: Request, context: BlogRouteContext) {
  const response = await resolveBlogResponse(context);

  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
