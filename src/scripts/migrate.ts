import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDb } from '@/lib/db';

async function main() {
    const db = await getDb();
    console.log('Running local migrations...');
    // @ts-ignore
    migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations complete!');
}

main().catch(console.error);
