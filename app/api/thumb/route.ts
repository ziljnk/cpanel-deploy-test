import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { connection } from "next/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  await connection()

  try {
    const source =
      process.env.SHARP_SOURCE?.trim() ||
      path.join(process.cwd(), "assets", "sample.png")

    if (!existsSync(source)) {
      return NextResponse.json({ error: "source image missing" }, { status: 404 })
    }

    const widthParam = new URL(request.url).searchParams.get("w")
    const width = Math.min(64, Math.max(1, Number(widthParam ?? "16") || 16))
    const sharp = (await import("sharp")).default
    const output = await sharp(await readFile(source))
      .resize(width, width)
      .png()
      .toBuffer()

    return new NextResponse(new Uint8Array(output), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "sharp failed" },
      { status: 500 }
    )
  }
}
