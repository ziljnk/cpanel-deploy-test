import { existsSync, statSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { connection } from "next/server"
import { NextResponse } from "next/server"

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".txt": "text/plain; charset=utf-8",
}

function resolveUpload(root: string, segments: string[]) {
  if (
    segments.length === 0 ||
    segments.some(
      (part) =>
        !part ||
        part === "." ||
        part === ".." ||
        part.includes("/") ||
        part.includes("\\") ||
        part.includes("\0")
    )
  ) {
    return null
  }

  const base = path.resolve(root)
  const file = path.resolve(base, ...segments)
  if (file !== base && !file.startsWith(base + path.sep)) return null
  if (!existsSync(file) || !statSync(file).isFile()) return null
  return file
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  await connection()

  try {
    const root = process.env.UPLOADS_DIR?.trim()
    if (!root) {
      return NextResponse.json({ error: "UPLOADS_DIR is not set" }, { status: 404 })
    }

    const { path: segments } = await context.params
    const file = resolveUpload(root, segments)
    if (!file) {
      return NextResponse.json({ error: "not found" }, { status: 404 })
    }

    const body = await readFile(file)
    const ext = path.extname(file).toLowerCase()
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=60",
      },
    })
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
}
