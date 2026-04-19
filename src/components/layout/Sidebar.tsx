"use client";

import Link from "next/link";
import { CalendarDays, GalleryHorizontal, Grid3X3, SunMoon } from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { useTheme } from "@/components/providers/ThemeProvider";

type SidebarProps = {
  compact?: boolean;
  onNavigate?: () => void;
};

const links = [
  { href: "/", label: "Лента", icon: Grid3X3 },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/media", label: "Каталог изображений", icon: GalleryHorizontal },
];

export function Sidebar({ compact = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className={clsx(
        "flex h-full flex-col border-r border-zinc-800 bg-zinc-950/95 p-4",
        compact ? "w-20" : "w-[270px]",
      )}
    >
      <div className="mb-8">
        <p className={clsx("font-semibold text-zinc-100", compact ? "text-center text-sm" : "text-xl")}>
          {compact ? "WW" : "WealthWhisper"}
        </p>
        {!compact && <p className="text-xs text-zinc-400">Instagram Content Planner</p>}
      </div>

      <nav className="space-y-2">
        {links.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                active
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
                compact && "justify-center px-2",
              )}
              title={item.label}
            >
              <Icon size={18} />
              {!compact && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button
          onClick={toggleTheme}
          className={clsx(
            "flex w-full items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800",
            compact && "justify-center",
          )}
          title="Переключить тему"
        >
          <SunMoon size={16} />
          {!compact && <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>}
        </button>
      </div>
    </aside>
  );
}
