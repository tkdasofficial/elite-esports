import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, KeyRound } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/private")({
  component: PrivatePage,
});

function PrivatePage() {
  const [code, setCode] = useState("");
  return (
    <AppShell hideTopBar>
      <div className="h-[env(safe-area-inset-top)]" />
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-surface-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-xl font-black uppercase tracking-wider">Private Tournament</h1>
      </div>

      <div className="mx-4 mt-6 rounded-2xl border border-border bg-card p-6 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand/15 text-brand brand-glow">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="mt-4 font-display text-lg font-black uppercase tracking-wide">Enter Invite Code</h2>
        <p className="mt-1 text-xs text-muted-foreground">Ask your tournament host for the 6-digit private code.</p>

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ELITE-XXXXXX"
            className="flex-1 bg-transparent font-display text-base font-bold tracking-widest outline-none placeholder:text-muted-foreground/50"
            maxLength={12}
          />
        </div>

        <button
          disabled={code.length < 4}
          className="mt-4 w-full rounded-xl bg-brand py-3 font-display text-sm font-black uppercase tracking-wider text-brand-foreground brand-glow disabled:opacity-50"
        >
          Join Tournament
        </button>
      </div>
    </AppShell>
  );
}
