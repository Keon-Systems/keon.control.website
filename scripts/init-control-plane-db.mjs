import fs from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const schemaPath = path.resolve(process.cwd(), "db", "control-plane.sql");
const sql = await fs.readFile(schemaPath, "utf8");
const pool = new Pool({ connectionString });

try {
  await pool.query(sql);
  console.log(`Initialized schema from ${schemaPath}`);
} finally {
  await pool.end();
}
