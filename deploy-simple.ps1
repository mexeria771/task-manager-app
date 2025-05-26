# ADHD タスクマネージャー - GitHub アップロード（Netlify用）

Write-Host "🚀 GitHubにアップロード開始..." -ForegroundColor Green

# プロジェクトディレクトリに移動
Set-Location "C:\Users\mexer\PR\task-manager-app"

# .gitignoreファイルを作成
@"
node_modules/
.env
.DS_Store
Thumbs.db
*.log
"@ | Out-File -FilePath ".gitignore" -Encoding utf8

# Gitリポジトリ初期化（まだの場合）
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

# ファイルをステージングに追加
git add .

# コミット
git commit -m "ADHD Task Manager v1.0.0 - Complete task management app with ADHD-friendly features"

Write-Host "✅ コミット完了!" -ForegroundColor Green
Write-Host "次のコマンドを実行してください：" -ForegroundColor Cyan
Write-Host "git remote add origin https://github.com/YOUR_USERNAME/adhd-task-manager.git" -ForegroundColor White
Write-Host "git push -u origin main" -ForegroundColor White
Write-Host "`n🌐 Netlifyでデプロイ: https://app.netlify.com/" -ForegroundColor Magenta

pause
