import { mysqlTable, text, varchar } from "drizzle-orm/mysql-core"

/** One row, `copy_key = home`, is read while the home page is prerendered. */
export const siteCopy = mysqlTable("site_copy", {
  copyKey: varchar("copy_key", { length: 191 }).primaryKey(),
  value: text("value").notNull(),
})
