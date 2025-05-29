# Supabaseデータベース設定ガイド

## 必要なテーブル作成とRLSポリシー設定

Supabaseのコンソール > SQL Editor で以下のSQLを実行してください：

```sql
-- 1. テーブル作成（既に存在する場合はスキップ）

-- カテゴリテーブル
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- タスクテーブル（簡素化）
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status BOOLEAN DEFAULT false,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS有効化
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. パブリックアクセスポリシー（認証なしでも使える）

-- カテゴリテーブルのポリシー
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete categories" ON public.categories FOR DELETE USING (true);

-- タスクテーブルのポリシー
CREATE POLICY "Anyone can view tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tasks" ON public.tasks FOR DELETE USING (true);

-- 4. 更新時刻の自動更新トリガー
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at 
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

## 完了したら

上記のSQLを実行後、以下のコマンドでデプロイしてください：

```powershell
cd C:\Users\mexer\PR\task-manager-app
npm run build
git add .
git commit -m "feat: シンプルなタスク管理アプリ完成

- 期限・優先度削除でシンプル化
- Notionスタイルのカテゴリ管理追加
- データベースRLSエラー対応
- 集中を妨げない最小限のUI
- 完了/未完了のみのシンプルな管理"

git push origin main
```

## 機能

✅ **超シンプルなタスク管理**
- タスクは「完了」「未完了」のみ
- 期限・優先度なしで集中を妨げない

✅ **Notionスタイルのカテゴリ管理**
- カテゴリの追加・編集・削除
- 10色から選択可能
- インライン編集

✅ **ADHDフレンドリー**
- Enterキーで瞬時追加
- クリックで完了切り替え
- 最小限の情報表示
- 認証不要で即利用開始

✅ **レスポンシブデザイン**
- スマホ・タブレット対応
- タッチ操作最適化