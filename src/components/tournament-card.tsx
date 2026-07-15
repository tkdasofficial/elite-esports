import { Link } from "@tanstack/react-router";
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
      {/* Top: body + thumbnail */}
      <div className="flex items-start gap-3 p-3 pb-2">
        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Pill>{t.mode}</Pill>
            <Pill>{t.map}</Pill>
            <Pill>{t.slotsTotal} SLOTS</Pill>
          </div>
          <h3 className="font-display text-[15px] font-black uppercase leading-tight tracking-wide">
            {t.title}
          </h3>
          <div className="font-display text-sm font-bold text-brand">
            Prize Pool — {t.perKill ? `₹${t.perKill}/kill` : `₹${t.prize}`}
          </div>
        </div>

        {/* Thumbnail */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-gradient-to-br from-brand/60 via-brand/25 to-surface-2 ring-1 ring-border">
            <div className="absolute inset-0 grid place-items-center text-2xl drop-shadow">
              🎯
            </div>
            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
          <div className="text-[10px] font-semibold tabular-nums text-foreground/80">
            {t.dateTime}
          </div>
        </div>
      </div>

      {/* Progress line */}
      <div className="mx-3 h-[3px] overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>

      {/* Footer: match id / spots / diagonal JOIN */}
      <div className="mt-2 flex items-stretch">
        <div className="flex flex-1 items-center justify-between px-3 pb-3 pt-1 text-[11px] font-bold">
          <span className="uppercase tracking-widest text-muted-foreground/70">
            {t.matchId ? t.matchId : "MATCH ID"}
          </span>
          <span className={cn(full ? "text-destructive" : "text-brand")}>
            {left} spots left
          </span>
        </div>

        {!isDetail && (
          <div
            className={cn(
              "relative -mr-px flex items-center justify-center bg-brand pl-6 pr-4 font-display text-sm font-black uppercase tracking-wider text-brand-foreground",
              full && "bg-muted-foreground/60"
            )}
            style={{ clipPath: "polygon(14px 0, 100% 0, 100% 100%, 0% 100%)" }}
          >
            ₹{t.entry} Join
          </div>
        )}
      </div>
    </Wrapper>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-border bg-background px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-widest text-foreground/80">
      {children}
    </span>
  );
}
