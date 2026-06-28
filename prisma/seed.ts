/**
 * Demo data seed script
 * Run: npx tsx prisma/seed.ts
 *
 * Prerequisites:
 *   Add SUPABASE_SERVICE_ROLE_KEY to .env to auto-create auth users.
 *   Without it, auth users must be created manually (same email/password).
 *
 * Demo accounts:
 *   Coach:   thomas.mueller@coach.de      / Demo1234!
 *   Athlete: sarah.johnson@athlete.com    / Demo1234!  (English)
 *   Athlete: kenta.tanaka@athlete.jp      / Demo1234!  (Japanese)
 *   Athlete: max.weber@athlete.de         / Demo1234!  (German)
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_PASSWORD = "Demo1234!";

// ─── helpers ────────────────────────────────────────────────────────────────

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function upsertAuthUser(email: string, name: string, role: string) {
  if (!SERVICE_ROLE_KEY) {
    console.warn(
      `  [auth] SUPABASE_SERVICE_ROLE_KEY not set — skipping auth creation for ${email}`
    );
    return;
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error && !error.message.toLowerCase().includes("already registered")) {
    console.error(`  [auth] Failed to create ${email}:`, error.message);
  } else {
    console.log(`  [auth] Created / already exists: ${email}`);
  }
}

// ─── week start dates (Monday 00:00 UTC) ────────────────────────────────────

const WEEKS = [
  new Date("2026-06-01T00:00:00Z"),
  new Date("2026-06-08T00:00:00Z"),
  new Date("2026-06-15T00:00:00Z"),
  new Date("2026-06-22T00:00:00Z"),
];

// ─── training data per athlete ───────────────────────────────────────────────

type ResultRow = {
  setIndex: number;
  segmentIndex: number;
  distanceM?: number;
  timeSec?: number;
  isDnf?: boolean;
  note?: string;
};

type Session = {
  dayOffset: number; // 0=Mon, 2=Wed, 4=Fri
  menuText: string;
  menuTextDe: string;
  results: ResultRow[];
};

type WeekData = {
  reflection: string;
  reflectionDe: string;
  sessions: Session[];
};

// ─── Sarah Johnson (English) ─────────────────────────────────────────────────

const sarahWeeks: WeekData[] = [
  // Week 1
  {
    reflection:
      "Good week overall. My 400m times are slowly coming down which is encouraging. The hurdle sessions still feel a bit mechanical but the rhythm is improving session by session. Looking forward to building on this next week.",
    reflectionDe:
      "Insgesamt eine gute Woche. Meine 400m-Zeiten sinken langsam, was ermutigend ist. Die Hürdeneinheiten fühlen sich noch etwas mechanisch an, aber der Rhythmus verbessert sich von Einheit zu Einheit. Ich freue mich darauf, nächste Woche daran anzuknüpfen.",
    sessions: [
      {
        dayOffset: 0, // Mon
        menuText:
          "2× (200m – 200m – 400m)\nHurdle drills: 4×15m single-leg skip\nCool-down jog 800m",
        menuTextDe:
          "2× (200m – 200m – 400m)\nHürdenübungen: 4×15m einbeiniges Skipping\nAuslaufen 800m",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 27.8 },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 27.1 },
          { setIndex: 1, segmentIndex: 3, distanceM: 400, timeSec: 59.3 },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 28.6 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 28.2 },
          { setIndex: 2, segmentIndex: 3, distanceM: 400, timeSec: 61.5 },
        ],
      },
      {
        dayOffset: 2, // Wed
        menuText:
          "3× 400m tempo\nCore circuit: 3 sets plank / side plank / leg raises\nStability ball exercises",
        menuTextDe:
          "3× 400m Tempo\nRumpfkräftigung: 3 Sätze Plank / Seitstütz / Beinheben\nÜbungen mit dem Gymnastiball",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 400, timeSec: 62.4 },
          { setIndex: 2, segmentIndex: 1, distanceM: 400, timeSec: 63.2 },
          { setIndex: 3, segmentIndex: 1, distanceM: 400, timeSec: 64.8 },
        ],
      },
      {
        dayOffset: 4, // Fri
        menuText:
          "Hurdle practice: 3× 100m hurdles\n2× 200m acceleration\nFlexibility & cool-down",
        menuTextDe:
          "Hürdentraining: 3× 100m Hürden\n2× 200m Beschleunigung\nDehnen & Auslaufen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 100, timeSec: 15.4, note: "hurdles" },
          { setIndex: 2, segmentIndex: 1, distanceM: 100, timeSec: 15.1, note: "hurdles" },
          { setIndex: 3, segmentIndex: 1, distanceM: 100, timeSec: 14.9, note: "hurdles" },
          { setIndex: 4, segmentIndex: 1, distanceM: 200, timeSec: 26.7 },
          { setIndex: 5, segmentIndex: 1, distanceM: 200, timeSec: 27.0 },
        ],
      },
    ],
  },
  // Week 2
  {
    reflection:
      "Wednesday was tough — legs were heavy from Monday's session. Scaled back the volume and it paid off on Friday. Hit a small personal best on the 200m hurdle split. Overall a positive week despite the mid-week fatigue.",
    reflectionDe:
      "Mittwoch war schwer — die Beine waren nach der Montagseinheit schwer. Ich habe das Volumen reduziert und das zahlte sich am Freitag aus. Kleiner persönlicher Rekord beim 200m-Hürdensplit. Insgesamt eine positive Woche trotz der Müdigkeit Mitte der Woche.",
    sessions: [
      {
        dayOffset: 0,
        menuText:
          "2× (300m – 200m – 100m)\nHurdle drills: 4×15m single-leg skip\nJump rope 3×2 min",
        menuTextDe:
          "2× (300m – 200m – 100m)\nHürdenübungen: 4×15m einbeiniges Skipping\nSeilspringen 3×2 Min",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 300, timeSec: 43.1 },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 27.4 },
          { setIndex: 1, segmentIndex: 3, distanceM: 100, timeSec: 12.8 },
          { setIndex: 2, segmentIndex: 1, distanceM: 300, timeSec: 44.7 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 28.1 },
          { setIndex: 2, segmentIndex: 3, distanceM: 100, timeSec: 13.2 },
        ],
      },
      {
        dayOffset: 2,
        menuText:
          "Recovery session: 2× 400m easy\nMobility work: hip flexors, glutes\nStability ball exercises",
        menuTextDe:
          "Regenerationseinheit: 2× 400m locker\nMobilitätsarbeit: Hüftbeuger, Gesäß\nÜbungen mit dem Gymnastiball",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 400, timeSec: 66.5, note: "easy pace" },
          { setIndex: 2, segmentIndex: 1, distanceM: 400, timeSec: 67.2, note: "easy pace" },
        ],
      },
      {
        dayOffset: 4,
        menuText:
          "2× (200m hurdles – 200m flat)\nSpeed endurance: 1× 300m\nCool-down",
        menuTextDe:
          "2× (200m Hürden – 200m flach)\nSchnelligkeitsausdauer: 1× 300m\nAuslaufen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 29.8, note: "hurdles" },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 26.4 },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 30.2, note: "hurdles" },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 27.1 },
          { setIndex: 3, segmentIndex: 1, distanceM: 300, timeSec: 42.6 },
        ],
      },
    ],
  },
  // Week 3
  {
    reflection:
      "Really solid week. The technical coaching on my lead leg clearance is paying off. I felt more relaxed through the barriers on Friday and my 400m time dropped below 59 seconds for the first time. Confidence is building.",
    reflectionDe:
      "Eine wirklich solide Woche. Die technische Arbeit an meiner Führungsbeinschwinge zahlt sich aus. Am Freitag fühlte ich mich entspannter über die Hindernisse und meine 400m-Zeit fiel zum ersten Mal unter 59 Sekunden. Das Selbstvertrauen wächst.",
    sessions: [
      {
        dayOffset: 0,
        menuText:
          "2× (200m – 200m – 400m)\nHurdle drills: lead leg emphasis 6×15m\nJump rope 2×2 min",
        menuTextDe:
          "2× (200m – 200m – 400m)\nHürdenübungen: Schwerpunkt Führungsbein 6×15m\nSeilspringen 2×2 Min",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 27.2 },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 26.8 },
          { setIndex: 1, segmentIndex: 3, distanceM: 400, timeSec: 58.9 },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 28.0 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 27.5 },
          { setIndex: 2, segmentIndex: 3, distanceM: 400, timeSec: 60.3 },
        ],
      },
      {
        dayOffset: 2,
        menuText:
          "3× 500m progressive\nCore: 3 sets (plank 60s / Russian twist / glute bridge)\nStability work",
        menuTextDe:
          "3× 500m progressiv\nRumpf: 3 Sätze (Plank 60s / Russian Twist / Gesäßbrücke)\nStabilitätsarbeit",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 500, timeSec: 85.4 },
          { setIndex: 2, segmentIndex: 1, distanceM: 500, timeSec: 84.1 },
          { setIndex: 3, segmentIndex: 1, distanceM: 500, timeSec: 83.6 },
        ],
      },
      {
        dayOffset: 4,
        menuText:
          "Full 400m hurdles race simulation\n1× 300m flat\nCool-down jog",
        menuTextDe:
          "400m Hürden Rennsimulation\n1× 300m flach\nAuslaufen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 400, timeSec: 58.6, note: "hurdles, race sim" },
          { setIndex: 2, segmentIndex: 1, distanceM: 300, timeSec: 41.8 },
        ],
      },
    ],
  },
  // Week 4
  {
    reflection:
      "Best week of the training block! Every session felt fluid and controlled. Hit 58.1 seconds in the race simulation on Friday which is a new training personal best. My conditioning is at a level I've never felt before. Ready for the competition season.",
    reflectionDe:
      "Beste Woche des Trainingsblocks! Jede Einheit fühlte sich flüssig und kontrolliert an. Bei der Rennsimulation am Freitag lief ich 58,1 Sekunden — ein neuer Trainings-Persönlichkeitsrekord. Meine Kondition ist auf einem Niveau, das ich noch nie gespürt habe. Bereit für die Wettkampfsaison.",
    sessions: [
      {
        dayOffset: 0,
        menuText:
          "2× (200m – 200m – 400m)\nHurdle drills: full stride pattern 4×60m\nJump rope 3×90s",
        menuTextDe:
          "2× (200m – 200m – 400m)\nHürdenübungen: vollständiges Schrittmuster 4×60m\nSeilspringen 3×90s",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 26.9 },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 26.3 },
          { setIndex: 1, segmentIndex: 3, distanceM: 400, timeSec: 58.5 },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 27.4 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 27.2 },
          { setIndex: 2, segmentIndex: 3, distanceM: 400, timeSec: 59.9 },
        ],
      },
      {
        dayOffset: 2,
        menuText:
          "Speed work: 4× 150m at race pace\nHurdle approach drills: 3×10 strides\nCore circuit",
        menuTextDe:
          "Schnelligkeitsarbeit: 4× 150m in Wettkampftempo\nHürdenanfahrtsübungen: 3×10 Schritte\nRumpfkräftigung",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 150, timeSec: 19.4 },
          { setIndex: 2, segmentIndex: 1, distanceM: 150, timeSec: 19.1 },
          { setIndex: 3, segmentIndex: 1, distanceM: 150, timeSec: 18.9 },
          { setIndex: 4, segmentIndex: 1, distanceM: 150, timeSec: 19.3 },
        ],
      },
      {
        dayOffset: 4,
        menuText:
          "Race simulation: 400m hurdles\n200m at max effort\nCool-down & stretch",
        menuTextDe:
          "Rennsimulation: 400m Hürden\n200m maximale Anstrengung\nAuslaufen & Dehnen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 400, timeSec: 58.1, note: "hurdles, PB" },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 25.8, note: "max effort" },
        ],
      },
    ],
  },
];

// ─── Kenta Tanaka (Japanese) ─────────────────────────────────────────────────

const kentaWeeks: WeekData[] = [
  // Week 1
  {
    reflection:
      "今週は全体的に良いトレーニングができました。特に水曜日のインターバルセッションで体の調子が良く、400mのタイムが安定してきています。金曜日は少し疲れていましたが、ペースを落とさずに走り切れました。",
    reflectionDe:
      "Diese Woche hatte ich insgesamt ein gutes Training. Besonders die Intervalleinheit am Mittwoch lief gut, und meine 400m-Zeiten werden stabiler. Am Freitag war ich etwas müde, konnte aber das Tempo halten.",
    sessions: [
      {
        dayOffset: 0,
        menuText:
          "2×(200m－200m－400m)\n4×15m 片脚スキッピング\nクールダウン800mジョグ",
        menuTextDe:
          "2×(200m－200m－400m)\n4×15m einbeiniges Skipping\nAuslaufen 800m Jogging",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 26.4 },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 25.9 },
          { setIndex: 1, segmentIndex: 3, distanceM: 400, timeSec: 56.8 },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 27.1 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 26.8 },
          { setIndex: 2, segmentIndex: 3, distanceM: 400, timeSec: 58.3 },
        ],
      },
      {
        dayOffset: 2,
        menuText:
          "3×500m インターバル\nコアトレーニング：プランク／サイドプランク／ヒップリフト 各3セット\nバランスボール",
        menuTextDe:
          "3×500m Intervall\nCore-Training: Plank / Seitstütz / Hip Lift je 3 Sätze\nBalanceball",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 500, timeSec: 82.3 },
          { setIndex: 2, segmentIndex: 1, distanceM: 500, timeSec: 83.1 },
          { setIndex: 3, segmentIndex: 1, distanceM: 500, timeSec: 83.7 },
        ],
      },
      {
        dayOffset: 4,
        menuText:
          "3×300m スピード走\n2×100m 加速走\nストレッチ・クールダウン",
        menuTextDe:
          "3×300m Speedlauf\n2×100m Beschleunigungslauf\nDehnen und Auslaufen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 300, timeSec: 38.9 },
          { setIndex: 2, segmentIndex: 1, distanceM: 300, timeSec: 39.4 },
          { setIndex: 3, segmentIndex: 1, distanceM: 300, timeSec: 39.8 },
          { setIndex: 4, segmentIndex: 1, distanceM: 100, timeSec: 11.6 },
          { setIndex: 5, segmentIndex: 1, distanceM: 100, timeSec: 11.9 },
        ],
      },
    ],
  },
  // Week 2
  {
    reflection:
      "月曜日に少し膝の違和感があったので、木曜日のセッションは軽めに調整しました。金曜日には問題なく走れて、500mで良いタイムが出ました。来週はもっと強度を上げていきたいです。",
    reflectionDe:
      "Am Montag hatte ich leichte Kniebeschwerden, deshalb habe ich die Donnerstageinheit leichter gestaltet. Am Freitag lief alles problemlos und ich erzielte gute Zeiten über 500m. Nächste Woche möchte ich die Intensität weiter steigern.",
    sessions: [
      {
        dayOffset: 0,
        menuText:
          "2×(300m－200m－100m)\n片脚スキッピング 4×15m\n縄跳び 3×2分",
        menuTextDe:
          "2×(300m－200m－100m)\nEinbeiniges Skipping 4×15m\nSeilspringen 3×2 Min",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 300, timeSec: 40.1, note: "膝の違和感あり" },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 26.7 },
          { setIndex: 1, segmentIndex: 3, distanceM: 100, timeSec: 12.2 },
          { setIndex: 2, segmentIndex: 1, distanceM: 300, timeSec: 41.3 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 27.3 },
          { setIndex: 2, segmentIndex: 3, distanceM: 100, timeSec: 12.5 },
        ],
      },
      {
        dayOffset: 2,
        menuText:
          "回復走 2×400m（軽いペース）\nモビリティ：股関節・ハムストリング\nコアトレーニング",
        menuTextDe:
          "Regenerationslauf 2×400m (leichtes Tempo)\nMobilität: Hüfte und Hamstrings\nCore-Training",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 400, timeSec: 68.0, note: "リカバリーペース" },
          { setIndex: 2, segmentIndex: 1, distanceM: 400, timeSec: 68.9, note: "リカバリーペース" },
        ],
      },
      {
        dayOffset: 4,
        menuText:
          "2×(500m／400m)\n1×300m スピード走\nクールダウン",
        menuTextDe:
          "2×(500m / 400m)\n1×300m Speedlauf\nAuslaufen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 500, timeSec: 81.5 },
          { setIndex: 1, segmentIndex: 2, distanceM: 400, timeSec: 57.2 },
          { setIndex: 2, segmentIndex: 1, distanceM: 500, timeSec: 82.4 },
          { setIndex: 2, segmentIndex: 2, distanceM: 400, timeSec: 58.0 },
          { setIndex: 3, segmentIndex: 1, distanceM: 300, timeSec: 38.6 },
        ],
      },
    ],
  },
  // Week 3
  {
    reflection:
      "今週はスプリントに集中した週でした。コーチのアドバイス通りに腕の振りを意識したところ、200mと400mのタイムが改善しました。特に木曜日の400mは自己ベストに迫るタイムでした。来週が楽しみです。",
    reflectionDe:
      "Diese Woche habe ich mich auf Sprints konzentriert. Durch die Arbeit an meiner Armschwung-Technik, wie vom Trainer empfohlen, verbesserten sich meine 200m- und 400m-Zeiten. Besonders die 400m am Donnerstag war nahe an meiner persönlichen Bestleistung. Ich freue mich auf nächste Woche.",
    sessions: [
      {
        dayOffset: 0,
        menuText:
          "2×(200m－200m－400m)\n腕振りドリル：4×60m\n縄跳び 2×2分",
        menuTextDe:
          "2×(200m－200m－400m)\nArmschwung-Drill: 4×60m\nSeilspringen 2×2 Min",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 25.8 },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 25.4 },
          { setIndex: 1, segmentIndex: 3, distanceM: 400, timeSec: 55.9 },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 26.3 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 26.1 },
          { setIndex: 2, segmentIndex: 3, distanceM: 400, timeSec: 57.2 },
        ],
      },
      {
        dayOffset: 2,
        menuText:
          "3×400m テンポ走\nプランク・コア強化 3セット\nスタビリゼーション",
        menuTextDe:
          "3×400m Tempolauf\nPlank, Core-Kräftigung 3 Sätze\nStabilisierung",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 400, timeSec: 56.4 },
          { setIndex: 2, segmentIndex: 1, distanceM: 400, timeSec: 56.8 },
          { setIndex: 3, segmentIndex: 1, distanceM: 400, timeSec: 57.5 },
        ],
      },
      {
        dayOffset: 4,
        menuText:
          "レースシミュレーション：400m\n2×200m 最大努力\nクールダウン・ストレッチ",
        menuTextDe:
          "Rennsimulation: 400m\n2×200m maximale Anstrengung\nAuslaufen & Dehnen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 400, timeSec: 55.2, note: "race sim" },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 25.0 },
          { setIndex: 3, segmentIndex: 1, distanceM: 200, timeSec: 25.6 },
        ],
      },
    ],
  },
  // Week 4
  {
    reflection:
      "今月のベストウィークでした！全セッションで自己ベスト水準のタイムが出て、体のキレを感じています。コーチのアドバイスのおかげで後半の失速が改善されました。400mで54秒台を出せたことが今週のハイライトです。試合が楽しみです。",
    reflectionDe:
      "Beste Woche des Monats! In allen Einheiten lief ich auf persönlicher-Bestleistungs-Niveau und ich spüre Explosivität im Körper. Dank des Trainer-Feedbacks hat sich meine Leistungsabnahme in der zweiten Hälfte verbessert. Das Highlight dieser Woche war meine 400m-Zeit unter 55 Sekunden. Ich freue mich auf den Wettkampf.",
    sessions: [
      {
        dayOffset: 0,
        menuText:
          "2×(200m－200m－400m)\n4×60m 加速ドリル\n縄跳び 3×90秒",
        menuTextDe:
          "2×(200m－200m－400m)\n4×60m Beschleunigungsdrill\nSeilspringen 3×90s",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 25.3 },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 24.9 },
          { setIndex: 1, segmentIndex: 3, distanceM: 400, timeSec: 54.7 },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 25.8 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 25.5 },
          { setIndex: 2, segmentIndex: 3, distanceM: 400, timeSec: 56.0 },
        ],
      },
      {
        dayOffset: 2,
        menuText:
          "スピード持久走：4×150m\n300mスピード走\nコアサーキット",
        menuTextDe:
          "Schnelligkeitsausdauer: 4×150m\n300m Speedlauf\nCore-Zirkel",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 150, timeSec: 18.2 },
          { setIndex: 2, segmentIndex: 1, distanceM: 150, timeSec: 18.0 },
          { setIndex: 3, segmentIndex: 1, distanceM: 150, timeSec: 17.9 },
          { setIndex: 4, segmentIndex: 1, distanceM: 150, timeSec: 18.4 },
          { setIndex: 5, segmentIndex: 1, distanceM: 300, timeSec: 38.1 },
        ],
      },
      {
        dayOffset: 4,
        menuText:
          "レースシミュレーション：400m\n200m 最大努力\nクールダウン",
        menuTextDe:
          "Rennsimulation: 400m\n200m maximale Anstrengung\nAuslaufen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 400, timeSec: 54.3, note: "race sim, 自己ベスト" },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 24.5, note: "max effort" },
        ],
      },
    ],
  },
];

// ─── Max Weber (German) ──────────────────────────────────────────────────────

const maxWeeks: WeekData[] = [
  // Week 1
  {
    reflection:
      "Eine gute Auftaktwoche für diesen Trainingsblock. Die Intervalleinheiten haben gut funktioniert, besonders Montag und Mittwoch. Freitag war ich noch etwas schwer in den Beinen, aber ich habe das Tempo trotzdem gehalten. Insgesamt bin ich zufrieden.",
    reflectionDe:
      "Eine gute Auftaktwoche für diesen Trainingsblock. Die Intervalleinheiten haben gut funktioniert, besonders Montag und Mittwoch. Freitag war ich noch etwas schwer in den Beinen, aber ich habe das Tempo trotzdem gehalten. Insgesamt bin ich zufrieden.",
    sessions: [
      {
        dayOffset: 0,
        menuText:
          "2× (200m – 200m – 400m)\n4×15m einbeiniges Skipping\nSeilspringen 3×2 Min",
        menuTextDe:
          "2× (200m – 200m – 400m)\n4×15m einbeiniges Skipping\nSeilspringen 3×2 Min",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 26.0 },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 25.6 },
          { setIndex: 1, segmentIndex: 3, distanceM: 400, timeSec: 56.3 },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 26.8 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 26.4 },
          { setIndex: 2, segmentIndex: 3, distanceM: 400, timeSec: 58.0 },
        ],
      },
      {
        dayOffset: 2,
        menuText:
          "3× 500m Tempolauf\nRumpfkräftigung: Plank / Seitstütz / Beinhebeserie 3 Sätze\nStabilisationstraining mit Gymnastiball",
        menuTextDe:
          "3× 500m Tempolauf\nRumpfkräftigung: Plank / Seitstütz / Beinhebeserie 3 Sätze\nStabilisationstraining mit Gymnastiball",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 500, timeSec: 83.4 },
          { setIndex: 2, segmentIndex: 1, distanceM: 500, timeSec: 84.2 },
          { setIndex: 3, segmentIndex: 1, distanceM: 500, timeSec: 85.0 },
        ],
      },
      {
        dayOffset: 4,
        menuText:
          "Hürdentraining: 3× 100m mit Hürden\n2× 300m Speedlauf\nAuslaufen und Dehnen",
        menuTextDe:
          "Hürdentraining: 3× 100m mit Hürden\n2× 300m Speedlauf\nAuslaufen und Dehnen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 100, timeSec: 13.8, note: "mit Hürden" },
          { setIndex: 2, segmentIndex: 1, distanceM: 100, timeSec: 13.5, note: "mit Hürden" },
          { setIndex: 3, segmentIndex: 1, distanceM: 100, timeSec: 13.2, note: "mit Hürden" },
          { setIndex: 4, segmentIndex: 1, distanceM: 300, timeSec: 40.5 },
          { setIndex: 5, segmentIndex: 1, distanceM: 300, timeSec: 41.1 },
        ],
      },
    ],
  },
  // Week 2
  {
    reflection:
      "Mittwoch war ich etwas müde und habe die Belastung leicht reduziert. Donnerstag und Freitag liefen dagegen sehr gut. Die Hürdenarbeit verbessert sich spürbar — ich fühle mich über den Hindernissen flüssiger. Insgesamt war es eine positive Woche.",
    reflectionDe:
      "Mittwoch war ich etwas müde und habe die Belastung leicht reduziert. Donnerstag und Freitag liefen dagegen sehr gut. Die Hürdenarbeit verbessert sich spürbar — ich fühle mich über den Hindernissen flüssiger. Insgesamt war es eine positive Woche.",
    sessions: [
      {
        dayOffset: 0,
        menuText:
          "2× (300m – 200m – 100m)\nHürdendrills: 4×15m einbeiniges Skipping\nSeilspringen 3×2 Min",
        menuTextDe:
          "2× (300m – 200m – 100m)\nHürdendrills: 4×15m einbeiniges Skipping\nSeilspringen 3×2 Min",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 300, timeSec: 41.2 },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 26.3 },
          { setIndex: 1, segmentIndex: 3, distanceM: 100, timeSec: 12.0 },
          { setIndex: 2, segmentIndex: 1, distanceM: 300, timeSec: 42.5 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 27.1 },
          { setIndex: 2, segmentIndex: 3, distanceM: 100, timeSec: 12.6 },
        ],
      },
      {
        dayOffset: 2,
        menuText:
          "Regenerationseinheit: 2× 400m locker\nMobilitätsarbeit: Hüftbeuger, Gesäßmuskulatur\nStabilisationstraining",
        menuTextDe:
          "Regenerationseinheit: 2× 400m locker\nMobilitätsarbeit: Hüftbeuger, Gesäßmuskulatur\nStabilisationstraining",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 400, timeSec: 67.0, note: "lockeres Tempo" },
          { setIndex: 2, segmentIndex: 1, distanceM: 400, timeSec: 67.8, note: "lockeres Tempo" },
        ],
      },
      {
        dayOffset: 4,
        menuText:
          "2× (200m Hürden – 200m flach)\n1× 400m Renntempo\nAuslaufen",
        menuTextDe:
          "2× (200m Hürden – 200m flach)\n1× 400m Renntempo\nAuslaufen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 28.9, note: "mit Hürden" },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 25.8 },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 29.4, note: "mit Hürden" },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 26.3 },
          { setIndex: 3, segmentIndex: 1, distanceM: 400, timeSec: 55.9 },
        ],
      },
    ],
  },
  // Week 3
  {
    reflection:
      "Starke Woche. Meine 400m-Zeit verbessert sich kontinuierlich. Die Technikarbeit beim Hürdenlauf zahlt sich aus — ich verliere über den Hürden weniger Geschwindigkeit als zuvor. Am Freitag lief ich beim Rennsimulation unter 55 Sekunden, was ein neuer Trainingsrekord für mich ist.",
    reflectionDe:
      "Starke Woche. Meine 400m-Zeit verbessert sich kontinuierlich. Die Technikarbeit beim Hürdenlauf zahlt sich aus — ich verliere über den Hürden weniger Geschwindigkeit als zuvor. Am Freitag lief ich beim Rennsimulation unter 55 Sekunden, was ein neuer Trainingsrekord für mich ist.",
    sessions: [
      {
        dayOffset: 0,
        menuText:
          "2× (200m – 200m – 400m)\nHürdendrills mit Schwerpunkt Führungsbein: 6×15m\nSeilspringen 2×2 Min",
        menuTextDe:
          "2× (200m – 200m – 400m)\nHürdendrills mit Schwerpunkt Führungsbein: 6×15m\nSeilspringen 2×2 Min",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 25.5 },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 25.1 },
          { setIndex: 1, segmentIndex: 3, distanceM: 400, timeSec: 55.0 },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 26.2 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 25.9 },
          { setIndex: 2, segmentIndex: 3, distanceM: 400, timeSec: 56.8 },
        ],
      },
      {
        dayOffset: 2,
        menuText:
          "3× 500m progressiv\nKernkräftigung: 3 Sätze (Plank 60s / Russian Twist / Gesäßbrücke)\nStabilitätsarbeit",
        menuTextDe:
          "3× 500m progressiv\nKernkräftigung: 3 Sätze (Plank 60s / Russian Twist / Gesäßbrücke)\nStabilitätsarbeit",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 500, timeSec: 82.0 },
          { setIndex: 2, segmentIndex: 1, distanceM: 500, timeSec: 81.3 },
          { setIndex: 3, segmentIndex: 1, distanceM: 500, timeSec: 80.7 },
        ],
      },
      {
        dayOffset: 4,
        menuText:
          "400m Hürden Rennsimulation\n1× 300m flach\nAuslaufen",
        menuTextDe:
          "400m Hürden Rennsimulation\n1× 300m flach\nAuslaufen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 400, timeSec: 54.8, note: "mit Hürden, Rennsimulation" },
          { setIndex: 2, segmentIndex: 1, distanceM: 300, timeSec: 39.7 },
        ],
      },
    ],
  },
  // Week 4
  {
    reflection:
      "Beste Woche des Monats! Ich bin in sehr guter Form. Alle Einheiten liefen kontrolliert und mit gutem Gefühl. Am Freitag lief ich beim Rennsimulation 54,1 Sekunden mit Hürden — das ist ein neuer persönlicher Trainingsrekord. Ich freue mich sehr auf den bevorstehenden Wettkampf.",
    reflectionDe:
      "Beste Woche des Monats! Ich bin in sehr guter Form. Alle Einheiten liefen kontrolliert und mit gutem Gefühl. Am Freitag lief ich beim Rennsimulation 54,1 Sekunden mit Hürden — das ist ein neuer persönlicher Trainingsrekord. Ich freue mich sehr auf den bevorstehenden Wettkampf.",
    sessions: [
      {
        dayOffset: 0,
        menuText:
          "2× (200m – 200m – 400m)\nHürdendrills vollständiges Schrittmuster: 4×60m\nSeilspringen 3×90s",
        menuTextDe:
          "2× (200m – 200m – 400m)\nHürdendrills vollständiges Schrittmuster: 4×60m\nSeilspringen 3×90s",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 25.1 },
          { setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 24.7 },
          { setIndex: 1, segmentIndex: 3, distanceM: 400, timeSec: 54.5 },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 25.6 },
          { setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 25.3 },
          { setIndex: 2, segmentIndex: 3, distanceM: 400, timeSec: 55.7 },
        ],
      },
      {
        dayOffset: 2,
        menuText:
          "Schnelligkeitsarbeit: 4× 150m in Wettkampftempo\nHürdenanfahrt: 3×10 Schritte\nRumpfkräftigung",
        menuTextDe:
          "Schnelligkeitsarbeit: 4× 150m in Wettkampftempo\nHürdenanfahrt: 3×10 Schritte\nRumpfkräftigung",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 150, timeSec: 18.9 },
          { setIndex: 2, segmentIndex: 1, distanceM: 150, timeSec: 18.6 },
          { setIndex: 3, segmentIndex: 1, distanceM: 150, timeSec: 18.4 },
          { setIndex: 4, segmentIndex: 1, distanceM: 150, timeSec: 18.8 },
        ],
      },
      {
        dayOffset: 4,
        menuText:
          "400m Hürden Rennsimulation\n200m maximale Anstrengung\nAuslaufen und Dehnen",
        menuTextDe:
          "400m Hürden Rennsimulation\n200m maximale Anstrengung\nAuslaufen und Dehnen",
        results: [
          { setIndex: 1, segmentIndex: 1, distanceM: 400, timeSec: 54.1, note: "mit Hürden, PB" },
          { setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 24.3, note: "maximale Anstrengung" },
        ],
      },
    ],
  },
];

// ─── Coach comments per athlete per week (in German) ─────────────────────────

const coachComments: Record<string, string[][]> = {
  sarah: [
    [
      // Week 1
      "Guter Start in den Trainingsblock, Sarah! Deine 400m-Zeiten sind solide für diese Phase. Konzentriere dich weiterhin auf die Hürdentechnik — das Führungsbein-Timing kannst du noch verbessern. Nächste Woche erhöhen wir die Intensität leicht.",
      "日本語訳：サラ、トレーニングブロックの良いスタートです！あなたの400mタイムはこのフェーズとしては堅実です。引き続きハードル技術に集中してください——リードレッグのタイミングはまだ改善できます。来週は強度を少し上げていきましょう。",
    ],
    [
      // Week 2
      "Kluge Entscheidung, Mittwoch das Volumen zu reduzieren! Das Zuhören auf den eigenen Körper ist ein wichtiger Teil des Trainings. Der persönliche Rekord beim 200m-Hürdensplit am Freitag zeigt, dass dein Ansatz richtig war. Weiter so!",
      "日本語訳：水曜日にボリュームを下げた賢明な決断でした！自分の体に耳を傾けることはトレーニングの重要な部分です。金曜日の200mハードルスプリットでの自己ベストは、あなたのアプローチが正しかったことを示しています。その調子で続けましょう！",
    ],
    [
      // Week 3
      "Ausgezeichnet! Die technische Verbesserung beim Führungsbein ist deutlich sichtbar. 58,6 Sekunden in der Rennsimulation ist ein sehr starkes Ergebnis — du bist auf einem sehr guten Weg für die Wettkampfsaison. Halten wir dieses Niveau nächste Woche.",
      "日本語訳：素晴らしい！リードレッグの技術改善が明確に見えます。レースシミュレーションでの58.6秒は非常に強力な結果です——競技シーズンに向けて非常に良い軌道に乗っています。来週もこのレベルを維持しましょう。",
    ],
    [
      // Week 4
      "Fantastisch, Sarah! 58,1 Sekunden ist ein beeindruckender Trainings-Persönlichkeitsrekord. Du bist in ausgezeichneter Form für die bevorstehenden Wettkämpfe. Gute Erholung diese Woche und bleib fokussiert — ich freue mich darauf, dich im Wettkampf zu sehen!",
      "日本語訳：素晴らしい、サラ！58.1秒は印象的なトレーニング自己記録です。来たる競技に向けて絶好調です。今週はしっかり回復して、集中力を維持してください——競技でのあなたを楽しみにしています！",
    ],
  ],
  kenta: [
    [
      // Week 1
      "Guter Auftakt, Kenta! Die 500m-Intervalle am Mittwoch sehen sehr konstant aus — das zeigt eine gute aerobe Basis. Deine 400m-Zeit von 56,8 Sekunden im ersten Satz Montag ist stark. Achte auf die Armführung in der zweiten Streckenhälfte.",
      "日本語訳：良いスタートです、ケンタ！水曜日の500mインターバルは非常に一定しています——良い有酸素ベースを示しています。月曜日の最初のセットでの400m 56.8秒は強力です。後半の腕の動きに注意してください。",
    ],
    [
      // Week 2
      "Gut gemacht, dass du bei Kniebeschwerden das Training angepasst hast! Prävention ist wichtiger als ein einzelnes Training. Die 500m am Freitag waren solide trotz des schwierigen Wochenstarts. Komm erholt in die nächste Woche!",
      "日本語訳：膝の不調がある時にトレーニングを調整したのは良かったです！予防は個々のトレーニングより重要です。週の難しいスタートにもかかわらず、金曜日の500mは堅実でした。次の週に回復して臨みましょう！",
    ],
    [
      // Week 3
      "Beeindruckend! Die Verbesserung der Armtechnik ist klar in den Zeiten zu sehen. 55,2 Sekunden in der Rennsimulation — das ist Wettkampfniveau. Arbeite weiter an der zweiten Streckenhälfte, da liegt noch Potenzial. Sehr gute Woche!",
      "日本語訳：印象的！腕の技術の改善がタイムに明確に表れています。レースシミュレーションでの55.2秒——それは競技レベルです。後半にはまだポテンシャルがあるので、引き続き取り組んでください。非常に良い週でした！",
    ],
    [
      // Week 4
      "Außergewöhnlich, Kenta! 54,3 Sekunden ist ein fantastisches Ergebnis. Deine Fortschritte in diesem Monat sind bemerkenswert. Ich bin sehr gespannt auf deinen nächsten Wettkampf — du bist bereit für große Zeiten. Weiter so und bleib fokussiert!",
      "日本語訳：素晴らしい、ケンタ！54.3秒は素晴らしい結果です。今月のあなたの進歩は驚くべきものです。次の競技がとても楽しみです——大きなタイムへの準備ができています。その調子で、集中力を保ってください！",
    ],
  ],
  max: [
    [
      // Week 1
      "Guter Start, Max! Die Intervalleeinheiten sehen solide aus. Deine 400m-Zeit von 56,3 Sekunden im ersten Satz ist ein guter Ausgangspunkt. Die Hürdenarbeit am Freitag zeigt eine klare Verbesserung des Rhythmus. Mach weiter so!",
      "日本語訳：良いスタートです、マックス！インターバルセッションは堅実に見えます。最初のセットでの400m 56.3秒は良い出発点です。金曜日のハードルワークはリズムの明確な改善を示しています。そのまま続けましょう！",
    ],
    [
      // Week 2
      "Sehr vernünftig, Mittwoch das Volumen zu reduzieren. Das Renntempo am Freitag mit 55,9 Sekunden zeigt, dass du in sehr guter Form bist. Die Flüssigkeit über die Hürden verbessert sich sichtbar. Nächste Woche können wir die Intensität hochschrauben.",
      "日本語訳：水曜日にボリュームを減らしたのは非常に賢明でした。金曜日のレースペース55.9秒はあなたが非常に良い状態にあることを示しています。ハードル越えの流れが目に見えて改善されています。来週は強度を上げることができます。",
    ],
    [
      // Week 3
      "Starke Leistung, Max! 54,8 Sekunden in der Hürdenrennsimulation ist ein neues Level. Die Verbesserung der Hürdentechnik ist deutlich zu spüren — du verlierst kaum noch Geschwindigkeit über die Hürden. Das ist genau der richtige Weg. Top-Woche!",
      "日本語訳：強い成績です、マックス！ハードルレースシミュレーションでの54.8秒は新しいレベルです。ハードル技術の改善が明確に感じられます——ハードル越えでほとんどスピードを失わなくなっています。これはまさに正しい方向性です。素晴らしい週でした！",
    ],
    [
      // Week 4
      "Ausgezeichnet, Max! 54,1 Sekunden ist ein hervorragender Trainings-Persönlichkeitsrekord. Du bist in Topform für die Wettkampfsaison. Diese Woche gut erholen, fokussiert bleiben und dann alles im Wettkampf abrufen — ich bin überzeugt, dass du Großes leisten wirst!",
      "日本語訳：素晴らしい、マックス！54.1秒は優れたトレーニング自己記録です。競技シーズンに向けてトップフォームです。今週しっかり回復し、集中力を保ち、競技で全てを発揮してください——素晴らしいパフォーマンスができると確信しています！",
    ],
  ],
};

// ─── seed function ────────────────────────────────────────────────────────────

async function seed() {
  console.log("Starting seed...\n");

  // 1. Create auth users
  console.log("Creating auth users...");
  await upsertAuthUser("thomas.mueller@coach.de", "Thomas Müller", "COACH");
  await upsertAuthUser("sarah.johnson@athlete.com", "Sarah Johnson", "ATHLETE");
  await upsertAuthUser("kenta.tanaka@athlete.jp", "Kenta Tanaka", "ATHLETE");
  await upsertAuthUser("max.weber@athlete.de", "Max Weber", "ATHLETE");
  console.log();

  // 2. Upsert Prisma users
  console.log("Upserting Prisma users...");

  const coach = await prisma.user.upsert({
    where: { email: "thomas.mueller@coach.de" },
    update: {},
    create: { email: "thomas.mueller@coach.de", name: "Thomas Müller", role: "COACH" },
  });
  console.log(`  Coach: ${coach.name} (${coach.id})`);

  const sarah = await prisma.user.upsert({
    where: { email: "sarah.johnson@athlete.com" },
    update: {},
    create: {
      email: "sarah.johnson@athlete.com",
      name: "Sarah Johnson",
      role: "ATHLETE",
      coachId: coach.id,
    },
  });
  console.log(`  Athlete: ${sarah.name} (${sarah.id})`);

  // Set coachId if not set (upsert skips update: {})
  await prisma.user.update({
    where: { id: sarah.id },
    data: { coachId: coach.id },
  });

  const kenta = await prisma.user.upsert({
    where: { email: "kenta.tanaka@athlete.jp" },
    update: {},
    create: {
      email: "kenta.tanaka@athlete.jp",
      name: "田中 健太",
      role: "ATHLETE",
      coachId: coach.id,
    },
  });
  console.log(`  Athlete: ${kenta.name} (${kenta.id})`);
  await prisma.user.update({
    where: { id: kenta.id },
    data: { coachId: coach.id },
  });

  const max = await prisma.user.upsert({
    where: { email: "max.weber@athlete.de" },
    update: {},
    create: {
      email: "max.weber@athlete.de",
      name: "Max Weber",
      role: "ATHLETE",
      coachId: coach.id,
    },
  });
  console.log(`  Athlete: ${max.name} (${max.id})`);
  await prisma.user.update({
    where: { id: max.id },
    data: { coachId: coach.id },
  });
  console.log();

  // 3. Create weekly reports + sessions + results + comments
  const athleteData = [
    { user: sarah, weeks: sarahWeeks, commentKey: "sarah" },
    { user: kenta, weeks: kentaWeeks, commentKey: "kenta" },
    { user: max, weeks: maxWeeks, commentKey: "max" },
  ];

  for (const { user, weeks, commentKey } of athleteData) {
    console.log(`Creating data for ${user.name}...`);

    for (let wi = 0; wi < WEEKS.length; wi++) {
      const weekStart = WEEKS[wi];
      const weekData = weeks[wi];

      const report = await prisma.weeklyReport.upsert({
        where: { athleteId_weekStart: { athleteId: user.id, weekStart } },
        update: {
          reflection: weekData.reflection,
          reflectionDe: weekData.reflectionDe,
          submittedAt: addDays(weekStart, 5), // submitted Saturday
        },
        create: {
          athleteId: user.id,
          weekStart,
          reflection: weekData.reflection,
          reflectionDe: weekData.reflectionDe,
          submittedAt: addDays(weekStart, 5),
        },
      });

      // Delete existing sessions for idempotency
      await prisma.trainingSession.deleteMany({ where: { reportId: report.id } });

      for (const session of weekData.sessions) {
        const sessionDate = addDays(weekStart, session.dayOffset);
        const ts = await prisma.trainingSession.create({
          data: {
            reportId: report.id,
            date: sessionDate,
            menuText: session.menuText,
            menuTextDe: session.menuTextDe,
          },
        });

        await prisma.sessionResult.createMany({
          data: session.results.map((r) => ({
            sessionId: ts.id,
            setIndex: r.setIndex,
            segmentIndex: r.segmentIndex,
            distanceM: r.distanceM ?? null,
            timeSec: r.timeSec ?? null,
            isDnf: r.isDnf ?? false,
            note: r.note ?? null,
          })),
        });
      }

      // Coach comment (delete old one first for idempotency)
      await prisma.comment.deleteMany({
        where: { reportId: report.id, authorId: coach.id },
      });

      const commentData = coachComments[commentKey][wi];
      await prisma.comment.create({
        data: {
          reportId: report.id,
          authorId: coach.id,
          body: commentData[0],
          bodyJa: commentData[1],
        },
      });

      console.log(
        `  Week ${wi + 1} (${weekStart.toISOString().slice(0, 10)}): report + ${weekData.sessions.length} sessions + comment`
      );
    }
  }

  console.log("\nSeed completed successfully!");
  console.log("\nDemo accounts (password: Demo1234!):");
  console.log("  Coach:   thomas.mueller@coach.de");
  console.log("  Athlete: sarah.johnson@athlete.com  (English)");
  console.log("  Athlete: kenta.tanaka@athlete.jp    (Japanese)");
  console.log("  Athlete: max.weber@athlete.de       (German)");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
