# WORK_LOG

## Step 1: 完全な Prisma schema + 認証

### ステータス: 実装完了 (Kakeru の動作確認待ち)

---

### 実装したファイルのリスト

| ファイル | 内容 |
|---|---|
| `prisma/schema.prisma` | 全モデル (User, WeeklyReport, TrainingSession, SessionResult, Comment, Role enum) |
| `prisma/migrations/20260607102437_full_schema/` | 全テーブルの migration SQL |
| `src/lib/supabase/client.ts` | ブラウザ用 Supabase クライアント |
| `src/lib/supabase/server.ts` | サーバー用 Supabase クライアント (cookies 対応) |
| `src/lib/auth.ts` | ログアウト Server Action |
| `src/proxy.ts` | 認証必須ルート保護 + ロール別クロスアクセス禁止 + ログイン済みユーザーのリダイレクト (Next.js 16 では Middleware を Proxy と呼ぶ) |
| `src/app/login/page.tsx` | ログインフォーム (useActionState) |
| `src/app/login/actions.ts` | ログイン Server Action |
| `src/app/signup/page.tsx` | 新規登録フォーム (ロール選択付き) |
| `src/app/signup/actions.ts` | 新規登録 Server Action (Supabase user_metadata に role を保存) |
| `src/app/athlete/page.tsx` | アスリートダッシュボード ("Welcome, name (ATHLETE)" + ログアウトボタン) |
| `src/app/coach/page.tsx` | コーチダッシュボード ("Welcome, name (COACH)" + ログアウトボタン) |

---

### Next.js 16 の重要な変更点

Next.js 16 では Middleware が **Proxy** にリネームされた。ファイルは `src/proxy.ts` (ルートまたは src 直下)。
`middleware.ts` は使わない。

---

### Kakeru に必要な作業 (テスト前)

**.env の `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定** (未設定の場合):
1. Supabase ダッシュボード → 対象プロジェクト → **Settings → API**
2. `anon` `public` の値をコピー
3. `.env` の `NEXT_PUBLIC_SUPABASE_ANON_KEY` を実際の値に設定

**Supabase で Email Confirmation を無効化** (未設定の場合):
- Supabase ダッシュボード → Authentication → Providers → Email
- 「Confirm email」を OFF にする

---

### 動作確認手順

1. `npm run dev` でサーバー起動
2. `http://localhost:3000/signup` を開く
3. アスリートアカウントを作成 (例: athlete@test.com / password123、ロール: アスリート)
4. `/athlete` ダッシュボードに自動リダイレクト → "Welcome, [name] (ATHLETE)" が表示されることを確認
5. 「ログアウト」ボタンを押して `/login` に戻ることを確認
6. コーチアカウントを作成 (例: coach@test.com / password123、ロール: コーチ)
7. `/coach` ダッシュボードに自動リダイレクト → "Welcome, [name] (COACH)" が表示されることを確認
8. ログアウト後 `/athlete` に直接アクセス → `/login` にリダイレクトされることを確認
9. コーチでログイン後 `/athlete` にアクセス → `/coach` にリダイレクトされることを確認
10. アスリートでログイン後 `/coach` にアクセス → `/athlete` にリダイレクトされることを確認

---

### 既知の制約・TODO

- ロール別クロスアクセスリダイレクト (手順9, 10) は Supabase user_metadata.role に依存。新規登録ユーザーは自動設定されるが、Step 0 で作成した既存ユーザーには role が入っていないため、ページ側のロールチェック (Prisma lookup) が代わりに動作する
- `/` (トップページ) はまだ Next.js デフォルト画面
- スクリーンショットは Kakeru が動作確認時に取得してください

---

---

## Step 2: アスリート - WeeklyReport CRUD

### ステータス: 実装完了 (Kakeru の動作確認待ち)

---

### 実装したファイルのリスト

