import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
const { Pool } = pg;
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'talkova',
    user: 'jerry',
    password: 'jerry',
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
