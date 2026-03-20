import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";

export function openSqliteDatabase(path: string) {
  mkdirSync(dirname(path), { recursive: true });
  return new Database(path, { create: true, strict: true });
}

export function withTransaction<T>(db: Database, fn: () => T): T {
  return db.transaction(fn)();
}
