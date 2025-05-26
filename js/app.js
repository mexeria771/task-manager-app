// メインアプリケーション - 初期化とグローバル管理
class TaskManagerApp {
    constructor() {
        this.isInitialized = false;
        this.components = {};
        this.globalState = {
            currentUser: null,
            isOnline: navigator.onLine,
            lastSyncTime: null,
            notifications: []
        };
    }

    // アプリケーション初期化
    async initialize() {
        try {
            console.log('🚀 タスクマネージャー起動中...');
            
            // 環境チェック
            this.checkEnvironment();
            
            // ユーザー設定初期化
            this.initializeUserSettings();
            
            // コンポーネント初期化
            await this.initializeComponents();
            
            // イベントリスナー設定
            this.setupGlobalEventListeners();
            
            // データベース接続テスト
            await this.testDatabaseConnection();
            
            // メインタスクマネージャー初期化
            await taskManager.initialize();
            
            // 初期化完了
            this.isInitialized = true;
            this.showWelcomeMessage();
            
            console.log('✅ アプリケーション初期化完了');

        } catch (error) {
            console.error('❌ アプリケーション初期化失敗:', error);
            this.showErrorMessage('アプリケーションの初期化に失敗しました', error);
        }
    }

    // 環境チェック
    checkEnvironment() {
        const requirements = {
            localStorage: typeof Storage !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            es6: typeof Promise !== 'undefined',
            dom: typeof document !== 'undefined'
        };

        const failed = Object.entries(requirements)
            .filter(([key, supported]) => !supported)
            .map(([key]) => key);

        if (failed.length > 0) {
            throw new Error(`サポートされていない機能: ${failed.join(', ')}`);
        }

        console.log('✅ 環境チェック完了');
    }

    // ユーザー設定初期化
    initializeUserSettings() {
        const defaultSettings = {
            theme: 'light',
            language: 'ja',
            notifications: true,
            autoSave: true,
            pomodoroMinutes: 25,
            shortBreakMinutes: 5,
            longBreakMinutes: 15,
            focusMode: {
                hideOtherTasks: true,
                enableTimer: true,
                playSound: false
            },
            ui: {
                showCompletedTasks: true,
                taskAnimations: true,
                compactMode: false
            }
        };

        const userSettings = TaskHelpers.loadFromLocalStorage('taskManagerSettings', defaultSettings);
        
        // 設定をマージ（新しい設定項目を追加）
        this.globalState.settings = { ...defaultSettings, ...userSettings };
        
        // 設定を保存
        TaskHelpers.saveToLocalStorage('taskManagerSettings', this.globalState.settings);
        
        console.log('✅ ユーザー設定初期化完了');
    }

    // コンポーネント初期化
    async initializeComponents() {
        this.components = {
            todayView: TodayView,
            interruptionView: InterruptionView,
            dbView: DBView,
            focusMode: FocusMode,
            markdownExport: MarkdownExport
        };

        // 各コンポーネントが初期化済みであることを確認
        Object.entries(this.components).forEach(([name, component]) => {
            if (typeof component.initialize === 'function') {
                component.initialize();
            }
            console.log(`✅ ${name} 初期化完了`);
        });
    }

