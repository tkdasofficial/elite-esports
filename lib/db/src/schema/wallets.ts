import { pgTable, text, numeric, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const walletsTable = pgTable("wallets", {
  user_id:    text("user_id").primaryKey(),
  balance:    numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const paymentsTable = pgTable("payments", {
  id:         uuid("id").primaryKey().defaultRandom(),
  user_id:    text("user_id").notNull(),
  amount:     numeric("amount", { precision: 12, scale: 2 }).notNull(),
  utr:        text("utr"),
  status:     text("status").notNull().default("pending"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const withdrawalsTable = pgTable("withdrawals", {
  id:         uuid("id").primaryKey().defaultRandom(),
  user_id:    text("user_id").notNull(),
  amount:     numeric("amount", { precision: 12, scale: 2 }).notNull(),
  upi_id:     text("upi_id").notNull(),
  status:     text("status").notNull().default("pending"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, status: true, created_at: true });
export const insertWithdrawalSchema = createInsertSchema(withdrawalsTable).omit({ id: true, status: true, created_at: true });

export type Wallet      = typeof walletsTable.$inferSelect;
export type Payment     = typeof paymentsTable.$inferSelect;
export type Withdrawal  = typeof withdrawalsTable.$inferSelect;
export type InsertPayment    = z.infer<typeof insertPaymentSchema>;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
