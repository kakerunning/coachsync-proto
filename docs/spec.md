# CoachSync-Proto: 仕様書

## プロジェクトの目的

アスリートが週次トレーニング報告(プログラム + フィードバック)をコーチに共有し、
コーチが多言語でレビュー・コメントできるWebアプリ。

実運用とポートフォリオの両立を目指す。前回プロジェクト (coachsync) は機能を複雑化させすぎたため、
本プロジェクトでは「集計しやすいシンプルなデータモデル」と「最小限の画面数」で再構築する。

## スコープ

### MVP (Phase 1)
- アスリートが週次レポートを作成・編集・提出
- 各日のトレーニングセッションを「自由記述メニュー + 構造化タイム」で記録
- 週次の総合フィードバック(自由記述)
- コーチがアスリートのレポートを閲覧 (自動でドイツ語に翻訳)
- コーチが各レポートにコメント (自動で日本語に翻訳)
- 1コーチ : 1アスリート

### Phase 2 (MVP完成後)
- 距離別タイム推移などの可視化
- 1コーチ : 複数アスリート対応

### スコープ外 (今回作らない)
- リアルタイム通知
- スマホアプリ
- 動画アップロード
- ハードル本数や種目タイプの厳密な分類
- セッション単位のコメント (週次のみ)

## データモデル

### Prismaスキーマ

```prisma
model User {
  id        String         @id @default(cuid())
  email     String         @unique
  name      String
  role      Role
  coachId   String?
  
  reports   WeeklyReport[]
  comments  Comment[]
  athletes  User[]         @relation("CoachAthletes")
  coach     User?          @relation("CoachAthletes", fields: [coachId], references: [id])
  
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
}

enum Role {
  ATHLETE
  COACH
}

model WeeklyReport {
  id           String            @id @default(cuid())
  athleteId    String
  weekStart    DateTime          // 月曜日 00:00 UTC
  reflection   String            // 週次FB自由記述 (アスリート原文)
  reflectionDe String?           // DeepL訳 (コーチ閲覧用)
  submittedAt  DateTime?         // null = 下書き状態
  
  athlete      User              @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  sessions     TrainingSession[]
  comments     Comment[]
  
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  
  @@unique([athleteId, weekStart])
  @@index([athleteId, submittedAt])
}

model TrainingSession {
  id          String          @id @default(cuid())
  reportId    String
  date        DateTime        // セッション日付
  menuText    String          // メニュー自由記述 (Joachimのメール形式そのまま)
  menuTextDe  String?         // DeepL訳
  
  report      WeeklyReport    @relation(fields: [reportId], references: [id], onDelete: Cascade)
  results     SessionResult[]
  
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  
  @@index([reportId, date])
}

model SessionResult {
  id           String          @id @default(cuid())
  sessionId    String
  setIndex     Int             // 1, 2, 3...
  segmentIndex Int             // セット内の順番 (1, 2, 3...)
  distanceM    Int?            // 200, 400等 (任意, 集計用)
  timeSec      Float?          // タイム (秒)
  isDnf        Boolean         @default(false)
  note         String?         // "mit Hürden", "Zeit verloren" 等
  
  session      TrainingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@unique([sessionId, setIndex, segmentIndex])
  @@index([distanceM])
  
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}

model Comment {
  id        String       @id @default(cuid())
  reportId  String
  authorId  String
  body      String       // 原文
  bodyJa    String?      // 日本語訳 (アスリート閲覧用)
  
  report    WeeklyReport @relation(fields: [reportId], references: [id], onDelete: Cascade)
  author    User         @relation(fields: [authorId], references: [id])
  
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  
  @@index([reportId, createdAt])
}
```

### データ例

実際のメール(2025年2月24日週)をこのスキーマに格納した例:

```
WeeklyReport
  weekStart: 2025-02-24
  reflection: "Ich merke, dass sich meine Grundlagenausdauer leicht verbessert hat..."
  
  TrainingSession (date: 2025-02-24)
    menuText: "2× (200m–200m–400m)\n4×15m einbeiniges Skipping\nSeilspringen"
    
    SessionResult
      setIndex: 1, segmentIndex: 1, distanceM: 200, timeSec: 28.4
      setIndex: 1, segmentIndex: 2, distanceM: 200, timeSec: 27.2
      setIndex: 1, segmentIndex: 3, distanceM: 400, timeSec: 59.7
      setIndex: 2, segmentIndex: 1, distanceM: 200, timeSec: 30.3
      setIndex: 2, segmentIndex: 2, distanceM: 200, timeSec: 30.0
      setIndex: 2, segmentIndex: 3, distanceM: 400, timeSec: 63.9
  
  TrainingSession (date: 2025-02-26)
    menuText: "2× (500m/400m/300m/200m)\n4×15m einbeiniges Skipping\nStabilisationstraining mit Gymnastikball"
    
    SessionResult
      setIndex: 1, segmentIndex: 1, distanceM: 500, timeSec: 88.7, note: "mit Hürden"
      setIndex: 1, segmentIndex: 2, distanceM: 400, timeSec: 63.6, note: "mit Hürden"
      setIndex: 1, segmentIndex: 3, distanceM: 300, timeSec: 51.0
      setIndex: 1, segmentIndex: 4, distanceM: 200, timeSec: null, isDnf: false, note: "Zeit verloren"
      setIndex: 2, segmentIndex: 1, distanceM: 500, timeSec: 88.8
      ...
```

