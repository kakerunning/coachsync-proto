import Link from "next/link";
import { logout } from "@/lib/auth";

interface Props {
  name: string;
  role: "ATHLETE" | "COACH";
  homeHref: string;
}

export function AppNav({ name, role, homeHref }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href={homeHref} className="flex items-center gap-2.5">
          <span className="text-base font-bold tracking-tight text-zinc-900">CoachSync</span>
          <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            {role === "ATHLETE" ? "Athlete" : "Coach"}
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden sm:block text-sm text-zinc-500 max-w-[160px] truncate">{name}</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
