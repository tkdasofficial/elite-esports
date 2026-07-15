import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TournamentCard } from "@/components/tournament-card";
import { CATEGORIES, TOURNAMENTS } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [cat, setCat] = useState<string>("All");
  const filtered =
    cat === "All" ? TOURNAMENTS : TOURNAMENTS.filter((t) => t.category === cat);

  return (
    <AppShell>
      {/* Hero strip */}
      <section className="mx-4 mt-2 overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand/80 to-brand/40 p-4 text-brand-foreground">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-90">
              <Flame className="h-3 w-3" /> Weekly Prize Pool
            </div>
            <div className="mt-1 font-display text-3xl font-black leading-none">
              ₹2,40,000
            </div>
            <div className="mt-1 text-xs opacity-90">
              Resets every Monday • 4 days left
            </div>
          </div>
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-black/25 text-3xl">
            🏆
          </div>
        </div>
      </section>

      {/* Category tabs */}
      <div className="scrollbar-hide sticky top-[62px] z-20 -mx-0 flex gap-2 overflow-x-auto bg-background/95 px-4 py-3 backdrop-blur-xl">
        {CATEGORIES.map((c) => {
          const active = c === cat;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all",
                active
                  ? "bg-brand text-brand-foreground brand-glow"
                  : "bg-surface-2 text-muted-foreground"
              )}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">
          Live Tournaments
        </h2>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
          <TrendingUp className="h-3 w-3 text-brand" /> {filtered.length} open
        </span>
      </div>

      <div className="space-y-3 px-4">
        {filtered.map((t) => (
          <TournamentCard key={t.id} t={t} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No tournaments in this category yet.
          </div>
        )}
      </div>
    </AppShell>
  );
}
