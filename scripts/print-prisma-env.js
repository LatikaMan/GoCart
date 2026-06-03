#!/usr/bin/env node
// Prints DATABASE_URL and DIRECT_URL from prisma/.env using dotenv
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const envPath = path.join(__dirname, '..', 'prisma', '.env')
if (!fs.existsSync(envPath)) {
  console.error('prisma/.env not found at', envPath)
  process.exit(2)
}
const parsed = dotenv.parse(fs.readFileSync(envPath))
console.log('Parsed prisma/.env:')
console.log('DATABASE_URL:', parsed.DATABASE_URL)
console.log('DIRECT_URL:  ', parsed.DIRECT_URL)
console.log('\nRaw file contents:')
console.log(fs.readFileSync(envPath, 'utf8'))
