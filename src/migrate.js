import { pool } from "./db.js";

async function migrate() {
  const sql = `
    CREATE TABLE IF NOT EXISTS pastes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NULL,
      max_views INTEGER NULL,
      views INTEGER NOT NULL DEFAULT 0
    )
  `;

  try {
    await pool.query(sql);
    console.log("✅ Table created successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating table:", err);
    process.exit(1);
  }
}

migrate();
