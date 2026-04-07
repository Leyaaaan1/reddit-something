import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

let sqlInstance: any = null;

const getSql = () => {
    if (!sqlInstance) {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL not configured');
        }
        sqlInstance = neon(databaseUrl);
    }
    return sqlInstance;
};

export const sql = getSql();  // Export the instance directly