    // グローバルイベントリスナー設定
    setupGlobalEventListeners() {
        // オンライン/オフライン状態監視
        window.addEventListener('online', () => {
            this.globalState.isOnline = true;
            TaskHelpers.showNotification('オンラインに復帰しました', 'success');
            this.syncData();
        });

        window.addEventListener('offline', () => {
            this.globalState.isOnline = false;
            TaskHelpers.showNotification('オフラインモードです', 'warning');
        });

        // ページ離脱前の確認
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '未保存の変更があります。ページを離れますか？';
            }
        });

        // ページ可視性変更
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handlePageVisible();
            } else {
                this.handlePageHidden();
            }
        });

        // エラーハンドリング
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.handleGlobalError(e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.handleGlobalError(e.reason);
        });

        // キーボードショートカット（グローバル）
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });

        console.log('✅ グローバルイベントリスナー設定完了');
    }

    // データベース接続テスト
    async testDatabaseConnection() {
        try {
            await taskAPI.getTasks();
            console.log('✅ データベース接続確認完了');
        } catch (error) {
            console.error('❌ データベース接続失敗:', error);
            throw new Error('データベースに接続できません');
        }
    }

    // ウェルカムメッセージ表示
    showWelcomeMessage() {
        const isFirstTime = !TaskHelpers.loadFromLocalStorage('hasVisited', false);
        
        if (isFirstTime) {
            TaskHelpers.saveToLocalStorage('hasVisited', true);
            this.showFirstTimeWelcome();
        } else {
            this.showReturningUserWelcome();
        }
    }

    // 初回ユーザー向けウェルカム
    showFirstTimeWelcome() {
        setTimeout(() => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay active';
            modal.innerHTML = `
                <div class="modal" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3 class="modal-title">🎉 ADHD タスクマネージャーへようこそ！</h3>
                    </div>
                    <div class="modal-content">
                        <div style="text-align: center; margin-bottom: 25px;">
                            <div style="font-size: 4rem; margin-bottom: 15px;">📋</div>
                            <p style="font-size: 1.1rem; color: #2c3e50; line-height: 1.6;">
                                ADHD傾向のある方でも使いやすい、直感的なタスク管理アプリです。<br>
                                集中力を維持しながら効率的にタスクを管理できます。
                            </p>
                        </div>

                        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                            <h4 style="color: #2c3e50; margin-bottom: 15px;">🔧 主な機能</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                                <div>
                                    <strong>📅 Today</strong><br>
                                    <span style="color: #7f8c8d;">その日やるタスクを管理</span>
                                </div>
                                <div>
                                    <strong>⚡ 割り込みタスク</strong><br>
                                    <span style="color: #7f8c8d;">突発的なタスクを即座登録</span>
                                </div>
                                <div>
                                    <strong>🎯 フォーカスモード</strong><br>
                                    <span style="color: #7f8c8d;">集中力を維持する専用画面</span>
                                </div>
                                <div>
                                    <strong>📊 DBビュー</strong><br>
                                    <span style="color: #7f8c8d;">全タスクを効率的に管理</span>
                                </div>
                            </div>
                        </div>

                        <div style="background: #e3f2fd; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                            <h4 style="color: #1565c0; margin-bottom: 15px;">💡 使い方のコツ</h4>
                            <ul style="color: #1565c0; line-height: 1.6; margin: 0; padding-left: 20px;">
                                <li>まずは「新しいタスク」ボタンでタスクを作成してみましょう</li>
                                <li>重要なタスクは「Today」に追加して優先的に管理</li>
                                <li>集中したい時は「フォーカスモード」を活用</li>
                                <li>突発的なタスクは「割り込みタスク」に素早く記録</li>
                            </ul>
                        </div>

                        <div style="text-align: center;">
                            <button class="btn btn-primary btn-large" onclick="app.closeWelcomeModal()">
                                🚀 使い始める
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // 3秒後に自動で閉じるオプション
            setTimeout(() => {
                if (document.contains(modal)) {
                    const autoCloseBtn = document.createElement('button');
                    autoCloseBtn.className = 'btn btn-secondary btn-small';
                    autoCloseBtn.textContent = '3秒後に自動で閉じます...';
                    autoCloseBtn.style.marginLeft = '10px';
                    autoCloseBtn.disabled = true;
                    
                    modal.querySelector('.modal-content').appendChild(autoCloseBtn);
                    
                    let countdown = 3;
                    const interval = setInterval(() => {
                        countdown--;
                        autoCloseBtn.textContent = `${countdown}秒後に自動で閉じます...`;
                        
                        if (countdown <= 0) {
                            clearInterval(interval);
                            if (document.contains(modal)) {
                                this.closeWelcomeModal();
                            }
                        }
                    }, 1000);
                }
            }, 5000);

        }, 1000);
    }

    // リピートユーザー向けウェルカム
    showReturningUserWelcome() {
        const lastVisit = TaskHelpers.loadFromLocalStorage('lastVisit', null);
        const now = new Date();
        
        if (lastVisit) {
            const daysSinceLastVisit = Math.floor((now - new Date(lastVisit)) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastVisit >= 7) {
                TaskHelpers.showNotification(`お帰りなさい！${daysSinceLastVisit}日ぶりのご利用ですね`, 'info', 5000);
            } else if (daysSinceLastVisit >= 1) {
                TaskHelpers.showNotification(`お帰りなさい！昨日ぶりですね`, 'info', 3000);
            }
        }
        
        TaskHelpers.saveToLocalStorage('lastVisit', now.toISOString());
    }

    // ウェルカムモーダルを閉じる
    closeWelcomeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            document.body.removeChild(modal);
        }
        
        // 最初のタスク作成を促す
        setTimeout(() => {
            TaskHelpers.showNotification('「新しいタスク」ボタンから最初のタスクを作成してみましょう！', 'info', 5000);
        }, 1000);
    }

    // ページ表示時の処理
    handlePageVisible() {
        // 長時間離れていた場合はデータを再読み込み
        const lastActiveTime = TaskHelpers.loadFromLocalStorage('lastActiveTime', Date.now());
        const inactiveMinutes = (Date.now() - lastActiveTime) / (1000 * 60);
        
        if (inactiveMinutes > 30) { // 30分以上非アクティブ
            this.refreshData();
            TaskHelpers.showNotification('データを最新の状態に更新しました', 'info');
        }
        
        TaskHelpers.saveToLocalStorage('lastActiveTime', Date.now());
    }

    // ページ非表示時の処理
    handlePageHidden() {
        TaskHelpers.saveToLocalStorage('lastActiveTime', Date.now());
        
        // フォーカスモードが有効な場合は一時停止
        if (FocusMode.isActive() && FocusMode.timer) {
            FocusMode.togglePause();
            TaskHelpers.showNotification('フォーカスモードを一時停止しました', 'info');
        }
    }

    // グローバルキーボードハンドリング
    handleGlobalKeyboard(e) {
        // モーダルが開いている場合は処理しない
        if (document.querySelector('.modal-overlay.active')) return;

        // Ctrl/Cmd + S: 手動保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveData();
            TaskHelpers.showNotification('データを保存しました', 'success');
        }

        // Ctrl/Cmd + Z: 元に戻す（将来実装）
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            // TODO: 元に戻す機能
        }

        // F1: ヘルプ表示
        if (e.key === 'F1') {
            e.preventDefault();
            this.showHelpModal();
        }

        // Alt + 1-4: セクション切り替え
        if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
            e.preventDefault();
            this.switchToSection(parseInt(e.key));
        }
    }

    // セクション切り替え
    switchToSection(sectionNumber) {
        const sections = ['today-section', 'interruption-section', 'db-view-section'];
        const targetSection = sections[sectionNumber - 1];
        
        if (targetSection) {
            const element = document.getElementById(targetSection);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                TaskHelpers.showNotification(`${['Today', '割り込みタスク', 'DBビュー'][sectionNumber - 1]}セクションに移動`, 'info', 2000);
            }
        }
    }

    // ヘルプモーダル表示
    showHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal" style="max-width: 700px;">
                <div class="modal-header">
                    <h3 class="modal-title">❓ ヘルプ・ショートカットキー</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-content">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
                        <div>
                            <h4 style="color: #2c3e50; margin-bottom: 15px;">⌨️ キーボードショートカット</h4>
                            <div style="font-size: 14px; line-height: 1.8;">
                                <div><kbd>Ctrl+N</kbd> 新しいタスク</div>
                                <div><kbd>Ctrl+F</kbd> 検索フォーカス</div>
                                <div><kbd>F2</kbd> フォーカスモード切り替え</div>
                                <div><kbd>F1</kbd> ヘルプ表示</div>
                                <div><kbd>Esc</kbd> モーダル閉じる</div>
                                <div><kbd>Ctrl+S</kbd> 手動保存</div>
                                <div><kbd>Alt+1-3</kbd> セクション切り替え</div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 style="color: #2c3e50; margin-bottom: 15px;">📖 使い方のコツ</h4>
                            <div style="font-size: 14px; line-height: 1.8; color: #7f8c8d;">
                                <div>• タスクは詳細編集でカテゴリや優先度を設定</div>
                                <div>• Todayには本日集中したいタスクを追加</div>
                                <div>• 割り込みタスクは素早く記録してから整理</div>
                                <div>• フォーカスモードで深い集中状態を実現</div>
                                <div>• ドラッグ&ドロップで直感的操作</div>
                                <div>• Markdownでタスクの一括管理</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h4 style="color: #2c3e50; margin-bottom: 10px;">💡 ADHD向け機能</h4>
                        <div style="font-size: 14px; color: #7f8c8d; line-height: 1.6;">
                            このアプリはADHD傾向のある方の特性を考慮した設計になっています：
                            注意散漫になりにくいフォーカスモード、突発的なタスクを即座記録できる割り込みタスク機能、
                            視覚的に分かりやすいカラー分類、シンプルで迷わないUI設計を採用しています。
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // グローバルエラーハンドリング
    handleGlobalError(error) {
        console.error('Global error handled:', error);
        
        // ネットワークエラー
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            TaskHelpers.showNotification('ネットワークエラーが発生しました', 'error');
            return;
        }

        // データベースエラー
        if (error.message && error.message.includes('supabase')) {
            TaskHelpers.showNotification('データベース接続エラーが発生しました', 'error');
            return;
        }

        // 一般的なエラー
        TaskHelpers.showNotification('予期しないエラーが発生しました', 'error');
    }

    // エラーメッセージ表示
    showErrorMessage(message, error) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title" style="color: #e74c3c;">❌ エラーが発生しました</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-content">
                    <p style="color: #2c3e50; margin-bottom: 15px;">${message}</p>
                    ${error ? `
                        <details style="margin-top: 15px;">
                            <summary style="cursor: pointer; color: #7f8c8d;">詳細情報</summary>
                            <pre style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px; overflow-x: auto; font-size: 12px;">${error.stack || error.message || error}</pre>
                        </details>
                    ` : ''}
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn btn-primary" onclick="location.reload()">
                            🔄 ページを再読み込み
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    // データ同期
    async syncData() {
        if (!this.globalState.isOnline) return;

        try {
            await taskManager.loadAllTasks();
            taskManager.renderAllViews();
            this.globalState.lastSyncTime = new Date();
            
            TaskHelpers.showNotification('データを同期しました', 'success', 2000);
        } catch (error) {
            console.error('Data sync failed:', error);
            TaskHelpers.showNotification('データ同期に失敗しました', 'error');
        }
    }

    // データ更新
    async refreshData() {
        try {
            await taskManager.loadAllTasks();
            taskManager.renderAllViews();
        } catch (error) {
            console.error('Data refresh failed:', error);
        }
    }

    // データ保存
    async saveData() {
        // 現在の状態をローカルストレージにバックアップ
        try {
            const backup = {
                tasks: taskManager.tasks,
                settings: this.globalState.settings,
                timestamp: new Date().toISOString()
            };
            
            TaskHelpers.saveToLocalStorage('taskManagerBackup', backup);
            
        } catch (error) {
            console.error('Data save failed:', error);
        }
    }

    // 未保存変更確認
    hasUnsavedChanges() {
        // 実装は簡略化：フォーカスモード中の場合のみ警告
        return FocusMode.isActive() && FocusMode.elapsedSeconds > 60;
    }

    // アプリ設定更新
    updateSettings(newSettings) {
        this.globalState.settings = { ...this.globalState.settings, ...newSettings };
        TaskHelpers.saveToLocalStorage('taskManagerSettings', this.globalState.settings);
    }

    // 使用統計取得
    getUsageStats() {
        const tasks = taskManager.tasks || [];
        const settings = this.globalState.settings;
        
        return {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            todayTasks: tasks.filter(t => t.is_today).length,
            interruptionTasks: tasks.filter(t => t.is_interruption).length,
            focusedTask: tasks.find(t => t.is_focused),
            lastSyncTime: this.globalState.lastSyncTime,
            isOnline: this.globalState.isOnline,
            settings
        };
    }

    // デバッグ情報出力
    getDebugInfo() {
        return {
            app: {
                initialized: this.isInitialized,
                version: '1.0.0',
                buildDate: '2025-01-26'
            },
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                online: navigator.onLine,
                cookieEnabled: navigator.cookieEnabled
            },
            storage: {
                localStorage: typeof localStorage !== 'undefined',
                sessionStorage: typeof sessionStorage !== 'undefined',
                storageUsed: this.getStorageUsage()
            },
            api: {
                supabaseUrl: taskAPI.supabaseUrl,
                userId: taskAPI.userId
            },
            stats: this.getUsageStats()
        };
    }

    // ストレージ使用量確認
    getStorageUsage() {
        if (typeof localStorage === 'undefined') return 'N/A';
        
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        
        return `${(total / 1024).toFixed(2)} KB`;
    }
}

// グローバルアプリインスタンス
window.app = new TaskManagerApp();

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await app.initialize();
    } catch (error) {
        console.error('App initialization failed:', error);
        
        // フォールバック: 基本的なエラー表示
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; font-family: Arial, sans-serif;">
                <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 500px;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">😵</div>
                    <h2 style="color: #e74c3c; margin-bottom: 15px;">アプリケーションエラー</h2>
                    <p style="color: #7f8c8d; margin-bottom: 20px;">
                        タスクマネージャーの初期化に失敗しました。<br>
                        ページを再読み込みするか、しばらく時間をおいてからお試しください。
                    </p>
                    <button onclick="location.reload()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        🔄 ページを再読み込み
                    </button>
                    <details style="margin-top: 20px; text-align: left;">
                        <summary style="cursor: pointer; color: #7f8c8d;">エラー詳細</summary>
                        <pre style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px; overflow-x: auto; font-size: 12px;">${error.stack || error.message || error}</pre>
                    </details>
                </div>
            </div>
        `;
    }
});

// サービスワーカー登録（将来のオフライン対応）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 現在はサービスワーカーファイルがないのでコメントアウト
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered:', registration))
        //     .catch(registrationError => console.log('SW registration failed:', registrationError));
    });
}

// パフォーマンス監視
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log(`📊 Page Load Performance:
                    DNS Lookup: ${(perfData.domainLookupEnd - perfData.domainLookupStart).toFixed(2)}ms
                    Connect: ${(perfData.connectEnd - perfData.connectStart).toFixed(2)}ms
                    Request: ${(perfData.responseEnd - perfData.requestStart).toFixed(2)}ms
                    DOM Ready: ${(perfData.domContentLoadedEventEnd - perfData.navigationStart).toFixed(2)}ms
                    Full Load: ${(perfData.loadEventEnd - perfData.navigationStart).toFixed(2)}ms
                `);
            }
        }, 0);
    });
}

console.log('📋 ADHD Task Manager v1.0.0 - Ready to initialize');
