# Cursor クラウド同期セットアップガイド

このプロジェクトをPCとスマホ版Cursorで同期して使用するための手順です。

## 前提条件

- Cursorアカウントを持っていること
- PC版Cursorとスマホ版Cursorの両方に同じアカウントでログインしていること

## セットアップ手順

### 1. PC版Cursorでの設定

1. **Cursorを開く**
   - プロジェクトフォルダ（`/Users/kajiurahisui/Desktop/ScoreFlow`）を開く

2. **アカウントでログイン**
   - Cursorの設定（`Cmd + ,` または `Ctrl + ,`）を開く
   - 「Account」セクションでCursorアカウントにログイン
   - ログインしていない場合は、アカウントを作成

3. **クラウド同期を有効化**
   - 設定画面で「Cloud Sync」または「Settings Sync」を検索
   - 「Enable Cloud Sync」を有効化
   - 以下の項目を同期対象に設定：
     - ✅ Workspace Settings（ワークスペース設定）
     - ✅ Chat History（チャット履歴）
     - ✅ Editor Settings（エディタ設定）

4. **ワークスペースを保存**
   - `Cmd + Shift + P`（Mac）または `Ctrl + Shift + P`（Windows）でコマンドパレットを開く
   - 「Cursor: Save Workspace to Cloud」を実行
   - または、設定ファイル（`.cursor/settings.json`）が自動的に認識される

### 2. スマホ版Cursorでの設定

1. **Cursorアプリを開く**
   - スマホにCursorアプリをインストール（未インストールの場合）

2. **同じアカウントでログイン**
   - PC版と同じCursorアカウントでログイン

3. **クラウド同期を有効化**
   - 設定画面で「Cloud Sync」を有効化

4. **ワークスペースを開く**
   - 「Open Workspace from Cloud」を選択
   - 「ScoreFlow」ワークスペースを選択
   - または、GitHubからクローン：
     ```bash
     git clone https://github.com/system-mosico/ScoreFlow.git
     ```

### 3. 同期される内容

以下の内容がクラウドに同期されます：

- ✅ **ソースコード**（GitHub経由）
- ✅ **ワークスペース設定**（`.cursor/settings.json`）
- ✅ **エディタ設定**（`.vscode/settings.json`）
- ✅ **チャット履歴**（Cursorアカウント経由）
- ✅ **開いているファイルの状態**

### 4. 注意事項

- **環境変数（`.env.local`）は同期されません**
  - セキュリティ上の理由で、`.env.local`は`.gitignore`に含まれています
  - スマホ版でも開発する場合は、手動で`.env.local`を作成する必要があります

- **`node_modules`は同期されません**
  - スマホ版でプロジェクトを開いたら、`npm install`を実行してください

- **ビルド成果物は同期されません**
  - `.next/`、`public/_next/`などは除外されています

## トラブルシューティング

### 同期が動作しない場合

1. **アカウントの確認**
   - PC版とスマホ版で同じアカウントにログインしているか確認

2. **クラウド同期の再有効化**
   - 設定画面で一度無効化してから再度有効化

3. **手動同期**
   - `Cmd + Shift + P` → 「Cursor: Sync Now」を実行

### チャット履歴が表示されない場合

- チャット履歴はCursorアカウントに紐づいて保存されます
- 同じアカウントでログインしていれば、自動的に同期されます
- スマホ版で「Chat History」パネルを開いて確認してください

## 参考リンク

- [Cursor公式ドキュメント](https://docs.cursor.com)
- [Cursor Cloud Sync](https://cursor.com/features/cloud-sync)
- [GitHubリポジトリ](https://github.com/system-mosico/ScoreFlow)

