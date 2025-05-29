# 超シンプルタスク管理アプリ - デプロイ手順

## プロジェクト概要

ADHDユーザーに最適化した、集中を妨げない超シンプルなタスク管理アプリです。

### 主な機能
- ✅ Enterキーで瞬時タスク追加
- ✅ ワンクリックで完了切り替え
- ✅ Notionスタイルのカテゴリ管理
- ✅ 認証不要で即利用開始
- ✅ レスポンシブデザイン

### 技術スタック
- React 18
- Supabase (データベース)
- Netlify (ホスティング)

## デプロイ手順

### 1. ビルドテスト
```powershell
cd C:\Users\mexer\PR\task-manager-app
npm run build
```

### 2. Gitコミット & プッシュ
```powershell
# 全ての変更を追加
git add .

# コミット
git commit -m "feat: 超シンプルタスク管理アプリ完成

✨ 新機能:
- Enterキーで瞬時タスク追加
- ワンクリック完了切り替え
- Notionスタイルカテゴリ管理
- 認証不要で即利用開始

🎨 UI改善:
- 集中を妨げないミニマルデザイン
- 期限・優先度削除でシンプル化
- レスポンシブ対応

🔧 技術改善:
- ESLintエラー修正
- RLSポリシー対応
- エラーハンドリング強化
- パフォーマンス最適化

ADHDユーザーに最適化した使いやすいタスク管理を実現"

# プッシュ
git push origin main
```

### 3. Netlifyでの設定
- Build command: `npm run build`
- Publish directory: `build`
- Node version: 18

## Supabaseデータベース設定

プロジェクトURL: https://uxmqohylzxjwxpcfhvwb.supabase.co
復元完了後、以下のテーブルとポリシーが自動設定されます。

### テーブル構造

#### categories テーブル
- id (UUID, Primary Key)
- name (TEXT, NOT NULL)
- color (TEXT, DEFAULT '#3b82f6')
- created_at (TIMESTAMP)

#### tasks テーブル  
- id (UUID, Primary Key)
- title (TEXT, NOT NULL)
- description (TEXT, NULLABLE)
- status (BOOLEAN, DEFAULT false)
- category_id (UUID, FOREIGN KEY)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### RLS ポリシー
パブリックアクセス許可（認証不要）:
- SELECT, INSERT, UPDATE, DELETE すべて許可

## 環境変数

```env
REACT_APP_SUPABASE_URL=https://uxmqohylzxjwxpcfhvwb.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bXFvaHlsenhqd3hwY2ZodndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NTk4NzYsImV4cCI6MjA2MDAzNTg3Nn0.5gz3aJFViPwsB55c3A4sfDUD1nRZJmF7zoozD4ehw6w
```

## アプリの使い方

1. **タスク追加**: 入力欄に入力してEnterキー
2. **完了切り替え**: ○ボタンをクリック
3. **カテゴリ管理**: 「カテゴリを管理」ボタンから追加・編集
4. **タスク編集**: タスクタイトルをクリックして直接編集

## 特徴

### ADHDフレンドリー設計
- 最小限の操作で最大の効果
- 視覚的に分かりやすいUI
- 集中を妨げない情報量
- 即座のフィードバック

### シンプルな機能
- タスクは完了/未完了のみ
- 期限・優先度なしで迷わない
- カテゴリは任意で整理
- 認証不要で即利用開始