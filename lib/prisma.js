
import { PrismaClient } from './generated/prisma'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'
neonConfig.webSocket = ws;
neonConfig.poolQueryViaFetch = true;
const connectionString ='${process.env.DATABASE_URL}';


const adapter = new PrismaNeon({
  connectionString,
})
const prisma = global.prisma || new PrismaClient({ adapter });
if(process.env.NODE_ENV == 'Development') global.prisma = prisma;
export default prisma;