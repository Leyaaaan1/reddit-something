import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL not configured in .env');
}

// Create the SQL function directly - neon returns a function
export const sql = neon(databaseUrl);