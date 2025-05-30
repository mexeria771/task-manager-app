# ADHDフレンドリー タスク管理アプリ v2.0 - デプロイスクリプト

Write-Host "🚀 ADHDフレンドリー タスク管理アプリ v2.0 をGitHubにプッシュします" -ForegroundColor Green

# プロジェクトディレクトリに移動
Set-Location "C:\Users\mexer\PR\task-manager-app"

# 変更を確認
Write-Host "📋 変更ファイル:" -ForegroundColor Yellow
git status

# 全ての変更を追加
git add .

# コミット
git commit -m "feat: ADHDフレンドリー タスク管理アプリ v2.0 完成 🎯

🎯 新機能:
- 実行中タスク機能: フォーカスして集中力向上
- サブタスク機能: 大きなタスクを細分化
- ドラッグ&ドロップ: タスクの順序変更
- アクションボタン幅修正: 編集・削除の文字切れ解消

🎨 UI/UX改善:
- 実行中タスクの視覚的ハイライト
- サブタスクの進捗表示
- ドラッグハンドルとヒント表示
- 統計カードに実行中タスク数追加
- 実行中タブの追加

🧠 ADHD最適化:
- 1つのタスクに集中できる実行中機能
- サブタスクで大きなタスクを管理しやすく
- ドラッグで直感的な順序変更
- 視覚的フィードバックで達成感向上

🔧 技術改善:
- Supabaseにsubtasksテーブル追加
- is_executing, custom_orderカラム追加
- ドラッグ&ドロップAPIの実装
- レスポンシブ対応維持

📱 デバイス対応:
- スマホ・タブレットでも快適操作
- タッチ操作最適化
- アクセシビリティ向上

ADHDユーザーが本当に集中できるタスク管理アプリを実現！"

# GitHubにプッシュ
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 プッシュ完了！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 新機能の使い方:" -ForegroundColor Cyan
    Write-Host "🎯 実行中機能: 再生ボタン(▶)をクリックしてタスクを実行中に" -ForegroundColor White
    Write-Host "📝 サブタスク: 「▶ サブタスク」をクリックして展開・追加" -ForegroundColor White
    Write-Host "🔄 順序変更: タスクをドラッグして順序を入れ替え" -ForegroundColor White
    Write-Host "✏️ 編集・削除: 右側のボタンが見切れずに表示" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 ADHDユーザーへのメリット:" -ForegroundColor Cyan
    Write-Host "- 1つのタスクに集中できる実行中機能" -ForegroundColor White
    Write-Host "- 大きなタスクをサブタスクで管理" -ForegroundColor White
    Write-Host "- 直感的なドラッグ&ドロップ操作" -ForegroundColor White
    Write-Host "- 視覚的フィードバックで達成感アップ" -ForegroundColor White
    Write-Host ""
    Write-Host "🗄️ データベース設定完了:" -ForegroundColor Cyan
    Write-Host "- subtasksテーブル追加済み" -ForegroundColor White
    Write-Host "- 実行中・順序管理機能追加済み" -ForegroundColor White
    Write-Host "- サンプルデータ設定済み" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Netlifyで自動ビルド開始！" -ForegroundColor Yellow
} else {
    Write-Host "❌ プッシュに失敗しました。ネットワーク接続を確認してください。" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ ADHDフレンドリー タスク管理アプリ v2.0 完成！" -ForegroundColor Green
Write-Host "🎯 集中力向上のためのすべての機能が実装されました！" -ForegroundColor Green