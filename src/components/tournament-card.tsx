import { Link } from "@tanstack/react-router";
import { Users, Calendar, Zap } from "lucide-react";
import type { Tournament } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";

export function TournamentCard({ t }: { t: Tournament }) {
  const pct = Math.round((t.slotsFilled / t.slotsTotal) * 100);
  const left = t.slotsTotal - t.slotsFilled;
  const full = left === 0;

  return (
    <Link
      to="/tournament/$id"
      params={{ id: t.id }}
      className="block overflow-hidden rounded-2xl border border-border bg-card transition-transform active:scale-[0.98]"
    >
      <div className="flex gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Pill>{t.mode}</Pill>
            <Pill>{t.map}</Pill>
            <Pill>{t.slotsTotal} SLOTS</Pill>
          </div>
          <h3 className="mt-2 font-display text-base font-bold leading-tight">
            {t.title}
          </h3>


          <div className="mt-2.5 flex items-center gap-1.5 text-sm">
            <Zap className="h-4 w-4 text-brand" strokeWidth={2.5} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Prize
            </span>
            <span className="font-display font-bold text-brand">
              {t.perKill ? `₹${t.perKill}/kill` : `₹${t.prize}`}
            </span>
          </div>

          <div className="mt-2.5">
            <div className="mb-1 flex items-center justify-between text-[10px] font-medium">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" /> {t.slotsFilled}/{t.slotsTotal}
              </span>
              <span className={cn(full ? "text-destructive" : "text-brand")}>
                {full ? "Full" : `${left} spots left`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-brand/60 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex w-24 shrink-0 flex-col items-center gap-2">
          <div className="relative aspect-square w-24 overflow-hidden rounded-xl bg-gradient-to-br from-brand/40 via-brand/10 to-surface-2 ring-1 ring-border">
            <div className="absolute inset-0 grid place-items-center font-display text-[10px] font-black uppercase tracking-wider text-white/90 drop-shadow-lg">
              <div className="text-center leading-tight">
                <div className="text-2xl">🎯</div>
                <div>{t.mode}</div>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/70 to-transparent" />
          </div>

          <button
            disabled={full}
            className={cn(
              "w-full rounded-lg py-2 text-center font-display text-sm font-bold shadow-sm transition-all",
              full
                ? "bg-surface-2 text-muted-foreground"
                : "bg-brand text-brand-foreground brand-glow active:scale-95"
            )}
          >
            ₹{t.entry} JOIN
          </button>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-2.5 w-2.5" />
            <span className="whitespace-nowrap">{t.dateTime}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground/80">
      {children}
    </span>
  );
}
