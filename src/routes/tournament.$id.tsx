import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Users, Trophy, ScrollText, Medal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TournamentCard } from "@/components/tournament-card";
import {
  TOURNAMENTS,
  PRIZE_DISTRIBUTION,
  PLAYERS,
  RULES,
} from "@/lib/tournament-data";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/tournament/$id")({
  component: TournamentDetail,
});

type Tab = "prize" | "players" | "rules";

function TournamentDetail() {
  const { id } = useParams({ from: "/tournament/$id" });
  const t = TOURNAMENTS.find((x) => x.id === id) ?? TOURNAMENTS[0];
  const [tab, setTab] = useState<Tab>("prize");

  return (
    <AppShell hideTopBar hideBottomNav>
      {/* Slim header */}
      <div className="h-[env(safe-area-inset-top)]" />
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="grid h-10 w-10 place-items-center rounded-full bg-surface-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="rounded-full bg-surface-2 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t.matchId}
        </span>
      </div>

      {/* Reused match card */}
      <div className="px-4">
        <TournamentCard t={t} />
      </div>



      {/* Tabs */}
      <div className="mx-4 mt-3 flex rounded-xl bg-surface-2 p-1">
        {(
          [
            { k: "prize", l: "Prize", Icon: Trophy },
            { k: "players", l: "Players", Icon: Users },
            { k: "rules", l: "Rules", Icon: ScrollText },
          ] as const
        ).map(({ k, l, Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-display text-xs font-bold uppercase tracking-wider transition-all",
              tab === k
                ? "bg-brand text-brand-foreground brand-glow"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {l}
          </button>
        ))}
      </div>

      <div className="mx-4 mt-3">
        {tab === "prize" && <PrizeList />}
        {tab === "players" && <PlayerList filled={t.slotsFilled} />}
        {tab === "rules" && <RulesList />}
      </div>

      {/* Sticky Join */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-3 p-3">
          <div className="rounded-xl bg-surface-2 px-3 py-2 font-display text-lg font-black">
            ₹{t.entry}
          </div>
          <button className="flex-1 rounded-xl bg-brand py-3 font-display text-base font-black uppercase tracking-wider text-brand-foreground brand-glow active:scale-[0.98]">
            Join Now
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </AppShell>
  );
}




function PrizeList() {
  const medalColor = (r: number) =>
    r === 1
      ? "text-gold border-gold/40 bg-gold/10"
      : r === 2
        ? "text-silver border-silver/40 bg-silver/10"
        : r === 3
          ? "text-bronze border-bronze/40 bg-bronze/10"
          : "text-muted-foreground border-border bg-surface-2";
  return (
    <ul className="space-y-2 pb-32">
      {PRIZE_DISTRIBUTION.map(({ rank, prize }) => (
        <li
          key={rank}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
        >
          <div
            className={cn(
              "grid h-11 w-11 place-items-center rounded-xl border font-display font-black",
              medalColor(rank)
            )}
          >
            {rank <= 3 ? <Medal className="h-5 w-5" /> : `#${rank}`}
          </div>
          <div className="flex-1 font-display text-sm font-bold">
            Rank {rank}
          </div>

          <div className="font-display text-lg font-black text-brand">
            ₹{prize}
          </div>
        </li>
      ))}
    </ul>
  );
}

function PlayerList({ filled }: { filled: number }) {
  const shown = PLAYERS.slice(0, Math.max(filled, 6));
  return (
    <div className="pb-32">
      <div className="mb-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {shown.length} Players
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {shown.map((p) => (
          <li
            key={p}
            className="flex items-center gap-2 rounded-xl border border-border bg-card p-2"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 font-display text-xs font-black text-brand">
              {p.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 truncate font-display text-xs font-bold">
              {p}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


function RulesList() {
  return (
    <ol className="space-y-2 pb-32">
      {RULES.map((r, i) => (
        <li
          key={i}
          className="flex gap-3 rounded-xl border border-border bg-card p-3"
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/15 font-display text-xs font-black text-brand">
            {i + 1}
          </span>
          <p className="text-sm leading-relaxed text-foreground/90">{r}</p>
        </li>
      ))}
    </ol>
  );
}