| ファイル | 内容 |
|---|---|
| `src/lib/api-auth.ts` | API Route 共通ヘルパー (getApiUser, getWeekStart, HTTP レスポンス) |
| `src/app/api/reports/route.ts` | GET (一覧) + POST (今週レポート作成/upsert) |
| `src/app/api/reports/[id]/route.ts` | GET (詳細) + PATCH (reflection 更新) |
| `src/app/api/reports/[id]/submit/route.ts` | POST (提出 = submittedAt セット) |
| `src/app/athlete/page.tsx` | ダッシュボード (今週レポート + 過去5件) |
| `src/app/athlete/reports/[id]/page.tsx` | 編集ページ Server Component (auth + データ取得) |
| `src/app/athlete/reports/[id]/ReportEditor.tsx` | 編集ページ Client Component (auto-save + submit) |
| `src/components/ui/button.tsx` | shadcn/ui Button |
| `src/components/ui/textarea.tsx` | shadcn/ui Textarea |
| `src/components/ui/card.tsx` | shadcn/ui Card |
| `src/components/ui/badge.tsx` | shadcn/ui Badge |
| `src/lib/utils.ts` | shadcn/ui cn() ユーティリティ |

---

### 動作確認手順

1. `npm run dev` でサーバー起動
2. アスリートアカウントでログイン → `/athlete` ダッシュボードを開く
3. 「今週のレポートを開始」ボタンをクリック → `/athlete/reports/[id]` へ遷移することを確認
4. 週次リフレクション欄に文章を入力 → 1秒後に「保存中...」→「保存しました」と表示されることを確認
5. ページをリロードして入力内容が保持されていることを確認 (自動保存確認)
6. 「提出する」ボタン → 確認ダイアログ → OK → バッジが「提出済み」に変わることを確認
7. ダッシュボードに戻る → 今週のレポートに「提出済み」バッジが表示されることを確認
8. 別のアスリートアカウントのレポートID (推測) で `/athlete/reports/[他人のID]` にアクセス → 404 になることを確認

---

### DB確認方法 (Prisma Studio)

```bash
npx prisma studio
```
`WeeklyReport` テーブルに `athleteId`, `weekStart`, `reflection`, `submittedAt` が入ったレコードが見えることを確認。

---

### バグ修正 (Kakeru 動作確認後に発見)

**問題**: 「提出する」ボタンを押しても POST /api/reports/[id]/submit が発火しなかった

**原因**: `window.confirm` が呼ばれてもブラウザ環境で false を返すか、Base UI ボタンの click イベント伝播で確認ダイアログのコールバック以降が実行されなかった。加えてエラーハンドリングが一切なく、失敗時に何も表示されない問題もあった

**修正**: `window.confirm` を廃止し、インライン状態ベース確認 (`confirmingSubmit` フラグ) に置き換え。「提出する」→「本当に提出しますか? はい / いいえ」という2段階UIへ変更。また try/catch + `submitError` ステートでエラー表示を追加

**変更ファイル**: `src/app/athlete/reports/[id]/ReportEditor.tsx`

---

### 既知の制約・TODO

- TrainingSession 入力UI は Step 3 で追加
- DeepL 翻訳は Step 4 で追加 (reflectionDe は現在 null)
- スクリーンショットは Kakeru が動作確認時に取得してください

---

---

## Step 3a: TrainingSession 追加・編集・削除 (menuText のみ)

### ステータス: 実装完了 (Kakeru の動作確認待ち)

---

### 実装したファイルのリスト

| ファイル | 内容 |
|---|---|
| `src/app/api/reports/[id]/sessions/route.ts` | POST セッション追加 (認証・認可・日付範囲バリデーション) |
| `src/app/api/sessions/[id]/route.ts` | PATCH セッション更新 + DELETE セッション削除 |
| `src/app/api/reports/[id]/route.ts` | GET に `sessions` include 追加 |
| `src/app/athlete/reports/[id]/page.tsx` | sessions + weekStart を ReportEditor に渡すよう更新・閲覧モードリンク追加 |
| `src/app/athlete/reports/[id]/ReportEditor.tsx` | Training Sessions セクション追加 (追加・編集・削除・自動保存) |
| `src/app/athlete/reports/[id]/view/page.tsx` | 閲覧画面 (read-only) 新規作成 |

---

### 動作確認手順

1. アスリートアカウントでログイン → 既存レポート (or 新規作成) の編集画面を開く
2. 「+ 日付を追加」ボタンを押す → セッションカードが表示される (デフォルト日付: 週内の最初の未使用日)
3. menuText textarea に "2× (200m–200m–400m)\n4×15m einbeiniges Skipping" を貼り付ける → 1秒後に「保存しました」表示
4. ページをリロード → 入力内容が保持されていることを確認
5. 日付ピッカーで別の曜日に変更 → 1秒後に自動保存されることを確認
6. さらに「+ 日付を追加」を2回押してセッションを計3個にする
7. 1個のセッションの「削除」ボタンを押す → 確認ダイアログで OK → カードが消える
8. 右上「閲覧モード →」リンク → `/view` 画面でセッション内容が read-only 表示されることを確認
9. Prisma Studio (`npx prisma studio`) で TrainingSession テーブルにレコードが入っていることを確認
10. 別のアスリートアカウントでログインし、他人のセッション ID に対して PATCH/DELETE をリクエスト → 404 になることを確認

