/** Commit baked into `deploymentId` and `/api/health`. Set before `next build`. */
export function commitId() {
  return (
    process.env.NEXT_PUBLIC_COMMIT?.trim() ||
    process.env.GIT_COMMIT?.trim() ||
    "unknown"
  )
}
