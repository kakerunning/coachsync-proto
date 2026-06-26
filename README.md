# CoachSync

**Live demo:** https://coachsync-proto-86bl.vercel.app/

A full-stack web application that bridges the language gap between an athletic athlete (100m–400m, hurdles) and a German-speaking coach — enabling structured weekly training reports, automatic bidirectional translation via DeepL, and performance visualization.

Built as a real-world tool for an active coaching relationship, and as a portfolio project demonstrating end-to-end product development.

---

## Background

My coach communicates in German, and I communicate in English with a Japanese accent. It is hard for him to explain technical aspects of Track and Field in English, and while my Dutch teammates can follow along in German, direct communication between my coach and me has always been a challenge. Until now, we relied on emails with manual translation. CoachSync replaces that workflow with a structured platform where:

- I log weekly training sessions with structured results (sets, distances, times)
- Reports are automatically translated into German when submitted
- My coach reviews the German translation and writes comments
- Comments are automatically translated back into Japanese/English for me

---

## Key Features

### For Athletes
- **Weekly report editor** with auto-save (1s debounce) — no lost drafts
- **Structured training data** — log sets, segments, distances, times, DNF flags, and notes per session
- **Weekly reflection** — free-text summary submitted alongside sessions
- **Report history** — view past submissions with submitted / draft status badges
- **Performance stats** — time trend charts by distance and weekly volume bar charts

### For Coaches
- **Bilingual report viewer** — toggle between original text and German translation per report
- **Comment system** — write comments in German/English; comments are auto-translated to Japanese/English for the athlete
- **Athlete stats** — same chart views accessible from the coach side

### Platform
- **3-language UI** — Japanese / English / Deutsch, switchable on every page via cookie-persisted preference
- **Role-based access control** — athletes and coaches see only what they're authorized to access
- **Auto-translation via DeepL API** — triggered on session save, report submission, and comment creation; original and translated text both stored to avoid re-translation costs

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | Supabase Auth (email + password) |
| Translation | DeepL API |
| Charts | Recharts |
| Deployment | Vercel |

---

## Architecture Highlights

**Server Components + Client Components split**
Data fetching and auth checks happen in server components. Interactive UI (auto-saving editor, charts, comment form) lives in client components that receive data as props. This keeps the bundle small and avoids prop-drilling server state.

**Cookie-based i18n without a library**
Language preference is stored in a `cs_lang` cookie. Server components read it via `next/headers` cookies(); client components receive `lang` as a prop. A small `LangSwitcher` client component sets the cookie and calls `router.refresh()` to re-render the server tree — no external i18n library needed.

**Debounced auto-save**
The report editor auto-saves reflection text, session menu text, and individual result fields independently with per-field debounce timers (800ms–1s). Each field saves to its own API route, so a change in one result row doesn't retrigger saves for the whole report.

**Translation as a side-effect**
DeepL translation is called inside API route handlers after the main DB write completes. If translation fails, the main write still succeeds and the translated field is left as `null` — shown as a "translation pending" notice in the UI.

**Data model designed for aggregation**
`SessionResult` rows store `setIndex`, `segmentIndex`, `distanceM`, and `timeSec` as structured fields (not free text), making it straightforward to query best times per distance and weekly volume without parsing strings.

---

## Data Flow

```
Athlete writes report (ja)
  → auto-save to DB
  → on session save: DeepL ja/de → menuTextDe stored
  → on submit: DeepL ja/de → reflectionDe stored

Coach reads report (de)
  → toggles between original / German translation
  → writes comment (de/en)
  → DeepL de→ja → bodyJa stored

Athlete reads comment (ja)
  → bodyJa displayed
```

---

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Fill in: DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL,
#          NEXT_PUBLIC_SUPABASE_ANON_KEY, DEEPL_API_KEY

# Run DB migrations
npx prisma migrate deploy

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── athlete/          # Athlete-facing pages
│   ├── coach/            # Coach-facing pages
│   ├── api/              # Route handlers (reports, sessions, results, comments)
│   ├── login/            # Auth pages
│   └── signup/
├── components/
│   ├── AppNav.tsx        # Shared nav with language switcher
│   ├── LangSwitcher.tsx  # Cookie-based language toggle
│   └── StatsCharts.tsx   # Recharts visualizations
└── lib/
    ├── translations.ts   # All UI strings (ja/en/de)
    ├── get-lang.ts       # Server-side cookie reader
    ├── deepl.ts          # DeepL API wrapper
    ├── prisma.ts         # Prisma client singleton
    └── api-auth.ts       # Auth helpers for route handlers
```

---

## Live Demo

🔗 https://coachsync-proto-86bl.vercel.app/

---

## License

MIT