---

### DB確認方法 (Prisma Studio)

```bash
npx prisma studio
```
`TrainingSession` テーブルに `reportId`, `date`, `menuText` が入ったレコードが見えることを確認。

---

### 既知の制約・TODO

- SessionResult (タイム構造化データ) は Step 3b で実装
- menuTextDe (DeepL翻訳) は Step 4 で実装
- スクリーンショットは Kakeru が動作確認時に取得してください

---

---

## Step 3b: SessionResult 入力UI

### ステータス: 実装完了 (Kakeru の動作確認待ち)

---

### 実装したファイルのリスト

| ファイル | 内容 |
|---|---|
| `src/app/api/sessions/[id]/results/route.ts` | POST Result 1件追加 (認証・認可・@@unique 重複時 409) |
| `src/app/api/results/[id]/route.ts` | PATCH Result 更新 + DELETE Result 削除 |
| `src/app/api/reports/[id]/route.ts` | GET に `sessions.results` include 追加 (setIndex/segmentIndex 順) |
| `src/app/athlete/reports/[id]/page.tsx` | Prisma query に results include 追加 + ReportEditor に results を渡す |
| `src/app/athlete/reports/[id]/ReportEditor.tsx` | Results セクション追加 (Set グループ表示・追加/削除, Segment 追加/削除, 自動保存, DNF即時保存) |
| `src/app/athlete/reports/[id]/view/page.tsx` | Prisma query に results include 追加 + read-only テーブル表示 |

---

### 動作確認手順

1. アスリートアカウントでログイン → 既存レポートの編集画面を開く (セッションが1つ以上あること)
2. セッションカード下部の「+ Set を追加」ボタンを押す → Set 1 の行 (Seg 1) が表示される
3. 距離欄に `500`、タイム欄に `88.7`、Note に `mit Hürden` を入力 → 800ms 後に「保存しました」 (Network タブで PATCH /api/results/[id] を確認)
4. 「+ Segment を追加」を押す → 同じ Set 1 に Seg 2 が追加される
5. 「+ Set を追加」を押す → Set 2 が新規追加される
6. 任意の行の DNF チェックボックスをオン → タイム欄が disabled になり、即時 PATCH が飛ぶ
7. 任意の行のゴミ箱アイコンを押す → 行が消える
8. ページをリロード → 全データが復元される
9. Joachim 2/26 サンプルを全件入力 (下記) → ページリロードで復元確認
10. 閲覧画面 (`/athlete/reports/[id]/view`) で Results がテーブル形式で read-only 表示されることを確認
11. Prisma Studio で `SessionResult` テーブルを確認 → setIndex / segmentIndex / distanceM / timeSec / isDnf / note が正しく入っていることを確認
12. 別のアスリートアカウントで他人の result ID に PATCH → 404 になることを確認

---

### Joachim 2/26 テストデータ

日付: 2025-02-26 / menuText: `2× (500m/400m/300m/200m)`

| Set | Seg | Distance | Time | Note |
|-----|-----|----------|------|------|
| 1 | 1 | 500m | 88.7s | mit Hürden |
| 1 | 2 | 400m | 63.6s | mit Hürden |
| 1 | 3 | 300m | 51.0s | |
| 1 | 4 | 200m | (空欄) | Zeit verloren |
| 2 | 1 | 500m | 88.8s | |
| 2 | 2 | 400m | 73.2s | |
| 2 | 3 | 300m | 53.5s | |
| 2 | 4 | 200m | 29.4s | |

---

### 既知の制約・TODO

- Set 全体の削除ボタンは実装していない (仕様通り)
- インデックスの詰め直しは行わない (歯抜け許容、仕様通り)
- menuTextDe (DeepL翻訳) は Step 4 で実装
- スクリーンショットは Kakeru が動作確認時に取得してください

---

---

## Step 5: コメント機能

### ステータス: 実装完了 (Kakeru の動作確認待ち)

---

### 実装したファイルのリスト

