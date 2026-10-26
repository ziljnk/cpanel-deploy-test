import { join } from "node:path"
import { drizzle } from "drizzle-orm/mysql2"
import { migrate } from "drizzle-orm/mysql2/migrator"
import mysql from "mysql2/promise"
import { loadLocalEnv } from "./load-local-env.mjs"

loadLocalEnv()

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is missing")
  process.exit(1)
}

const pool = mysql.createPool({
  uri: url,
  charset: "utf8mb4",
  connectionLimit: 1,
  connectTimeout: 5000,
})
const db = drizzle(pool)

try {
  await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") })
  console.log("Database migrations are up to date")
} catch (error) {
  console.error(error instanceof Error ? error.message : "Failed to migrate database")
  process.exitCode = 1
} finally {
  await pool.end()
}
