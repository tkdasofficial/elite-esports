import { Router, type IRouter } from "express";
import { db, walletsTable, paymentsTable, withdrawalsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { z } from "zod";

const router: IRouter = Router();

const depositSchema = z.object({
  amount: z.number().min(10, "Minimum deposit is ₹10"),
  utr: z.string().min(1, "UTR is required"),
});

const withdrawSchema = z.object({
  amount: z.number().min(50, "Minimum withdrawal is ₹50"),
  upi_id: z.string().min(3, "UPI ID is required"),
});

async function ensureWallet(userId: string): Promise<void> {
  await db
    .insert(walletsTable)
    .values({ user_id: userId, balance: "0" })
    .onConflictDoNothing();
}

router.get("/wallet", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    await ensureWallet(userId);

    const [wallet, payments, withdrawals] = await Promise.all([
      db.select().from(walletsTable).where(eq(walletsTable.user_id, userId)).limit(1),
      db.select().from(paymentsTable).where(eq(paymentsTable.user_id, userId)).orderBy(desc(paymentsTable.created_at)).limit(50),
      db.select().from(withdrawalsTable).where(eq(withdrawalsTable.user_id, userId)).orderBy(desc(withdrawalsTable.created_at)).limit(50),
    ]);

    const balance = parseFloat(wallet[0]?.balance ?? "0");

    const transactions = [
      ...payments.map(p => ({
        id: p.id,
        type: "credit" as const,
        amount: parseFloat(p.amount),
        status: p.status as "pending" | "approved" | "rejected",
        description: p.utr ? `Deposit — UTR: ${p.utr}` : "Deposit via UPI",
        created_at: p.created_at.toISOString(),
      })),
      ...withdrawals.map(w => ({
        id: w.id,
        type: "debit" as const,
        amount: parseFloat(w.amount),
        status: w.status as "pending" | "approved" | "rejected",
        description: `Withdrawal to ${w.upi_id}`,
        created_at: w.created_at.toISOString(),
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ balance, transactions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

router.post("/wallet/deposit", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const parsed = depositSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid request" });
      return;
    }

    await ensureWallet(userId);

    const [payment] = await db
      .insert(paymentsTable)
      .values({
        user_id: userId,
        amount: String(parsed.data.amount),
        utr: parsed.data.utr,
        status: "pending",
      })
      .returning();

    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit deposit request" });
  }
});

router.post("/wallet/withdraw", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const parsed = withdrawSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid request" });
      return;
    }

    await ensureWallet(userId);

    const walletRows = await db.select().from(walletsTable).where(eq(walletsTable.user_id, userId)).limit(1);
    const balance = parseFloat(walletRows[0]?.balance ?? "0");

    if (parsed.data.amount > balance) {
      res.status(400).json({ error: "Insufficient balance" });
      return;
    }

    const [withdrawal] = await db
      .insert(withdrawalsTable)
      .values({
        user_id: userId,
        amount: String(parsed.data.amount),
        upi_id: parsed.data.upi_id,
        status: "pending",
      })
      .returning();

    res.status(201).json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit withdrawal request" });
  }
});

export default router;
