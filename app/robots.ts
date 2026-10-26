import type { MetadataRoute } from "next"
import { isTestMode } from "@/lib/app-mode"

export default function robots(): MetadataRoute.Robots {
  if (isTestMode()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    }
  }

  return {
    rules: { userAgent: "*", allow: "/" },
  }
}
