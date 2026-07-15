import { Link } from "@tanstack/react-router";
import { Plus, Menu } from "lucide-react";
import { useApp } from "@/lib/app-state";

export function TopBar() {
  const { wallet, setSidebarOpen, ign } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl">
      <div className="h-[env(safe-area-inset-top)]" />
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-brand/60 bg-surface-2 font-display text-sm font-bold text-brand"
          aria-label="Open menu"
        >
          {ign.slice(0, 2).toUpperCase()}
          <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand text-[9px] text-brand-foreground">
            <Menu className="h-2.5 w-2.5" />
          </span>
        </button>

        <Link to="/" className="flex flex-col items-center leading-none">
          <span className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Elite
          </span>
          <span className="font-display text-lg font-black uppercase tracking-wider">
            e<span className="text-gradient-brand">Sports</span>
          </span>
        </Link>

        <Link
          to="/wallet"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface-2 py-1.5 pl-3 pr-1.5"
        >
          <span className="font-display text-sm font-bold tabular-nums">
            ₹{wallet.toFixed(2)}
          </span>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-brand-foreground">
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        </Link>
      </div>
    </header>
  );
}