## 画面仕様

### アスリート向け

#### 1. ダッシュボード (`/athlete`)
- 今週のレポート (作成中 or 未作成 → 「今週のレポートを開始」ボタン)
- 過去レポート一覧 (最新5件)
- 各レポートに「提出済み」「下書き」「コメントあり」のバッジ

#### 2. 週次レポート編集 (`/athlete/reports/[id]`)
- 週開始日表示 (例: "Trainingsbericht 24.02. - 02.03.")
- 「日付を追加」ボタン → TrainingSession を追加
- 各 TrainingSession ブロック:
  - 日付選択 (週内のみ)
  - メニュー自由記述欄 (複数行textarea)
  - Results セクション:
    - Set ごとに行グループ
    - 各行: distance (任意) + time + DNFチェックボックス + note (任意)
    - 「+ Segmentを追加」「+ Setを追加」ボタン
    - 行の削除ボタン
- 週次リフレクション欄 (textarea)
- 「下書き保存」「提出」ボタン
- 自動保存 (debounce 1000ms) → 「下書き保存」相当
- 提出後も編集可能 (再提出フラグなし、updated_at で追跡)

#### 3. レポート閲覧 (`/athlete/reports/[id]/view`)
- 編集モードと同じ内容を read-only で表示
- コメントセクション (コーチからのコメント、日本語訳付き)
- 「編集する」ボタン

### コーチ向け

#### 4. ダッシュボード (`/coach`)
- 担当アスリート一覧 (MVPでは1人)
- 各アスリートの最新レポート (提出日 + 未読コメント有無)

#### 5. レポート閲覧 (`/coach/athletes/[id]/reports/[reportId]`)
- アスリートのレポート (原文 + ドイツ語訳の切替トグル, デフォルト: ドイツ語)
- 各セッションのメニュー (`menuTextDe` 表示)
- 各 Result の表 (Set / Segment / Distance / Time / Note / DNF)
- 週次リフレクション (`reflectionDe` 表示)
- コメント入力欄 (ドイツ語/英語で書く前提)
- 過去コメント一覧 (translated to Japanese for athlete, source visible to coach)

### 共通

#### 6. ログイン (`/login`)
- メール + パスワード認証 (Supabase Auth)

#### 7. 設定 (`/settings`)
- 名前の編集
- (将来) 言語ペアの設定

## 翻訳ロジック

### DeepL API 使用箇所
| トリガー | 入力 | 出力 |
|---|---|---|
| TrainingSession作成・更新時 | menuText (任意言語) | menuTextDe (ドイツ語) |
| WeeklyReport 提出時 | reflection | reflectionDe (ドイツ語) |
| Comment作成時 | body (ドイツ語/英語) | bodyJa (日本語) |

### 実装ポリシー
- 翻訳はバックエンドで実行 (APIキー隠蔽)
- 原文と訳文を両方DBに保存 (再翻訳コストを避ける)
- 原文が更新されたら訳文を再生成
- DeepL APIが失敗してもメイン処理は継続 (訳文null許容)

## 認可ルール

| 操作 | アスリート | コーチ |
|---|---|---|
| 自分の WeeklyReport CRUD | ✅ | ❌ |
| 担当アスリートの WeeklyReport 閲覧 | ❌ | ✅ |
| 担当アスリートの WeeklyReport にコメント | ❌ | ✅ |
| 自分のコメント編集 | ❌ | ✅ (自分のもののみ) |
| 他人の WeeklyReport | ❌ | ❌ |

サーバーサイドで毎リクエスト確認 (middleware or per-route check)。

## 技術スタック

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Next.js Route Handlers (Edge ではなく Node runtime)
- **DB**: Supabase (新プロジェクト) + Prisma 7 + driver adapter (pg)
- **Auth**: Supabase Auth (email + password)
- **翻訳**: DeepL API (既存の Free tier 利用)
- **Deploy**: Vercel (新プロジェクト)
- **Testing**: Vitest (ユニット) + Playwright (E2E, MVP後)

