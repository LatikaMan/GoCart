#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('Querying information_schema.tables...')
    const info = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
    console.log('information_schema.tables rows:', info.length)
    console.log(info)

    console.log('\nQuerying pg_catalog.pg_tables...')
    const pg = await prisma.$queryRawUnsafe("SELECT schemaname, tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename;")
    console.log('pg_tables rows:', pg.length)
    console.log(pg)

    console.log('\nChecking for prisma_migrations table...')
    const migrations = await prisma.$queryRawUnsafe("SELECT to_regclass('public.prisma_migrations') as exists;")
    console.log('prisma_migrations:', migrations)
  } catch (err) {
    console.error('Error inspecting tables:', err)
    process.exitCode = 2
  } finally {
    await prisma.$disconnect()
  }
}

main()
