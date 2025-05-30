# 超シンプル版 - GitHubプッシュのみ

Write-Host "🚀 タスク管理アプリをGitHubにプッシュします" -ForegroundColor Green

# プロジェクトディレクトリに移動
Set-Location "C:\Users\mexer\PR\task-manager-app"

# 変更を確認
Write-Host "📋 変更ファイル:" -ForegroundColor Yellow
git status

# 全ての変更を追加
git add .

# コミット
git commit -m "feat: ADHDフレンドリー超シンプルタスク管理アプリ完成

✨ 主な機能:
- Enterキーで瞬時タスク追加
- ワンクリック完了切り替え
- Notionスタイルカテゴリ管理
- 認証不要で即利用開始

🎨 ADHDフレンドリー設計:
- 集中を妨げないミニマルUI
- 期限・優先度なしでシンプル
- レスポンシブ対応

🔧 技術仕様:
- React 18
- Supabase (認証なしパブリックアクセス)
- Netlify自動デプロイ対応"

# GitHubにプッシュ
git push origin main

Write-Host ""
Write-Host "✅ GitHubプッシュ完了！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 次に起こること:" -ForegroundColor Cyan
Write-Host "1. Netlifyが自動でコードを検知" -ForegroundColor White
Write-Host "2. Netlifyが自動で 'npm run build' を実行" -ForegroundColor White  
Write-Host "3. ビルド完了後、自動でWebサイト公開" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Netlifyでビルド状況を確認してください" -ForegroundColor Yellow