### Prisma 7 重要メモ
- `prisma.config.ts` に DIRECT_URL を設定
- PrismaClient 初期化に `@prisma/adapter-pg` 必須
- Supabase Pooler URL を使用 (Session pooler 5432 → DIRECT_URL, Transaction pooler 6543 → DATABASE_URL)

## 開発ステップ

各 Step は1〜2時間で完結する粒度。完了後に必ず Kakeru が動作確認してから次へ。

### Step 0: プロジェクト初期化 + DB接続確認
- `coachsync-proto` リポジトリ作成
- Next.js プロジェクト初期化
- Supabase 新プロジェクト作成 (Kakeru手動)
- `prisma.config.ts` + Pooler URL 設定
- 最小限の Prisma schema (User のみ) で migration 成功確認
- `npx prisma studio` から User テーブル閲覧確認

**完了条件**: Prisma Studio で空の User テーブルが見える + ローカル開発サーバー起動

### Step 1: 完全な Prisma schema + 認証
- 上記スキーマ全体を migration
- Supabase Auth セットアップ (email/password)
- ログイン画面 (`/login`)
- サインアップ画面 (`/signup`) - Role選択付き
- ログイン後にロール別ダッシュボードへリダイレクト
- middleware で認証必須ルートを保護

**完了条件**: ATHLETE と COACH のユーザーを実際に作成してログインできる

### Step 2: アスリート - WeeklyReport CRUD
- `/athlete` ダッシュボード (今週レポート + 過去5件)
- 「今週のレポートを開始」で WeeklyReport 作成
- `/athlete/reports/[id]` 編集画面 (週次リフレクションのみ、セッションは Step 3)
- 自動保存 + 「提出」ボタン

**完了条件**: 週次リフレクションだけのレポートを作成・編集・提出できる

### Step 3: TrainingSession + SessionResult 入力UI
- 編集画面に「日付を追加」ボタン
- TrainingSession ブロックUI (メニュー記述 + Results行群)
- Results 行の追加・削除・編集
- Set / Segment / Distance / Time / DNF / Note の入力
- 自動保存

**完了条件**: Joachim メール(2/24-2/28)の内容をUIから入力してDBに保存できる

### Step 4: コーチ側閲覧 + DeepL翻訳
- DeepL API 連携 (バックエンド)
- TrainingSession 保存時に menuText → menuTextDe 自動生成
- WeeklyReport 提出時に reflection → reflectionDe 自動生成
- `/coach` ダッシュボード (担当アスリート一覧)
- `/coach/athletes/[id]/reports/[reportId]` 閲覧画面
- 原文 / ドイツ語訳の切替トグル

**完了条件**: コーチアカウントでログインして、アスリートが提出したレポートをドイツ語で閲覧できる

### Step 5: コメント機能
- コーチがコメント作成 (body 入力)
- コメント保存時に DeepL で日本語訳 (bodyJa)
- アスリートのレポート閲覧画面 (`/athlete/reports/[id]/view`) でコメント表示 (日本語)
- コーチが自分のコメントを編集・削除

**完了条件**: コーチが書いたドイツ語コメントが、アスリート側で日本語表示される

### Step 6: 集計・可視化 (Phase 1 完了)
- `/athlete/stats` (or `/coach/athletes/[id]/stats`)
- 距離別タイム推移グラフ (Recharts)
- 週次ボリューム (総走行距離) グラフ
- 期間フィルタ (過去4週 / 12週 / 全期間)

**完了条件**: 過去複数週のデータをグラフで可視化できる

## 動作確認ゲート (Step毎)

各 Step 完了時、Claude Code は以下を WORK_LOG.md に記載:

1. **実装したファイルのリスト**
2. **動作確認手順 (3〜5ステップ)**
3. **スクリーンショット** (UI変更があるStep)
4. **DB確認結果** (Prisma Studio スクショ or psql 結果)
5. **既知の制約・TODO**

Kakeru は WORK_LOG.md を読んで手動で動作確認 → 問題なければ次 Step を指示。

## 失敗回避ルール

1. ❌ `--dangerously-skip-permissions` を使わない
2. ❌ 複数 Step を一気に実行させない
3. ❌ 「ビルドが通る」を完了条件にしない
4. ❌ 仕様書にないことを実装させない (Claude Code が「ついでに」をしようとしたら止める)
5. ❌ DB接続が確実に動く前に他の実装に進まない
6. ✅ 各 Step の動作確認スクショを必ず取る
7. ✅ Step 完了報告を Kakeru が確認するまで次 Step は指示しない
8. ✅ 詰まったら Claude (このチャット) に相談 → 仕様書を更新してから Claude Code に戻る