| ファイル | 内容 |
|---|---|
| `src/app/api/reports/[id]/comments/route.ts` | GET (一覧) + POST (作成・DeepL日本語訳) |
| `src/app/api/comments/[id]/route.ts` | PATCH (編集・再翻訳) + DELETE (削除) |
| `src/app/coach/athletes/[athleteId]/reports/[reportId]/CommentSection.tsx` | コメント入力・編集・削除 Client Component |
| `src/app/coach/athletes/[athleteId]/reports/[reportId]/page.tsx` | comments include 追加 + CommentSection 組み込み |
| `src/app/athlete/reports/[id]/view/page.tsx` | comments include 追加 + コメント一覧表示 (bodyJa 優先) |

---

### 動作確認手順

1. コーチアカウントでログイン → アスリートのレポート閲覧画面を開く
2. 下部の「コメント」セクションにドイツ語/英語でコメントを入力 → 「コメントを送信」
3. ターミナルで `[deepl] 翻訳完了` ログが出ることを確認
4. コメントが一覧に追加され、`[JA] ...` の日本語訳が表示されることを確認
5. 「編集」ボタンを押してコメントを修正 → 保存 → 日本語訳が更新されることを確認
6. 「削除」ボタンを押して確認ダイアログ → OK → コメントが消えることを確認
7. アスリートアカウントでログイン → 同じレポートの閲覧画面 (`/athlete/reports/[id]/view`) を開く
8. 「コーチからのコメント」セクションに日本語訳 (bodyJa) が表示されることを確認
9. Prisma Studio で `Comment` テーブルに `body` / `bodyJa` が入っていることを確認

---

### 認可ルール

| 操作 | アスリート | コーチ |
|---|---|---|
| コメント一覧取得 | ✅ 自分のレポートのみ | ✅ 担当アスリートのレポートのみ |
| コメント作成 | ❌ | ✅ 担当アスリートのレポートのみ |
| コメント編集/削除 | ❌ | ✅ 自分のコメントのみ |

---

### 既知の制約・TODO

- アスリート側の view 画面では `bodyJa` が null の場合に原文 (body) をグレーで表示する
- コーチ側では原文と `[JA]` 訳の両方を表示 (確認用)
- スクリーンショットは Kakeru が動作確認時に取得してください

---

## Step 4: コーチ側閲覧 + DeepL翻訳

### ステータス: 実装完了 (Kakeru の動作確認待ち)

---

### 実装したファイルのリスト

| ファイル | 内容 |
|---|---|
| `src/lib/deepl.ts` | DeepL API 翻訳ユーティリティ (失敗時 null 返却) |
| `src/app/api/reports/[id]/sessions/route.ts` | POST 時に menuText → menuTextDe 自動翻訳追加 |
| `src/app/api/sessions/[id]/route.ts` | PATCH 時に menuText → menuTextDe 自動翻訳追加 |
| `src/app/api/reports/[id]/submit/route.ts` | POST 時に reflection → reflectionDe 自動翻訳追加 |
| `src/app/coach/page.tsx` | コーチダッシュボード (担当アスリート一覧 + 最新レポートリンク) |
| `src/app/coach/athletes/[athleteId]/reports/[reportId]/page.tsx` | コーチ用レポート閲覧 Server Component (認可チェック付き) |
| `src/app/coach/athletes/[athleteId]/reports/[reportId]/ReportViewer.tsx` | 原文/ドイツ語訳トグル付きレポート表示 Client Component |

---

### 動作確認手順

1. **前提: コーチとアスリートを紐付ける**
   - Prisma Studio (`npx prisma studio --port 5555`) を開く
   - `User` テーブルで ATHLETE のレコードを選択
   - `coachId` フィールドに COACH ユーザーの `id` を入力して保存

2. **翻訳確認 (新規セッション)**
   - アスリートアカウントでログイン → レポート編集画面を開く
   - 「+ 日付を追加」でセッションを追加し menuText に日本語またはドイツ語を入力 → 1秒後に自動保存
   - Prisma Studio の `TrainingSession` テーブルで `menuTextDe` にドイツ語が入っていることを確認

3. **翻訳確認 (提出)**
   - レポートのリフレクション欄に文章を入力 → 「提出する」→「はい」
   - Prisma Studio の `WeeklyReport` テーブルで `reflectionDe` にドイツ語が入っていることを確認

4. **コーチダッシュボード確認**
   - コーチアカウントでログイン → `/coach` を開く
   - 担当アスリートの名前と最新レポートが表示されることを確認
   - 「レポートを見る →」リンクをクリック

