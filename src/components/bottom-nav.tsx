import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Trophy, Gamepad2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Home },
  { to: "/matches", icon: Gamepad2 },
  { to: "/wallet", icon: Wallet },
  { to: "/leaderboard", icon: Trophy },
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
                "flex items-center justify-center py-3.5 transition-colors",
                active ? "text-brand" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-xl transition-all",
                  active && "bg-brand/15 brand-glow"
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
