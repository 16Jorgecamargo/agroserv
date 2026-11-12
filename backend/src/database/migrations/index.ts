import type { MigrationInterface } from 'typeorm';
import { InitialSchema1794466778622 } from './1794466778622-InitialSchema.js';

export const MIGRATIONS: (new () => MigrationInterface)[] = [
  InitialSchema1794466778622,
];
