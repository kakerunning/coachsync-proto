# CoachSync UI Context

## Product
Coach-athlete management platform. Primary users: coaches (Joachim) and athletes (Kakeru).
Multilingual: Japanese (primary athlete), German (coach), English (UI default).

## Stack
Next.js 14, TypeScript, Tailwind CSS, Supabase, Prisma

## Design Principles
- Dense data readability: weekly reports contain structured training data
- Multilingual text: components must not break on longer German/Japanese strings
- Professional sports tool tone — not a consumer app, not playful
- Mobile-aware: coach may review on phone during training

## Key Components
- WeeklyReport card
- TrainingSession detail view
- SessionResult table (flat structure, 11 segments for 400mH)
- Coach dashboard (read-only for now)