5. **コーチ用レポート閲覧確認**
   - デフォルトで「Deutsch」ボタンが選択状態になっている
   - `menuTextDe` / `reflectionDe` がドイツ語で表示されることを確認
   - 「原文」ボタンを押すと元のテキストに切り替わることを確認
   - 担当外アスリートのレポートURLに直接アクセス → 404 になることを確認

---

### 既知の制約・TODO

- 既存セッション (Step 3 以前に作成したもの) は `menuTextDe` が null のまま → 閲覧画面に「(翻訳未生成)」と表示される。手動で menuText を再保存すると翻訳される
- コーチが `coachId` を持っていない場合、ダッシュボードに「担当アスリートがまだいません」と表示される → Prisma Studio で手動設定が必要 (Step 5 以降で UI 追加予定)
- スクリーンショットは Kakeru が動作確認時に取得してください

---

---

## Step 6: 集計・可視化 ✅ 完了

### ステータス: 動作確認済み・完了

---

### 実装したファイルのリスト

| ファイル | 内容 |
|---|---|
| `src/app/athlete/stats/page.tsx` | アスリート統計ページ Server Component (認証・データ取得・期間フィルタ) |
| `src/app/coach/athletes/[athleteId]/stats/page.tsx` | コーチ側統計ページ Server Component (担当アスリート確認付き) |
| `src/components/StatsCharts.tsx` | Recharts グラフ Client Component (距離別タイム推移 + 週次ボリューム、両ロールで共有) |
| `src/app/athlete/page.tsx` | ダッシュボードに「統計・グラフを見る →」リンク追加 |
| `src/app/coach/page.tsx` | ダッシュボードの各アスリート行に「統計 →」リンク追加 |
| `src/app/coach/athletes/[athleteId]/reports/[reportId]/page.tsx` | レポートページヘッダーに「統計を見る →」リンク追加 |

---

### 実装内容

- **`/athlete/stats`** ページを新規作成
- **期間フィルタ**: 過去4週 / 過去12週 / 全期間 (URL `?period=4w|12w|all`)
- **距離別ベストタイム推移グラフ** (Recharts LineChart)
  - X軸: 週開始日 (月/日)
  - Y軸: タイム秒 (mm:ss 形式でフォーマット)
  - 距離ごとに別の色のライン
  - DNF・タイム未記録は除外し、各週の各距離ベストタイムをプロット
- **週次走行距離グラフ** (Recharts BarChart)
  - X軸: 週開始日
  - Y軸: 合計距離 (m)
  - DNF含む全結果の distanceM を週ごとに合計
- データが0件の場合は「データがありません」メッセージを表示

---

### 動作確認手順

**前提: SessionResult にタイム付きデータが複数週分入っていること**

1. アスリートアカウントでログイン → `/athlete` ダッシュボードを開く
2. 「統計・グラフを見る →」ボタンをクリック → `/athlete/stats` へ遷移することを確認
3. デフォルト「過去4週」フィルタが選択状態であることを確認
4. 距離別ベストタイム推移グラフに距離ごとの折れ線が表示されることを確認
5. 週次走行距離グラフに棒グラフが表示されることを確認
6. 「過去12週」「全期間」ボタンをクリックして表示が切り替わることを確認
7. グラフの各データポイントにホバーしてツールチップが表示されることを確認
8. 「← ダッシュボード」リンクで `/athlete` に戻れることを確認
9. データがない期間を選択した場合「データがありません」メッセージが表示されることを確認

---

### 既知の制約・TODO

- 期間フィルタはページ全体の再レンダリング (URL ベース) のためチャート切替に若干の遅延あり
- スクリーンショットは Kakeru が動作確認時に取得してください

---

## Step 0: プロジェクト初期化 + DB接続確認 ✅ 完了

- next@16.2.7, prisma@7.8.0, @prisma/adapter-pg, pg インストール済み
- User テーブルの migration + Prisma Studio 確認済み
- Session Pooler (5432) を DATABASE_URL として使用 (Transaction Pooler 6543 は Prisma CLI でハング)

---

---

## UI リデザイン (全画面)

### ステータス: 実装完了 (Kakeru の動作確認待ち)

---

### 実装したファイルのリスト

