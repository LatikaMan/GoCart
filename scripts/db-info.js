#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const res = await prisma.$queryRawUnsafe("select current_database() as db, current_schema() as schema")
    console.log(res)
  } catch (err) {
    console.error('Error querying DB info:', err)
    process.exitCode = 2
  } finally {
    await prisma.$disconnect()
  }
}

main()
