import path from "node:path";
import { readFile } from "node:fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlogRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const blogOutputDir = path.join(process.cwd(), "public", "blog");

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

  return [
    resolveBlogFilePath(...pathSegments, "index.html"),
    resolveBlogFilePath(...parentSegments, `${lastSegment}.html`),
  ];
}

async function readFirstExistingFile(filePaths: Array<string | null>) {
  for (const filePath of filePaths) {
    if (!filePath) continue;

    try {
      return await readFile(filePath, "utf8");
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

function createHtmlResponse(content: string, status = 200) {
  return new Response(content, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=0, must-revalidate",
      "content-type": "text/html; charset=utf-8",
    },
  });
}

async function resolveBlogResponse(context: BlogRouteContext) {
  const { path: pathSegments = [] } = await context.params;
  const content = await readFirstExistingFile(getCandidatePaths(pathSegments));

  if (!content) {
    return createHtmlResponse("Not Found", 404);
  }

  return createHtmlResponse(content);
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
