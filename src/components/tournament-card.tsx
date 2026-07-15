import { Link } from "@tanstack/react-router";
import { Users, Calendar, Zap } from "lucide-react";
import type { Tournament } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";

type Props = {
  t: Tournament;
  variant?: "default" | "detail";
};

export function TournamentCard({ t, variant = "default" }: Props) {
  const pct = Math.round((t.slotsFilled / t.slotsTotal) * 100);
  const left = t.slotsTotal - t.slotsFilled;
  const full = left === 0;
  const isDetail = variant === "detail";

  const Wrapper: React.ElementType = isDetail ? "div" : Link;
  const wrapperProps = isDetail
    ? {}
    : { to: "/tournament/$id", params: { id: t.id } };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "block overflow-hidden rounded-2xl border border-border bg-card",
        !isDetail && "transition-transform active:scale-[0.98]"
      )}
    >
      <div className="flex items-stretch gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand/50 via-brand/15 to-surface-2 ring-1 ring-border">
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center font-display leading-tight text-white/90 drop-shadow-lg">
              <div className="text-2xl">🎯</div>
              <div className="text-[9px] font-black uppercase tracking-wider">
                {t.mode}
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1">
              <Pill>{t.mode}</Pill>
              <Pill>{t.map}</Pill>
              <Pill>{t.slotsTotal} SLOTS</Pill>
            </div>
            <h3 className="mt-1.5 truncate font-display text-[15px] font-bold leading-tight">
              {t.title}
            </h3>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-brand" strokeWidth={2.5} />
                <span className="font-display font-bold text-brand">
                  {t.perKill ? `₹${t.perKill}/kill` : `₹${t.prize}`}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="whitespace-nowrap">{t.dateTime}</span>
              </span>
            </div>
          </div>

          {/* Slot row */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                <span className="tabular-nums">
                  {t.slotsFilled}/{t.slotsTotal}
                </span>
              </span>
              <span className={cn(full ? "text-destructive" : "text-brand")}>
                {full ? "Full" : `${left} left`}
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
      </div>

      {/* Join footer — only in default (list) variant */}
      {!isDetail && (
        <div className="flex items-center justify-between gap-2 border-t border-border bg-surface/50 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Entry Fee
          </span>
          <button
            disabled={full}
            className={cn(
              "rounded-lg px-4 py-1.5 font-display text-sm font-black uppercase tracking-wider transition-all",
              full
                ? "bg-surface-2 text-muted-foreground"
                : "bg-brand text-brand-foreground brand-glow active:scale-95"
            )}
          >
            ₹{t.entry} Join
          </button>
        </div>
      )}
    </Wrapper>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground/80">
      {children}
    </span>
  );
}
