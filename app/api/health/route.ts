import { connection } from "next/server"
import { NextResponse } from "next/server"
import { getAppMode } from "@/lib/app-mode"
import { commitId } from "@/lib/commit"
import { pingDatabase } from "@/lib/db"

export async function GET() {
  await connection()

  const headers = { "Cache-Control": "no-store, max-age=0" }
  const commit = commitId()
  const appMode = getAppMode()

  if (process.env.MOCK_BREAK === "health") {
    return NextResponse.json(
      { ok: false, commit, appMode, error: "MOCK_BREAK=health" },
      { status: 500, headers }
    )
  }

  const db = await pingDatabase()
  return NextResponse.json(
    { ok: db !== "error", commit, appMode, db },
    { status: db === "error" ? 503 : 200, headers }
  )
}
