const fs = require("node:fs/promises");
const path = require("node:path");
const { Pool } = require("@neondatabase/serverless");

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

async function migrate() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS shop_schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const directory = path.join(__dirname, "../db/migrations");
    const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
    for (const file of files) {
      const applied = await client.query("SELECT 1 FROM shop_schema_migrations WHERE name = $1", [file]);
      if (applied.rowCount) continue;
      await client.query("BEGIN");
      try {
        const sql = await fs.readFile(path.join(directory, file), "utf8");
        const statements = sql.split(";").map((statement) => statement.trim()).filter(Boolean);
        for (const statement of statements) await client.query(statement);
        await client.query("INSERT INTO shop_schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
