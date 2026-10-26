// Startup file for the cPanel Node.js app (lsnode). It lives in the app root
// (~/deploy-test/app.js) and starts whichever release `current` points to.
// The deploy script copies this file into the app root on every deploy.
"use strict"

const fs = require("node:fs")
const path = require("node:path")
const { createServer } = require("node:http")

const releaseDir = fs.realpathSync(path.join(__dirname, "current"))
process.chdir(releaseDir)
process.env.NODE_ENV = "production"

const next = require(path.join(releaseDir, "node_modules", "next"))
const app = next({ dev: false, dir: releaseDir })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(Number(process.env.PORT) || 3000)
    console.log(`deploy-test ready (release ${path.basename(releaseDir)})`)
  })
  .catch((error) => {
    console.error("deploy-test failed to start", error)
    process.exit(1)
  })
