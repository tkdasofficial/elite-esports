import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Mail, Phone, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/support")({
  component: SupportPage,
});

const FAQ = [
  { q: "How do I withdraw my winnings?", a: "Go to Wallet → Withdraw and enter your UPI or bank details." },
  { q: "When does the leaderboard reset?", a: "Every Monday at 00:00 IST." },
  { q: "What happens if I miss a match?", a: "Entry fees are non-refundable for no-shows." },
  { q: "How is prize money credited?", a: "Automatically within 30 minutes of match verification." },
];

function SupportPage() {
  return (
    <AppShell hideTopBar>
      <div className="h-[env(safe-area-inset-top)]" />
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-surface-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-xl font-black uppercase tracking-wider">Support</h1>
      </div>

      <div className="mx-4 grid grid-cols-3 gap-2">
        {[
          { i: MessageCircle, l: "Chat" },
          { i: Mail, l: "Email" },
          { i: Phone, l: "Call" },
        ].map(({ i: Icon, l }) => (
          <button key={l} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand">
              <Icon className="h-5 w-5" />
            </span>
            <span className="font-display text-xs font-bold uppercase">{l}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 px-4 pb-24">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">FAQ</h2>
        <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {FAQ.map((f, i) => (
            <li key={i} className="p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="font-display text-sm font-bold">{f.q}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{f.a}</div>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
