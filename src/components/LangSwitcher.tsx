"use client";

import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/translations";

const langLabels: { key: Lang; label: string }[] = [
  { key: "ja", label: "日本語" },
  { key: "en", label: "English" },
  { key: "de", label: "Deutsch" },
];

export function LangSwitcher({ current }: { current: Lang }) {
  const router = useRouter();

  function setLang(lang: Lang) {
    document.cookie = `cs_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
      {langLabels.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setLang(key)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            current === key
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
