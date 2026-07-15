import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Trophy, Gamepad2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/matches", label: "My Matches", icon: Gamepad2 },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/wallet", label: "Wallet", icon: Wallet },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map((it) => {
          const active =
            it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                active ? "text-brand" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl transition-all",
                  active && "bg-brand/15 brand-glow"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </div>
              {it.label}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
