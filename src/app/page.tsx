"use client";

import Link from "next/link";
import { useState } from "react";

type Lang = "ja" | "en" | "de";

const content = {
  ja: {
    login: "ログイン",
    signup: "新規登録",
    badge: "アスリートとコーチをつなぐ",
    heroLine1: "週次トレーニングレポートを",
    heroHighlight: "言語の壁なく",
    heroLine2: "共有する",
    heroSub:
      "アスリートが日本語でレポートを記録し、コーチがドイツ語で確認・コメント。DeepL による自動翻訳で、言語が違っても密なコーチングを実現します。",
    ctaStart: "無料で始める",
    ctaLogin: "ログインする",
    featuresLabel: "主な機能",
    features: [
      {
        icon: "📋",
        title: "週次レポート入力",
        desc: "日付ごとのトレーニングメニューと結果 (距離・タイム・セット) を構造化して記録。自動保存で入力途中のデータも安心。",
      },
      {
        icon: "🌐",
        title: "自動翻訳 (DeepL)",
        desc: "レポート提出時に日本語 → ドイツ語へ自動翻訳。コーチのコメントはドイツ語 → 日本語に翻訳されてアスリートへ届きます。",
      },
      {
        icon: "📈",
        title: "パフォーマンス可視化",
        desc: "距離別ベストタイムの推移グラフと週次走行距離グラフで、トレーニングの成果を一目で把握できます。",
      },
    ],
    howLabel: "使い方",
    steps: [
      {
        step: "01",
        role: "アスリート",
        title: "週次レポートを作成・提出",
        desc: "その週のトレーニングセッション、タイム、週次リフレクションを入力して提出します。",
      },
      {
        step: "02",
        role: "システム",
        title: "DeepL が自動翻訳",
        desc: "レポートの内容がドイツ語に自動翻訳され、コーチがすぐに読める状態になります。",
      },
      {
        step: "03",
        role: "コーチ",
        title: "レポートを確認・コメント",
        desc: "コーチはドイツ語訳を読み、ドイツ語でコメントを送信。コメントは日本語に翻訳されてアスリートに届きます。",
      },
    ],
    ctaTitle: "今すぐ始めましょう",
    ctaSub: "アスリートとコーチ、どちらのロールでも登録できます。",
    ctaButton: "無料で登録する",
    footer: "© 2026 CoachSync. Built with Next.js + Supabase + DeepL.",
  },
  en: {
    login: "Log in",
    signup: "Sign up",
    badge: "Connecting athletes and coaches",
    heroLine1: "Share weekly training reports",
    heroHighlight: "across any language",
    heroLine2: "",
    heroSub:
      "Athletes log reports in their language, coaches review and comment in theirs. Powered by DeepL auto-translation for seamless cross-language coaching.",
    ctaStart: "Get started free",
    ctaLogin: "Log in",
    featuresLabel: "Features",
    features: [
      {
        icon: "📋",
        title: "Weekly report entry",
        desc: "Log training sessions by date with structured menu text, distances, times, and sets. Auto-save keeps every draft safe.",
      },
      {
        icon: "🌐",
        title: "Auto-translation (DeepL)",
        desc: "Reports are translated to German when submitted. Coach comments are translated back to Japanese so athletes always understand the feedback.",
      },
      {
        icon: "📈",
        title: "Performance visualization",
        desc: "Best-time trend charts by distance and weekly volume bar charts give a clear picture of training progress over time.",
      },
    ],
    howLabel: "How it works",
    steps: [
      {
        step: "01",
        role: "Athlete",
        title: "Create and submit a weekly report",
        desc: "Enter training sessions, times, and a weekly reflection, then submit when ready.",
      },
      {
        step: "02",
        role: "System",
        title: "DeepL translates automatically",
        desc: "The report is translated into German so the coach can read it immediately without any manual effort.",
      },
      {
        step: "03",
        role: "Coach",
        title: "Review and comment",
        desc: "The coach reads the German translation and writes comments. Those comments are translated back to Japanese for the athlete.",
      },
    ],
    ctaTitle: "Ready to get started?",
    ctaSub: "Sign up as an athlete or a coach — both roles are supported.",
    ctaButton: "Create a free account",
    footer: "© 2026 CoachSync. Built with Next.js + Supabase + DeepL.",
  },
  de: {
    login: "Anmelden",
    signup: "Registrieren",
    badge: "Athleten und Trainer verbinden",
    heroLine1: "Wöchentliche Trainingsberichte",
    heroHighlight: "ohne Sprachbarrieren",
    heroLine2: "teilen",
    heroSub:
      "Athleten erfassen Berichte auf Japanisch, Trainer lesen und kommentieren auf Deutsch. Dank DeepL-Übersetzung entsteht ein reibungsloser Austausch – sprachübergreifend.",
    ctaStart: "Kostenlos starten",
    ctaLogin: "Anmelden",
    featuresLabel: "Funktionen",
    features: [
      {
        icon: "📋",
        title: "Wöchentliche Berichtserfassung",
        desc: "Trainingseinheiten nach Datum mit Menübeschreibung, Distanzen, Zeiten und Sätzen strukturiert erfassen. Automatisches Speichern schützt jeden Entwurf.",
      },
      {
        icon: "🌐",
        title: "Automatische Übersetzung (DeepL)",
        desc: "Beim Einreichen wird der Bericht automatisch ins Deutsche übersetzt. Kommentare des Trainers werden ins Japanische zurückübersetzt.",
      },
      {
        icon: "📈",
        title: "Leistungsvisualisierung",
        desc: "Bestzeit-Trenddiagramme nach Distanz und wöchentliche Volumenbalken geben einen klaren Überblick über den Trainingsfortschritt.",
      },
    ],
    howLabel: "So funktioniert es",
    steps: [
      {
        step: "01",
        role: "Athlet",
        title: "Wochenbericht erstellen und einreichen",
        desc: "Trainingseinheiten, Zeiten und eine wöchentliche Reflexion eingeben und dann einreichen.",
      },
      {
        step: "02",
        role: "System",
        title: "DeepL übersetzt automatisch",
        desc: "Der Bericht wird ins Deutsche übersetzt, sodass der Trainer ihn sofort lesen kann.",
      },
      {
        step: "03",
        role: "Trainer",
        title: "Bericht prüfen und kommentieren",
        desc: "Der Trainer liest die deutsche Übersetzung und schreibt Kommentare, die automatisch ins Japanische übersetzt werden.",
      },
    ],
    ctaTitle: "Jetzt loslegen",
    ctaSub: "Als Athlet oder Trainer registrieren – beide Rollen werden unterstützt.",
    ctaButton: "Kostenlos registrieren",
    footer: "© 2026 CoachSync. Built with Next.js + Supabase + DeepL.",
  },
};

