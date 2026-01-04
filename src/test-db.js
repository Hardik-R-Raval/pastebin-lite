import { pool } from "./db.js";

async function test() {
  const res = await pool.query("SELECT NOW()");
  console.log("DB time:", res.rows[0]);
  process.exit(0);
}

test();
