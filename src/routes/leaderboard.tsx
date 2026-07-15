import { createFileRoute } from "@tanstack/react-router";
import { Crown, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LEADERBOARD } from "@/lib/tournament-data";
import { useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

const fmt = (n: number) =>
  n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;

function LeaderboardPage() {
  const { ign } = useApp();
  const list = LEADERBOARD;
  const [first, second, third, ...rest] = list;
  const myRank = list.findIndex((l) => l.ign === ign);
  const me =
    myRank >= 0
      ? { ...list[myRank], rank: myRank + 1 }
      : { ign, earnings: 480, rank: 27 };

  return (
    <AppShell>
      <div className="px-4 pt-2 text-center">
        <div className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand">
          🔥 3d 14h left
        </div>
      </div>


      {/* Podium */}
      <div className="mx-4 mt-6 grid grid-cols-3 items-end gap-2">
        <PodiumCard player={second} rank={2} height="h-24" />
        <PodiumCard player={first} rank={1} height="h-32" />
        <PodiumCard player={third} rank={3} height="h-20" />
      </div>

      {/* List */}
      <ul className="mx-4 mt-6 space-y-2 pb-32">
        {rest.map((p, i) => {
          const rank = i + 4;
          return (
            <li
              key={p.ign}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span className="w-8 text-center font-display text-sm font-black text-muted-foreground">
                #{rank}
              </span>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-2 font-display text-xs font-black text-brand">
                {p.ign.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 truncate font-display text-sm font-bold">
                {p.ign}
              </div>

              <div className="font-display font-black text-brand">
                {fmt(p.earnings)}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Sticky "Your Rank" */}
      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-brand/40 bg-card p-3 shadow-2xl brand-glow">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/15 font-display text-sm font-black text-brand">
            #{me.rank}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-brand">
              You
            </div>
            <div className="truncate font-display text-sm font-bold">
              {me.ign}
            </div>
          </div>
          <div className="font-display font-black text-brand">
            {fmt(me.earnings)}
          </div>

        </div>
      </div>
    </AppShell>
  );
}

function PodiumCard({
  player,
  rank,
  height,
}: {
  player: { ign: string; earnings: number };
  rank: number;
  height: string;
}) {
  const color =
    rank === 1
      ? "from-gold/40 to-gold/5 border-gold/50 text-gold"
      : rank === 2
        ? "from-silver/30 to-silver/5 border-silver/50 text-silver"
        : "from-bronze/30 to-bronze/5 border-bronze/50 text-bronze";
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-2">
        <div
          className={cn(
            "grid h-16 w-16 place-items-center rounded-2xl border-2 bg-gradient-to-br font-display text-lg font-black",
            color
          )}
        >
          {player.ign.slice(0, 2).toUpperCase()}
        </div>
        {rank === 1 && (
          <Crown className="absolute -top-4 left-1/2 h-6 w-6 -translate-x-1/2 text-gold" />
        )}
      </div>
      <div className="truncate max-w-full font-display text-xs font-bold">
        {player.ign}
      </div>
      <div className="font-display text-sm font-black text-brand">
        {fmt(player.earnings)}
      </div>
      <div
        className={cn(
          "mt-2 flex w-full flex-col items-center justify-center rounded-t-xl border border-b-0 bg-gradient-to-b font-display font-black",
          color,
          height
        )}
      >
        {rank === 1 ? (
          <Trophy className="h-5 w-5" />
        ) : (
          <span className="text-lg">#{rank}</span>
        )}
      </div>
    </div>
  );
}
