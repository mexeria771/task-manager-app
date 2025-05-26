# ターミナルで直接実行するコマンド（PowerShell）

# === 以下のコマンドをターミナルにコピペして実行 ===

# 1. ディレクトリに移動
cd "C:\Users\mexer\PR\task-manager-app"

# 2. .gitignoreファイル作成
@"
node_modules/
.env
.DS_Store
Thumbs.db
*.log
"@ | Out-File -FilePath ".gitignore" -Encoding utf8

# 3. Git初期化（まだの場合）
if (-not (Test-Path ".git")) { git init; git branch -M main }

# 4. 全ファイルを追加してコミット
git add .
git commit -m "ADHD Task Manager v1.0.0 - Complete task management app"

# 5. リモート設定とプッシュ（YOUR_USERNAMEを変更）
Write-Host "次のコマンドを実行してください：" -ForegroundColor Cyan
Write-Host "git remote add origin https://github.com/YOUR_USERNAME/adhd-task-manager.git" -ForegroundColor White
Write-Host "git push -u origin main" -ForegroundColor White
