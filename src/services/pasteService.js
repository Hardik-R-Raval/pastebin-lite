// src/services/pasteService.js
import { pool } from "../db.js";
import { nanoid } from "nanoid";
import { nowDate } from "../utils/time.js";

export async function createPaste({ content, ttl_seconds, max_views }) {
  const id = nanoid(10); // generate short unique ID
  const createdAt = new Date();
  let expiresAt = null;

  if (ttl_seconds) {
    expiresAt = new Date(createdAt.getTime() + ttl_seconds * 1000);
  }

  const query = `
    INSERT INTO pastes (id, content, created_at, expires_at, max_views, views)
    VALUES ($1, $2, $3, $4, $5, 0)
    RETURNING id
  `;

  const values = [id, content, createdAt, expiresAt, max_views || null];

  const res = await pool.query(query, values);
  return {
    id: res.rows[0].id,
    url: `/p/${res.rows[0].id}` // relative URL; full URL in route
  };
}

export async function fetchPaste(id, req) {
  const now = nowDate(req);

  // Atomic check + increment in a transaction
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the row to avoid race conditions
    const selectRes = await client.query(
      `SELECT * FROM pastes WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (selectRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return null; // 404
    }

    const paste = selectRes.rows[0];

    // Check TTL
    if (paste.expires_at && now > paste.expires_at) {
      await client.query("ROLLBACK");
      return null; // expired
    }

    // Check max views
    if (paste.max_views !== null && paste.views >= paste.max_views) {
      await client.query("ROLLBACK");
      return null; // exceeded views
    }

    // Increment views
    const newViews = paste.views + 1;
    await client.query(
      `UPDATE pastes SET views = $1 WHERE id = $2`,
      [newViews, id]
    );

    await client.query("COMMIT");

    // Return paste info
    return {
      content: paste.content,
      remaining_views:
        paste.max_views !== null ? paste.max_views - newViews : null,
      expires_at: paste.expires_at
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
