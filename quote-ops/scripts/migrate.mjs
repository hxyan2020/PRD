import { readdir, readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!url) {
  console.log("No DATABASE_URL — skip migrate (local PGlite applies migrations on boot).");
  process.exit(0);
}

const files = (await readdir("migrations").catch(() => []))
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);
  for (const file of files) {
    const done = await client.query("select 1 from schema_migrations where id = $1", [file]);
    if (done.rowCount) continue;
    const sql = await readFile(`migrations/${file}`, "utf8");
    await client.query(sql);
    await client.query("insert into schema_migrations (id) values ($1)", [file]);
    console.log("applied", file);
  }
} finally {
  await client.end();
}
