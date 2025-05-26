# ADHD タスクマネージャー - GitHub デプロイスクリプト
# PowerShell実行ポリシーの設定が必要な場合：Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Write-Host "🚀 ADHD タスクマネージャー GitHub デプロイ開始..." -ForegroundColor Green

# 1. ディレクトリに移動
Write-Host "📁 プロジェクトディレクトリに移動中..." -ForegroundColor Yellow
Set-Location "C:\Users\mexer\PR\task-manager-app"

# 2. package.jsonを作成（依存関係管理用）
Write-Host "📦 package.jsonを作成中..." -ForegroundColor Yellow
$packageJson = @"
{
  "name": "adhd-task-manager",
  "version": "1.0.0",
  "description": "ADHD傾向のある方向けの直感的なタスク管理アプリ",
  "main": "index.html",
  "scripts": {
    "start": "python -m http.server 8000",
    "serve": "npx http-server . -p 8000 -o",
    "build": "echo 'Static site - no build step required'",
    "deploy": "gh-pages -d ."
  },
  "keywords": [
    "task-manager",
    "adhd",
    "productivity",
    "javascript",
    "supabase"
  ],
  "author": "ADHD Task Manager Team",
  "license": "MIT",
  "homepage": "https://github.com/yourusername/adhd-task-manager#readme",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/adhd-task-manager.git"
  },
  "devDependencies": {
    "http-server": "^14.1.1",
    "gh-pages": "^6.1.1"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
"@

$packageJson | Out-File -FilePath "package.json" -Encoding utf8

# 3. .gitignoreファイルを作成
Write-Host "🚫 .gitignoreファイルを作成中..." -ForegroundColor Yellow
$gitignore = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs
*.log

# Build outputs
dist/
build/

# Temporary files
tmp/
temp/
"@

$gitignore | Out-File -FilePath ".gitignore" -Encoding utf8

# 4. GitHub Pages用の設定ファイルを作成
Write-Host "⚙️ GitHub Pages設定ファイルを作成中..." -ForegroundColor Yellow
$nojekyll = ""
$nojekyll | Out-File -FilePath ".nojekyll" -Encoding utf8

# 5. Gitリポジトリの初期化（既存の場合はスキップ）
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Gitリポジトリを初期化中..." -ForegroundColor Yellow
    git init
    git branch -M main
} else {
    Write-Host "✅ 既存のGitリポジトリを使用" -ForegroundColor Green
}

# 6. npmの依存関係をインストール（オプション）
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "📦 npm依存関係をインストール中..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "⚠️ npmが見つかりません。Node.jsをインストールすることを推奨します。" -ForegroundColor Red
}

# 7. リモートリポジトリのURL設定（要変更）
Write-Host "🔗 リモートリポジトリを設定中..." -ForegroundColor Yellow
Write-Host "⚠️ 以下のURLを実際のGitHubリポジトリURLに変更してください！" -ForegroundColor Red
# git remote add origin https://github.com/yourusername/adhd-task-manager.git
# 既存のリモートがある場合は更新
# git remote set-url origin https://github.com/yourusername/adhd-task-manager.git

# 8. ファイルをステージングに追加
Write-Host "📝 変更をステージングに追加中..." -ForegroundColor Yellow
git add .

# 9. コミット
Write-Host "💾 変更をコミット中..." -ForegroundColor Yellow
$commitMessage = "Initial commit: ADHD Task Manager v1.0.0

- Complete task management system with ADHD-friendly features
- Today view, Interruption tasks, Focus mode, DB view
- Markdown import/export functionality
- Responsive design with drag & drop support
- Supabase backend integration
- Keyboard shortcuts and accessibility features
"

git commit -m $commitMessage

# 10. プッシュ（コメントアウト - 手動で実行）
Write-Host "🚀 GitHub にプッシュ準備完了!" -ForegroundColor Green
Write-Host "次のコマンドを実行してプッシュしてください：" -ForegroundColor Cyan
Write-Host "git remote add origin https://github.com/yourusername/adhd-task-manager.git" -ForegroundColor White
Write-Host "git push -u origin main" -ForegroundColor White

# 11. GitHub Pages設定の案内
Write-Host "`n📄 GitHub Pages設定手順:" -ForegroundColor Magenta
Write-Host "1. GitHubリポジトリページに移動" -ForegroundColor White
Write-Host "2. Settings > Pages に移動" -ForegroundColor White
Write-Host "3. Source を 'Deploy from a branch' に設定" -ForegroundColor White
Write-Host "4. Branch を 'main' / (root) に設定" -ForegroundColor White
Write-Host "5. Save をクリック" -ForegroundColor White

Write-Host "`n✅ デプロイ準備完了!" -ForegroundColor Green
Write-Host "🌐 デプロイ後のURL: https://yourusername.github.io/adhd-task-manager/" -ForegroundColor Cyan

# 12. ローカル開発サーバー起動オプション
Write-Host "`n🔧 ローカル開発サーバーを起動しますか? (y/n)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "y" -or $response -eq "Y") {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Write-Host "🌐 ローカルサーバーを起動中... (http://localhost:8000)" -ForegroundColor Green
        npm run serve
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Host "🌐 Pythonサーバーを起動中... (http://localhost:8000)" -ForegroundColor Green
        python -m http.server 8000
    } else {
        Write-Host "❌ npm または Python が必要です。index.html を直接ブラウザで開いてください。" -ForegroundColor Red
    }
}

Write-Host "`n🎉 スクリプト完了!" -ForegroundColor Green
