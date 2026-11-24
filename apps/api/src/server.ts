import { getEnv } from './config/env.js';
import { closePool, runMigrations } from './db/pool.js';
import { closeRedis, getRedis } from './db/redis.js';
import { buildApp } from './app.js';

async function start() {
  const env = getEnv();
  await runMigrations();
  await getRedis().connect().catch(() => {});

  const app = await buildApp();
  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`NP-NU API listening on http://${env.HOST}:${env.PORT}`);

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    await closeRedis();
    await closePool();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Failed to start NP-NU API:', err);
  process.exit(1);
});
