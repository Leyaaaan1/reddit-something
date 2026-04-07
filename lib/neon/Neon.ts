import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

let sqlInstance: any = null;

export const sql = new Proxy({}, {
    get: () => {
        if (!sqlInstance) {
            const databaseUrl = process.env.DATABASE_URL;
            if (!databaseUrl) {
                throw new Error('DATABASE_URL not configured');
            }
            sqlInstance = neon(databaseUrl);
        }
        return sqlInstance;
    }
}) as any;