import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { getEnv } from '../config/env.js';

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!poolInstance) {
    const env = getEnv();
    const needsSsl = env.DATABASE_URL.includes('.render.com') || env.DATABASE_URL.includes('sslmode=require');
    poolInstance = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return poolInstance;
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function runMigrations(): Promise<string[]> {
  const pool = getPool();
  const here = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.resolve(here, '../../migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied: string[] = [];
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const existingRes = await pool.query<{ filename: string }>('SELECT filename FROM schema_migrations');
  const existing = new Set(existingRes.rows.map((r) => r.filename));

  for (const file of files) {
    if (existing.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    });
    applied.push(file);
  }
  return applied;
}

export async function closePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}
