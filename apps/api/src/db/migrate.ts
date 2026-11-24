import { runMigrations, closePool } from './pool.js';

async function main() {
  const applied = await runMigrations();
  console.log(applied.length ? `Applied migrations: ${applied.join(', ')}` : 'Database schema up to date.');
  await closePool();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
