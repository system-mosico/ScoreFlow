# ScoreFlow

大会進行状況をリアルタイムで発信するWeb SaaS

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Firebase (Firestore / Authentication / Hosting)
- pdf.js (PDF → PNG変換)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase設定

1. Firebase Consoleでプロジェクトを作成
2. AuthenticationでGoogleログインを有効化
3. Firestore Databaseを作成
4. `.env.local.example`を`.env.local`にコピーし、Firebase設定値を入力

```bash
cp .env.local.example .env.local
```

### 3. Firestoreセキュリティルール

`firestore.rules`をFirebase ConsoleのFirestore > ルールにコピー＆ペースト

### 4. 開発サーバー起動

```bash
npm run dev
```

## 機能

### 運営者機能（ログイン必須）

- Googleログイン
- 大会作成（名前、PDFアップロード）
- PDFを1ページのみアップロード → PNG変換 → Base64化 → Firestore保存
- トーナメント表上でライン（勝者ライン）追加
- トーナメント表上でスコア追加
- 公開URLのコピー

### 観客機能（ログイン不要）

- 公開URL（`/p/[publicUrlId]`）でアクセス
- トーナメント表のリアルタイム表示
- スコア・ラインのリアルタイム更新

## データ構造

### tournaments/{tournamentId}

```typescript
{
  name: string
  createdBy: string (uid)
  createdAt: Timestamp
  expiresAt: Timestamp (2ヶ月後)
  publicUrlId: string
  pdfPageImage: string (Base64)
}
```

### tournaments/{tournamentId}/marks/{markId}

```typescript
// Line Mark
{
  type: "line"
  pageNumber: number
  x1: number (0-1)
  y1: number (0-1)
  x2: number (0-1)
  y2: number (0-1)
  color: string
  createdAt: Timestamp
}

// Score Mark
{
  type: "score"
  pageNumber: number
  x: number (0-1)
  y: number (0-1)
  value: string
  fontSize: number
  color: string
  createdAt: Timestamp
}
```

## デプロイ

### Firebase Hosting

1. Firebase CLIをインストール（未インストールの場合）
```bash
npm install -g firebase-tools
```

2. Firebaseにログイン
```bash
firebase login
```

3. Firebaseプロジェクトを初期化（初回のみ）
```bash
firebase init hosting
```

4. ビルドとデプロイ
```bash
npm run deploy:hosting
```

または個別に実行：
```bash
npm run build
firebase deploy --only hosting
```

### デプロイURL

- 本番環境: https://scoreflow-85a3e.web.app

## GitHubリポジトリ

- リポジトリURL: https://github.com/system-mosico/ScoreFlow.git
- ブランチ: main

## 注意事項

- v1プロトタイプではPDFは1ページのみ対応
- Firebase Storageは使用せず、Base64でFirestoreに保存
- 画像は圧縮（品質0.85）して保存
- データは2ヶ月後に自動削除（TTL機能）

## 既知の問題

### `/create`ページのエラー（未解決）

本番環境（https://scoreflow-85a3e.web.app/create）で以下のエラーが発生しています：

**エラー内容:**
```
Uncaught ChunkLoadError: Loading chunk 974 failed.
(missing: https://scoreflow-85a3e.web.app/_next/static/chunks/app/create/page-b0c8edde5a0c4a79.js)
```

または

```
l[e] is not a function
```

**発生状況:**
- `/create`ページに直接アクセスした際、新規作成画面（大会名の入力欄、PDFのアップロード欄など）が表示されず、ホームページと同じUIが表示される
- ブラウザのコンソールに上記のエラーが表示される
- webpackのチャンクローダーがチャンクID `323`（または`974`）を読み込もうとしているが、webpackのチャンクマッピングに正しく登録されていない

**影響範囲:**
- 本番環境のみ（ローカル環境では正常に動作）
- `/create`ページへの直接アクセス
- ホームページから「新規作成」ボタンで遷移した場合も同様のエラーが発生する可能性

**試行した対応:**
- `scripts/prepare-deploy.js`でwebpackのチャンクマッピングを手動で追加
- `/create/index.html`の生成とルーティングデータの修正
- Firebase Hostingのリライトルールの調整

**現状:**
- エラーは継続して発生している
- 根本的な解決には至っていない

