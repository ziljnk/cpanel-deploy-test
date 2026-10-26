import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"
import { siteCopy } from "./schema"

async function withConnection<T>(
  fn: (connection: mysql.Connection) => Promise<T>
) {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is missing")

  const connection = await mysql.createConnection({
    uri: url,
    connectTimeout: 5000,
    charset: "utf8mb4",
  })

  try {
    return await fn(connection)
  } finally {
    await connection.end()
  }
}

export async function getHomeCopy() {
  return withConnection(async (connection) => {
    const db = drizzle(connection, { mode: "default" })
    const rows = await db
      .select({ value: siteCopy.value })
      .from(siteCopy)
      .where(eq(siteCopy.copyKey, "home"))
      .limit(1)
    return rows[0]?.value ?? ""
  })
}

export async function pingDatabase(): Promise<"ok" | "skipped" | "error"> {
  if (!process.env.DATABASE_URL) return "skipped"
  try {
    await withConnection(async (connection) => {
      await connection.query("SELECT 1")
    })
    return "ok"
  } catch {
    return "error"
  }
}
