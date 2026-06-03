#!/usr/bin/env node
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const envPath = path.join(__dirname, '..', 'prisma', '.env')
if (!fs.existsSync(envPath)) {
  console.error('prisma/.env not found')
  process.exit(2)
}
const parsed = dotenv.parse(fs.readFileSync(envPath))
const direct = parsed.DIRECT_URL || parsed.DATABASE_URL
if (!direct) {
  console.error('DIRECT_URL or DATABASE_URL not found in prisma/.env')
  process.exit(2)
}

console.log('Using DIRECT_URL for push (length', direct.length, ')')

// Run prisma db push with the environment variable overridden for this process
const env = Object.assign({}, process.env, { DATABASE_URL: direct })
const isWin = process.platform === 'win32'
let res
if (isWin) {
  // Use cmd /c to run npx so Windows path resolution works as in a normal shell
  res = spawnSync('cmd.exe', ['/c', 'npx prisma db push --schema prisma/schema.prisma'], { stdio: 'inherit', env, shell: false })
} else {
  res = spawnSync('npx', ['prisma', 'db', 'push', '--schema', 'prisma/schema.prisma'], { stdio: 'inherit', env })
}
if (res.error) {
  console.error('Failed to run prisma db push:', res.error)
  process.exit(1)
}
process.exit(res.status)
