import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import dotenv from 'dotenv';
dotenv.config();

import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error('DATABASE_URL not found'); process.exit(1); }

  // Parse connection string
  const url = new URL(dbUrl);
  const conn = await createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  const sql = readFileSync(join(__dirname, 'setup.sql'), 'utf-8');
  const statements = sql.split(';').filter(s => s.trim());

  for (const stmt of statements) {
    if (!stmt.trim()) continue;
    try {
      await conn.execute(stmt);
      console.log('OK:', stmt.slice(0, 60).replace(/\n/g, ' ') + '...');
    } catch (err) {
      console.log('SKIP:', (err).message);
    }
  }

  await conn.end();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