| ファイル | 内容 |
|---|---|
| `src/components/AppNav.tsx` | **新規** 共通ナビゲーションヘッダー (CoachSync ロゴ + ロールバッジ + ユーザー名 + ログアウト) |
| `src/app/globals.css` | カラーパレット更新 (primary をブルー系に変更、accent・ring・background 調整) |
| `src/app/layout.tsx` | メタデータ更新: タイトル「CoachSync」、日本語 description |
| `src/app/athlete/page.tsx` | AppNav 組み込み、StatusBadge (インライン) に切替、`bg-zinc-50` レイアウト |
| `src/app/coach/page.tsx` | AppNav 組み込み、StatusBadge、アスリートのイニシャルアバター追加 |
| `src/app/athlete/reports/[id]/ReportEditor.tsx` | SectionHeader コンポーネント追加、StatusBadge (インライン)、inputCls 定数、shadcn Badge/Card 削除 |
| `src/app/athlete/reports/[id]/page.tsx` | AppNav 組み込み、レイアウト・スタイル更新 |
| `src/app/athlete/reports/[id]/view/page.tsx` | AppNav 組み込み、サブヘッダーバー追加、全体ビジュアルリデザイン |
| `src/app/athlete/stats/page.tsx` | AppNav 組み込み、スタイル統一 |
| `src/app/coach/athletes/[athleteId]/reports/[reportId]/ReportViewer.tsx` | 言語トグルをピル型 UI に変更、セッション日付を de-DE 曜日表示にフォーマット |
| `src/app/coach/athletes/[athleteId]/reports/[reportId]/CommentSection.tsx` | スタイル更新 |
| `src/app/coach/athletes/[athleteId]/reports/[reportId]/page.tsx` | AppNav 組み込み、StatusBadge、サブヘッダーバー追加 |
| `src/app/coach/athletes/[athleteId]/stats/page.tsx` | AppNav 組み込み、スタイル統一 |

---

### 変更内容のサマリー

**1. 共通ナビゲーション (`AppNav`)**
- 全ページに sticky ヘッダーを追加
- 左: CoachSync ロゴ + ロールバッジ (Athlete / Coach)
- 右: ユーザー名 + ログアウトボタン
- 旧来の各ページ内ヘッダー + ログアウトフォームを削除

**2. カラーパレット**
- `--primary`: 無彩色 → ブルー (`oklch(0.55 0.20 255)`)
- `--accent`: ブルー系薄色に変更
- `--ring`: ブルー系に変更
- `--background`: わずかにグレー (`oklch(0.985 0 0)`)

**3. StatusBadge**
- shadcn `<Badge>` を廃止
- 提出済み: エメラルド (`bg-emerald-50 text-emerald-700`)
- 下書き: アンバー (`bg-amber-50 text-amber-700`)
- インライン `<span>` で各ファイルに定義

**4. コーチ用レポート閲覧 - 言語トグル**
- ボタン並列 → ピル型セグメントコントロール (`border` + `p-0.5` ラッパー) に変更

**5. メタデータ**
- ブラウザタブタイトルが「Create Next App」から「CoachSync」に変更

---

### 動作確認手順

1. `npm run dev` でサーバー起動
2. アスリートアカウントでログイン → 全ページ上部に「CoachSync / Athlete」ヘッダーが表示されることを確認
3. コーチアカウントでログイン → 全ページ上部に「CoachSync / Coach」ヘッダーが表示されることを確認
4. アスリートダッシュボード (`/athlete`) でレポートのバッジが「提出済み」(緑) / 「下書き」(黄) で表示されることを確認
5. コーチのレポート閲覧画面で言語トグルがピル型 UI で表示され、原文 / Deutsch の切替が動作することを確認
6. ブラウザタブのタイトルが「CoachSync」になっていることを確認
7. ログアウトボタンがヘッダー右上に表示され、クリックで `/login` に戻ることを確認

---

### 既知の制約・TODO

- StatusBadge が各ファイルに重複定義されている (今後 `src/components/StatusBadge.tsx` に共通化可能だが現時点ではスコープ外)
- スクリーンショットは Kakeru が動作確認時に取得してください

---

---

## 多言語対応 UI (ja / en / de)

### ステータス: 実装完了 (Kakeru の動作確認待ち)

---

### 実装したファイルのリスト

