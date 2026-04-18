import "server-only";
import pg from "pg";

const { Pool } = pg;

declare global {
  var __aurisPgPool: pg.Pool | undefined;
}

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  return new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
}

/** Lazy pool — only instantiates on first query so Next.js build doesn't need DATABASE_URL. */
function getPool(): pg.Pool {
  if (!globalThis.__aurisPgPool) {
    globalThis.__aurisPgPool = makePool();
  }
  return globalThis.__aurisPgPool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query<T>(text, params as never[]);
  return res.rows;
}

export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function getDemoUserId(): Promise<string> {
  const handle = process.env.DEMO_USER_HANDLE ?? "demo";
  const row = await queryOne<{ id: string }>(
    "SELECT id FROM users WHERE handle = $1",
    [handle],
  );
  if (row) return row.id;
  const created = await queryOne<{ id: string }>(
    "INSERT INTO users (handle) VALUES ($1) RETURNING id",
    [handle],
  );
  if (!created) throw new Error("failed to create demo user");
  return created.id;
}
