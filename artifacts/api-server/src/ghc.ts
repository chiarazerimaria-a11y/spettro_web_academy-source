import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

/**
 * GhostCoin (GHC): moneda libre. NO se cambia por euros y NO se retira.
 * Vive en su propia columna (ghc_balance) y su propio historial (ghc_transactions),
 * separados del SPC retirable. No toca balance ni balance_free.
 */
export async function ensureGhcSchema(): Promise<void> {
  await db.execute(sql`ALTER TABLE spettro_wallets ADD COLUMN IF NOT EXISTS ghc_balance integer NOT NULL DEFAULT 0`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ghc_transactions (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      amount integer NOT NULL,
      description text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ghc_tx_user_idx ON ghc_transactions (user_id, created_at DESC)`);
}

function validAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0 || amount > 100_000_000) {
    throw new Error("Cantidad GHC inválida");
  }
}

export async function getGhcBalance(userId: number): Promise<number> {
  const r = await db.execute(sql`SELECT ghc_balance FROM spettro_wallets WHERE user_id = ${userId}`);
  const row = r.rows[0] as { ghc_balance?: number } | undefined;
  return Number(row?.ghc_balance ?? 0);
}

export async function creditGhc(userId: number, amount: number, description: string): Promise<number> {
  validAmount(amount);
  return db.transaction(async (tx) => {
    await tx.execute(sql`
      INSERT INTO spettro_wallets (user_id, balance, total_earned, total_spent)
      VALUES (${userId}, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING
    `);
    const r = await tx.execute(sql`
      UPDATE spettro_wallets SET ghc_balance = ghc_balance + ${amount}, updated_at = now()
      WHERE user_id = ${userId} RETURNING ghc_balance
    `);
    await tx.execute(sql`
      INSERT INTO ghc_transactions (user_id, amount, description) VALUES (${userId}, ${amount}, ${description})
    `);
    return Number((r.rows[0] as { ghc_balance: number }).ghc_balance);
  });
}

export async function debitGhc(userId: number, amount: number, description: string): Promise<number> {
  validAmount(amount);
  return db.transaction(async (tx) => {
    const r = await tx.execute(sql`
      UPDATE spettro_wallets SET ghc_balance = ghc_balance - ${amount}, updated_at = now()
      WHERE user_id = ${userId} AND ghc_balance >= ${amount} RETURNING ghc_balance
    `);
    if (r.rows.length === 0) throw new Error("Saldo GHC insuficiente");
    await tx.execute(sql`
      INSERT INTO ghc_transactions (user_id, amount, description) VALUES (${userId}, ${-amount}, ${description})
    `);
    return Number((r.rows[0] as { ghc_balance: number }).ghc_balance);
  });
}

export async function ensureMachinePricingSchema(): Promise<void> {
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz`);
  await db.execute(sql`ALTER TABLE lab_machines ADD COLUMN IF NOT EXISTS price integer NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE lab_machines ADD COLUMN IF NOT EXISTS price_currency text NOT NULL DEFAULT 'GHC'`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS machine_purchases (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id),
      machine_id integer NOT NULL REFERENCES lab_machines(id),
      price integer NOT NULL,
      currency text NOT NULL DEFAULT 'GHC',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS machine_purchases_user_machine_uniq ON machine_purchases (user_id, machine_id)`);
}
