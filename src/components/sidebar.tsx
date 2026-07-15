import { Link } from "@tanstack/react-router";
import {
  User,
  Settings,
  Lock,
  History,
  HeadphonesIcon,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import { useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";

const items = [
  { to: "/settings", label: "Account Settings", icon: Settings },
  { to: "/private", label: "Join Private Tournament", icon: Lock },
  { to: "/wallet", label: "Withdrawals & History", icon: History },
  { to: "/support", label: "Customer Support", icon: HeadphonesIcon },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, ign, wallet } = useApp();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[78%] max-w-sm transform bg-surface shadow-2xl transition-transform duration-300 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-[env(safe-area-inset-top)]" />

        <div className="relative overflow-hidden bg-gradient-to-br from-brand/20 via-background to-background p-5">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-2 border-brand bg-background font-display text-xl font-black text-brand brand-glow">
              {ign.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                In-Game Name
              </div>
              <div className="truncate font-display text-lg font-bold">{ign}</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">
                ELITE • LVL 24
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Wallet" value={`₹${wallet.toFixed(0)}`} />
            <Stat label="Wins" value="42" />
            <Stat label="Rank" value="#3" />
          </div>
        </div>

        <nav className="flex flex-col px-3 py-2">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-surface-2"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-brand">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{it.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-border p-4">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 py-3 text-sm font-semibold text-muted-foreground">
            <LogOut className="h-4 w-4" /> Log out
          </button>
          <div className="mt-2 text-center text-[10px] text-muted-foreground">
            v1.0.0-alpha
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </aside>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-2 text-center">
      <div className="font-display text-base font-bold">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

// silence unused imports for lucide User type
export const _User = User;
