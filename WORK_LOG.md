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

## Step 0: プロジェクト初期化 + DB接続確認 ✅ 完了

- next@16.2.7, prisma@7.8.0, @prisma/adapter-pg, pg インストール済み
- User テーブルの migration + Prisma Studio 確認済み
- Session Pooler (5432) を DATABASE_URL として使用 (Transaction Pooler 6543 は Prisma CLI でハング)