| ファイル | 内容 |
|---|---|
| `src/lib/translations.ts` | **新規** UI文字列の翻訳定義 (ja / en / de、全ページ分) |
| `src/lib/get-lang.ts` | **新規** サーバー側でクッキー `cs_lang` を読み取る共通ヘルパー |
| `src/components/LangSwitcher.tsx` | **新規** 言語切替ボタン Client Component (クッキー書込み + `router.refresh()`) |
| `src/components/AppNav.tsx` | `LangSwitcher` 組み込み + ログアウト文言を翻訳対応 (async Server Component に変更) |
| `src/app/athlete/page.tsx` | `getLang()` + `t[lang]` で全UI文字列を翻訳対応 |
| `src/app/athlete/reports/[id]/page.tsx` | `getLang()` + `lang` を `ReportEditor` に渡す |
| `src/app/athlete/reports/[id]/ReportEditor.tsx` | `lang` prop 追加、全UI文字列を翻訳対応 |
| `src/app/athlete/reports/[id]/view/page.tsx` | `getLang()` + `t[lang]` で全UI文字列を翻訳対応 |
| `src/app/athlete/stats/page.tsx` | `getLang()` + 期間ラベルを翻訳対応 |
| `src/app/coach/page.tsx` | `getLang()` + `t[lang]` で全UI文字列を翻訳対応 |
| `src/app/coach/athletes/[athleteId]/reports/[reportId]/page.tsx` | `getLang()` + `lang` を `ReportViewer`・`CommentSection` に渡す |
| `src/app/coach/athletes/[athleteId]/reports/[reportId]/ReportViewer.tsx` | `lang` prop 追加、全UI文字列を翻訳対応 |
| `src/app/coach/athletes/[athleteId]/reports/[reportId]/CommentSection.tsx` | `lang` prop 追加、全UI文字列を翻訳対応 |
| `src/app/coach/athletes/[athleteId]/stats/page.tsx` | `getLang()` + 期間ラベルを翻訳対応 |

---

### 実装内容のサマリー

**アーキテクチャ: クッキーベース**
- `LangSwitcher` ボタンを押すと `cs_lang` クッキー (max-age 1年) をセットし `router.refresh()` を呼ぶ
- サーバーコンポーネントはリクエスト時に `getLang()` でクッキーを読んで言語を決定
- クライアントコンポーネント (`ReportEditor`, `ReportViewer`, `CommentSection`) は親サーバーコンポーネントから `lang` を prop で受け取る
- デフォルト言語は `ja` (クッキー未設定時)

**言語切替ボタン (AppNav に常時表示)**
- 3ボタン構成: `日本語` / `English` / `Deutsch`
- ランディングページと同じデザイン (ピル型セグメントコントロール)
- 選択中のボタンは白背景 + shadow でハイライト

**翻訳対象**
- ナビゲーション (ログアウト、← ダッシュボード 等)
- ステータスバッジ (提出済み / 下書き)
- ダッシュボード見出し・ボタン・空状態メッセージ
- レポートエディタ全体 (保存状態、確認ダイアログ、プレースホルダー 等)
- 統計ページ・期間フィルタラベル
- コーチ用コメントセクション全体

---

### `package.json` ビルドスクリプト修正

Vercel デプロイ時に Prisma Client 未生成でビルドが失敗する問題を合わせて修正:

```json
"build": "prisma generate && next build"
```

---

### 動作確認手順

1. `npm run dev` でサーバー起動
2. アスリートまたはコーチアカウントでログイン
3. ナビバー中央に「日本語 / English / Deutsch」ボタンが表示されることを確認
4. 「English」を押す → ページ内の全UI文字列 (ダッシュボード見出し、ボタン、バッジ 等) が英語に切り替わることを確認
5. 別ページへ遷移しても言語設定が維持されることを確認
6. 「Deutsch」を押す → ドイツ語に切り替わることを確認
7. ブラウザを再起動 (またはタブを閉じて再度開く) → 言語設定がクッキーにより保持されていることを確認
8. コーチ側レポート閲覧画面で `CommentSection` の「コメントを送信」ボタンが翻訳されることを確認

---

### 既知の制約・TODO

- ランディングページ (`/`) の言語切替は独立した `useState` のままで、アプリ内のクッキー設定とは連動していない
- スクリーンショットは Kakeru が動作確認時に取得してください

---

## 統計ページ (StatsCharts) の多言語対応

### ステータス: 実装完了 (Kakeru の動作確認待ち)

---

### 問題

`/athlete/stats` および `/coach/athletes/[athleteId]/stats` のグラフ部分 (`StatsCharts.tsx`) の文字列がすべて日本語ハードコードになっており、言語切替が機能していなかった。

