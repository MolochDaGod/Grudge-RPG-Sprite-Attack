import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// DB is optional — PvP WebSocket server works without it.
// Chat and account features require DATABASE_URL to be set.
const hasDb = !!process.env.DATABASE_URL;

export const pool = hasDb
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : (null as unknown as pg.Pool);

export const db = hasDb
  ? drizzle(pool, { schema })
  : (null as unknown as ReturnType<typeof drizzle>);

export { hasDb };
