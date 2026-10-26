export type AppMode = "test" | "admin" | "storefront"

/** Unset or unknown values stay in test mode so the rehearsal host is not indexed. */
export function getAppMode(): AppMode {
  const mode = process.env.APP_MODE?.trim().toLowerCase()
  if (mode === "admin" || mode === "storefront") return mode
  return "test"
}

export function isTestMode() {
  return getAppMode() === "test"
}
