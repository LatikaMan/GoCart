#!/usr/bin/env node
// Lists tables in the connected database (information_schema) using Prisma Client
// Run: node scripts/list-db-tables.js
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const rows = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
    console.log('Tables in schema `public`:')
    if (!rows || rows.length === 0) {
      console.log('  (no tables found)')
    } else {
      for (const r of rows) {
        // row shape may vary depending on driver; print JSON for clarity
        console.log('  -', JSON.stringify(r))
      }
    }
  } catch (err) {
    console.error('Error listing tables:', err)
    process.exitCode = 2
  } finally {
    await prisma.$disconnect()
  }
}

main()