const langLabels: { key: Lang; label: string }[] = [
  { key: "ja", label: "日本語" },
  { key: "en", label: "English" },
  { key: "de", label: "Deutsch" },
];

export default function Home() {
  const [lang, setLang] = useState<Lang>("ja");
  const t = content[lang];

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Nav */}
      <header className="border-b border-zinc-100 sticky top-0 bg-white z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <span className="text-base font-bold tracking-tight text-zinc-900">CoachSync</span>

          {/* Language switcher */}
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
            {langLabels.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setLang(key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  lang === key
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              {t.login}
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              {t.signup}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32">
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
          {t.badge}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 max-w-2xl leading-tight">
          {t.heroLine1}
          <br />
          <span className="text-blue-600">{t.heroHighlight}</span>
          {t.heroLine2 && <> {t.heroLine2}</>}
        </h1>
        <p className="mt-6 text-lg text-zinc-500 max-w-xl leading-relaxed">{t.heroSub}</p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            {t.ctaStart}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {t.ctaLogin}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-zinc-50 border-t border-zinc-100 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 text-center mb-12">
            {t.featuresLabel}
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {t.features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-lg">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-zinc-900">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 text-center mb-12">
            {t.howLabel}
          </p>
          <div className="space-y-8">
            {t.steps.map(({ step, role, title, desc }) => (
              <div key={step} className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-400">
                  {step}
                </div>
                <div className="pt-1.5 space-y-1">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">{role}</p>
                  <h3 className="font-semibold text-zinc-900">{title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-zinc-900 py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">{t.ctaTitle}</h2>
        <p className="text-sm text-zinc-400 mb-8">{t.ctaSub}</p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          {t.ctaButton}
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-6 text-center">
        <p className="text-xs text-zinc-400">{t.footer}</p>
      </footer>

    </div>
  );
}