---

### 実装したファイルのリスト

| ファイル | 内容 |
|---|---|
| `src/components/StatsCharts.tsx` | `lang` prop 追加、全文字列を翻訳対応 |
| `src/app/athlete/stats/page.tsx` | `<StatsCharts>` に `lang={lang}` を追加 |
| `src/app/coach/athletes/[athleteId]/stats/page.tsx` | `<StatsCharts>` に `lang={lang}` を追加 |
| `src/lib/translations.ts` | StatsCharts 用翻訳キーを追加 (8キー × 3言語) |

---

### 翻訳対応した文字列

| キー | 日本語 | English | Deutsch |
|---|---|---|---|
| timeTrendTitle | 距離別ベストタイム推移 | Best Time Trend by Distance | Bestzeit-Trend nach Distanz |
| timeTrendDesc | 週ごとの各距離ベストタイム… | Weekly best time per distance… | Wöchentliche Bestzeit pro Distanz… |
| noTimeTrend | この期間にタイム記録がありません | No time records in this period | Keine Zeitaufzeichnungen in diesem Zeitraum |
| weeklyVolumeTitle | 週次走行距離 | Weekly Running Volume | Wöchentliches Laufvolumen |
| weeklyVolumeDesc | 週ごとの合計走行距離… | Total distance per week… | Gesamtdistanz pro Woche… |
| noVolume | この期間に距離記録がありません | No distance records in this period | Keine Distanzaufzeichnungen in diesem Zeitraum |
| distanceLabel | 走行距離 | Distance | Distanz |
| weekLabel | 週: | Week: | Woche: |

---

### 動作確認手順

1. アスリートアカウントでログイン → `/athlete/stats` を開く
2. ナビバーで「English」を選択 → グラフタイトル・ツールチップ・空状態メッセージが英語に変わることを確認
3. 「Deutsch」を選択 → ドイツ語に変わることを確認
4. コーチアカウントで `/coach/athletes/[id]/stats` でも同様に確認

---

## ログイン・新規登録ページの多言語対応

### ステータス: 実装完了 (Kakeru の動作確認待ち)

---

### 実装したファイルのリスト

| ファイル | 内容 |
|---|---|
| `src/app/login/page.tsx` | Server Component に変更 (`getLang()` でクッキー読取り → `LoginForm` に `lang` を渡す) |
| `src/app/login/LoginForm.tsx` | **新規** ログインフォーム Client Component (`lang` prop + `LangSwitcher` 組み込み) |
| `src/app/signup/page.tsx` | Server Component に変更 (`getLang()` でクッキー読取り → `SignupForm` に `lang` を渡す) |
| `src/app/signup/SignupForm.tsx` | **新規** 新規登録フォーム Client Component (`lang` prop + `LangSwitcher` 組み込み) |
| `src/lib/translations.ts` | ログイン・新規登録用の翻訳キーを追加 (emailLabel, passwordLabel, loginButton 等) |

---

### 変更内容のサマリー

- ログイン・新規登録ページを「Server Component ページ (クッキー読取) + Client Component フォーム」に分離
- フォーム上部に `LangSwitcher` ボタンを配置 (日本語 / English / Deutsch)
- 全ラベル・ボタン・リンクテキストを翻訳対応
- UI スタイルをアプリ全体 (zinc パレット・rounded-xl) に統一
- `/login` と `/signup` は Dynamic ルートに変更 (クッキー読取のため)

---

### 動作確認手順

1. `npm run dev` でサーバー起動
2. `http://localhost:3000/login` を開く
3. 右上の言語切替ボタンが表示されることを確認
4. 「English」を押す → ラベル・ボタンが英語に切り替わることを確認
5. 「Deutsch」を押す → ドイツ語に切り替わることを確認
6. `/signup` を開く → 同様に言語切替が動作することを確認
7. `/login` で言語を切り替えた後 `/signup` に遷移 → 言語設定が引き継がれることを確認

---

### 既知の制約・TODO

- スクリーンショットは Kakeru が動作確認時に取得してください

---

## Prisma Studio メモ

Prisma Studio はデフォルトで起動のたびにポートをランダムに選ぶため、前回と異なるポートになることがある。

**固定ポートで起動する方法:**

```bash
npx prisma studio --port 5555
```

常に `http://localhost:5555` で開けるようになる。
