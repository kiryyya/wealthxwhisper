"use client";

import clsx from "clsx";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";

export function MainLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isFeedPage = pathname === "/";

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="grid h-screen grid-cols-1 lg:grid-cols-[270px_1fr]">
        <div className="hidden border-r border-zinc-800 lg:block">
          <Sidebar />
        </div>

        <div className="flex h-screen flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur lg:hidden">
            <button
              className="rounded-lg border border-zinc-700 p-2 text-zinc-200"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <p className="text-sm font-semibold">WealthWhisper Planner</p>
            <div className="w-8" />
          </header>
          <main
            className={clsx(
              "flex-1 overflow-y-auto",
              isFeedPage ? "p-0" : "px-4 py-5 sm:px-6",
            )}
          >
            {children}
          </main>
        </div>

      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button className="w-full bg-black/70" onClick={() => setOpen(false)} />
          <div className="h-full w-[270px] border-l border-zinc-800 bg-zinc-950">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
