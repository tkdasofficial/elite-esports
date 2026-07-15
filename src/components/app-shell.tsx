import type { ReactNode } from "react";
import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppShell({
  children,
  hideTopBar = false,
  hideBottomNav = false,
}: {
  children: ReactNode;
  hideTopBar?: boolean;
  hideBottomNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      {!hideTopBar && <TopBar />}
      <main className="mx-auto max-w-md">{children}</main>
      {!hideBottomNav && <BottomNav />}
      <Sidebar />
    </div>
  );
}
