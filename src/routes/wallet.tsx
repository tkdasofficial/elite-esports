import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});

const TX = [
  { t: "Tournament Win", d: "Solo Hunter #FF23481", a: 7, kind: "in" as const, when: "Today • 06:12 PM" },
  { t: "Entry Fee", d: "Elite Duo Showdown", a: -20, kind: "out" as const, when: "Today • 03:30 PM" },
  { t: "Wallet Top-up", d: "UPI • ****4521", a: 100, kind: "in" as const, when: "Yesterday" },
  { t: "Withdrawal", d: "Bank ****9812", a: -250, kind: "out" as const, when: "12 Jul" },
  { t: "Referral Bonus", d: "GhostReaperOP joined", a: 25, kind: "in" as const, when: "10 Jul" },
];

function WalletPage() {
  const { wallet } = useApp();
  return (
    <AppShell hideTopBar>
      <div className="h-[env(safe-area-inset-top)]" />
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-surface-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-xl font-black uppercase tracking-wider">Wallet</h1>
      </div>

      <div className="mx-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand/70 to-black p-5 text-brand-foreground">
        <div className="text-[10px] uppercase tracking-widest opacity-90">Available Balance</div>
        <div className="mt-1 font-display text-4xl font-black tabular-nums">₹{wallet.toFixed(2)}</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 rounded-xl bg-black/30 py-2.5 text-sm font-bold backdrop-blur">
            <Plus className="h-4 w-4" /> Add Money
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl bg-white/95 py-2.5 text-sm font-bold text-brand">
            <ArrowUpFromLine className="h-4 w-4" /> Withdraw
          </button>
        </div>
      </div>

      <div className="mt-6 px-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">Transactions</h2>
      </div>
      <ul className="mx-4 mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {TX.map((tx, i) => (
          <li key={i} className="flex items-center gap-3 p-3">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tx.kind === "in" ? "bg-success/15 text-success" : "bg-brand/15 text-brand"}`}>
              {tx.kind === "in" ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-bold">{tx.t}</div>
              <div className="truncate text-[11px] text-muted-foreground">{tx.d} • {tx.when}</div>
            </div>
            <div className={`font-display text-sm font-black tabular-nums ${tx.kind === "in" ? "text-success" : "text-foreground"}`}>
              {tx.kind === "in" ? "+" : ""}₹{Math.abs(tx.a)}
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
