import mysql from "mysql2/promise"
import { loadLocalEnv } from "./load-local-env.mjs"

loadLocalEnv()

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is missing")
  process.exit(1)
}

const value = "Deploy rehearsal copy"
const connection = await mysql.createConnection({
  uri: url,
  charset: "utf8mb4",
  connectTimeout: 5000,
})

try {
  await connection.query(
    "INSERT INTO site_copy (copy_key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?",
    ["home", value, value]
  )
  console.log("Seeded site_copy.home")
} catch (error) {
  console.error(error instanceof Error ? error.message : "Failed to seed database")
  process.exitCode = 1
} finally {
  await connection.end()
}
