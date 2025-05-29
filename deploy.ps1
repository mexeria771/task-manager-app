# PowerShell script for deploying the task manager app

Write-Host "🚀 超シンプルタスク管理アプリ - デプロイ開始" -ForegroundColor Green
Write-Host ""

# 現在のディレクトリに移動
Set-Location "C:\Users\mexer\PR\task-manager-app"
Write-Host "📁 プロジェクトディレクトリに移動しました" -ForegroundColor Blue

# ビルドテスト
Write-Host ""
Write-Host "🔨 ビルドテストを実行中..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ビルド成功！" -ForegroundColor Green
} else {
    Write-Host "❌ ビルドに失敗しました。エラーを確認してください。" -ForegroundColor Red
    exit 1
}

# Git status確認
Write-Host ""
Write-Host "📋 変更ファイルを確認中..." -ForegroundColor Yellow
git status

# 全ての変更を追加
Write-Host ""
Write-Host "📦 変更をステージング中..." -ForegroundColor Yellow
git add .

# コミット
Write-Host ""
Write-Host "💾 コミットを作成中..." -ForegroundColor Yellow
git commit -m "feat: 超シンプルタスク管理アプリ完成 🎉

✨ 新機能:
- Enterキーで瞬時タスク追加
- ワンクリック完了切り替え  
- Notionスタイルカテゴリ管理
- 認証不要で即利用開始

🎨 UI改善:
- 集中を妨げないミニマルデザイン
- 期限・優先度削除でシンプル化
- レスポンシブ対応
- ADHDフレンドリー設計

🔧 技術改善:
- ESLintエラー修正完了
- RLS ポリシー対応
- エラーハンドリング強化
- Supabaseデータベース最適化
- パフォーマンス最適化

🗄️ データベース:
- Supabaseプロジェクト復元完了
- シンプルなテーブル構造に変更
- パブリックアクセス許可
- サンプルデータ追加

ADHDユーザーに最適化した、本当に使いやすいタスク管理アプリを実現！"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ コミット成功！" -ForegroundColor Green
} else {
    Write-Host "❌ コミットに失敗しました。" -ForegroundColor Red
    exit 1
}

# プッシュ
Write-Host ""
Write-Host "🌐 GitHubにプッシュ中..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 デプロイ完了！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 次のステップ:" -ForegroundColor Cyan
    Write-Host "1. Netlifyでビルドが自動開始されます" -ForegroundColor White
    Write-Host "2. アプリURLをチェックしてください" -ForegroundColor White
    Write-Host "3. タスクの追加・完了をテストしてください" -ForegroundColor White
    Write-Host ""
    Write-Host "🗄️ Supabase設定完了:" -ForegroundColor Cyan
    Write-Host "- プロジェクト: TaskManagerApp (復元済み)" -ForegroundColor White
    Write-Host "- URL: https://uxmqohylzxjwxpcfhvwb.supabase.co" -ForegroundColor White
    Write-Host "- 認証: 不要（パブリックアクセス）" -ForegroundColor White
    Write-Host "- サンプルデータ: 追加済み" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 アプリの特徴:" -ForegroundColor Cyan
    Write-Host "- Enterキーで瞬時タスク追加" -ForegroundColor White
    Write-Host "- ワンクリック完了切り替え" -ForegroundColor White
    Write-Host "- Notionスタイルカテゴリ管理" -ForegroundColor White
    Write-Host "- ADHDフレンドリー設計" -ForegroundColor White
    Write-Host "- レスポンシブ対応" -ForegroundColor White
} else {
    Write-Host "❌ プッシュに失敗しました。ネットワーク接続を確認してください。" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ すべて完了しました！素晴らしいタスク管理アプリをお楽しみください！" -ForegroundColor Green