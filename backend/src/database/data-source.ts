import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DataSource } from 'typeorm';
import { loadConfig } from '../config/index.js';
import { ENTITIES } from './entities.js';
import { MIGRATIONS } from './migrations/index.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const { databasePath } = loadConfig();
if (databasePath !== ':memory:')
  mkdirSync(dirname(databasePath), { recursive: true });

export default new DataSource({
  type: 'better-sqlite3',
  database: databasePath,
  entities: ENTITIES,
  migrations: MIGRATIONS,
});
