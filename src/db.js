import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config(); // load DATABASE_URL from .env

// Create a single shared connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Neon
});

// Optional: simple check to verify connection at startup
pool.connect()
  .then(client => {
    console.log("✅ DB connected");
    client.release();
  })
  .catch(err => {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  });
