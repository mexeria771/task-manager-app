# ADHD タスクマネージャー - 簡単GitHubアップロード

Write-Host "🚀 GitHubアップロード開始..." -ForegroundColor Green

# ディレクトリに移動
cd "C:\Users\mexer\PR\task-manager-app"

# .gitignore作成
@"
node_modules/
.env
.DS_Store
Thumbs.db
*.log
"@ | Out-File -FilePath ".gitignore" -Encoding utf8

# Git初期化（なければ）
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

# ファイル追加・コミット
git add .
git commit -m "ADHD Task Manager v1.0.0 - Complete application"

Write-Host "✅ 準備完了! 以下を実行してプッシュ:" -ForegroundColor Cyan
Write-Host "git remote add origin https://github.com/yourusername/adhd-task-manager.git" -ForegroundColor Yellow
Write-Host "git push -u origin main" -ForegroundColor Yellow

Write-Host "`n🌐 Netlifyデプロイ後のテスト項目:" -ForegroundColor Magenta
Write-Host "- タスク作成・編集・削除" -ForegroundColor White
Write-Host "- Today/割り込みタスク機能" -ForegroundColor White  
Write-Host "- フォーカスモード" -ForegroundColor White
Write-Host "- Supabase接続確認" -ForegroundColor White
