import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Shield,
  User,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggleTheme, ign } = useApp();
  const [notif, setNotif] = useState(true);
  const [match, setMatch] = useState(true);
  const [promo, setPromo] = useState(false);

  return (
    <AppShell hideTopBar>
      <div className="h-[env(safe-area-inset-top)]" />
      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          to="/"
          className="grid h-10 w-10 place-items-center rounded-full bg-surface-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-xl font-black uppercase tracking-wider">
          Settings
        </h1>
      </div>

      {/* Profile card */}
      <div className="mx-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-brand bg-background font-display text-lg font-black text-brand brand-glow">
          {ign.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            In-Game Name
          </div>
          <div className="truncate font-display text-lg font-bold">{ign}</div>
        </div>
        <button className="rounded-lg bg-brand/15 px-3 py-1.5 text-xs font-bold text-brand">
          Edit
        </button>
      </div>

      <Section title="Appearance">
        <Row
          icon={theme === "dark" ? Moon : Sun}
          label="Theme"
          desc={theme === "dark" ? "Dark mode • default" : "Light mode"}
        >
          <Toggle on={theme === "dark"} onChange={toggleTheme} />
        </Row>
      </Section>

      <Section title="Notifications">
        <Row icon={Bell} label="Push Notifications" desc="All updates">
          <Toggle on={notif} onChange={() => setNotif(!notif)} />
        </Row>
        <Row icon={Bell} label="Match Reminders" desc="10 min before start">
          <Toggle on={match} onChange={() => setMatch(!match)} />
        </Row>
        <Row icon={Bell} label="Promotions" desc="Offers & rewards">
          <Toggle on={promo} onChange={() => setPromo(!promo)} />
        </Row>
      </Section>

      <Section title="Account">
        <RowLink icon={User} label="Edit Profile" desc="IGN, avatar, email" />
        <RowLink icon={Shield} label="Privacy & Security" desc="Password, 2FA" />
      </Section>

      <div className="px-4 pb-24 pt-6 text-center text-[10px] text-muted-foreground">
        Elite eSports • v1.0.0-alpha
      </div>
    </AppShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="px-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="mx-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {children}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  desc,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-display text-sm font-bold">{label}</div>
        {desc && <div className="text-[11px] text-muted-foreground">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function RowLink({
  icon,
  label,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc?: string;
}) {
  return (
    <button className="flex w-full items-center text-left">
      <Row icon={icon} label={label} desc={desc}>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Row>
    </button>
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        on ? "bg-brand" : "bg-surface-2"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
