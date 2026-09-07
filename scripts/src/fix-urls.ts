import { pool } from "@workspace/db";

async function fix() {
  const client = await pool.connect();
  try {
    const res = await client.query(`UPDATE lab_machines SET download_url = 'https://www.vulnyx.com'`);
    console.log(`Updated ${res.rowCount} lab machine URLs → https://www.vulnyx.com`);
  } finally {
    client.release();
  }
  process.exit(0);
}
fix().catch(e => { console.error(e); process.exit(1); });
