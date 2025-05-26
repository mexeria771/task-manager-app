// 割り込みタスクビューコンポーネント
class InterruptionView {
    static container = null;
    static emptyState = null;
    static quickInput = null;

    static initialize() {
        this.container = document.getElementById('interruption-tasks');
        this.emptyState = document.getElementById('interruption-empty');
        this.quickInput = document.getElementById('quick-interruption-input');
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // 割り込みタスク追加ボタン
        document.getElementById('add-interruption-btn').addEventListener('click', () => {
            this.openAddModal();
        });

        // クイック追加のエンターキー処理
        if (this.quickInput) {
            this.quickInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addQuickInterruption();
                }
            });
        }

        // ドラッグ&ドロップ設定
        TaskHelpers.setupDragAndDrop(this.container, (taskId) => {
            this.handleDrop(taskId);
        });
    }

    static async render() {
        if (!this.container) return;

        try {
            // 割り込みタスクを取得
            let interruptionTasks = taskManager.getFilteredTasks({ 
                is_interruption: true 
            });

            // 完了済みは最後に表示するため分離
            const pendingTasks = interruptionTasks.filter(t => t.status !== 'completed');
            const completedTasks = interruptionTasks.filter(t => t.status === 'completed');

            // 優先度と作成日時でソート
            pendingTasks.sort((a, b) => {
                if (a.priority !== b.priority) return b.priority - a.priority;
                return new Date(b.created_at) - new Date(a.created_at);
            });

            completedTasks.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

            const allTasks = [...pendingTasks, ...completedTasks];
            
            this.renderTasks(allTasks);
            this.updateEmptyState(allTasks.length === 0);
            this.updateSectionStats(pendingTasks.length, completedTasks.length);

        } catch (error) {
            console.error('Interruption view render failed:', error);
            this.container.innerHTML = '<p class="text-center" style="color: #e74c3c;">表示エラーが発生しました</p>';
        }
    }

    static renderTasks(tasks) {
        if (tasks.length === 0) {
            this.container.innerHTML = '';
            return;
        }

        const tasksHTML = tasks.map(task => 
            taskManager.generateTaskHTML(task, {
                showToday: true,
                showFocus: true,
                showPromote: true // 割り込みタスクは昇格ボタンを表示
            })
        ).join('');

        this.container.innerHTML = `
            <div class="task-list">
                ${tasksHTML}
            </div>
        `;

        // アニメーション追加
        this.container.querySelectorAll('.task-item').forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
            item.classList.add('slide-up');
        });
    }

    static updateEmptyState(isEmpty) {
        if (this.emptyState) {
            this.emptyState.style.display = isEmpty ? 'block' : 'none';
        }
    }

    static updateSectionStats(pending, completed) {
        const header = document.querySelector('#interruption-section .section-header .section-title');
        if (header) {
            let statsElement = header.querySelector('.section-stats');
            if (!statsElement) {
                statsElement = document.createElement('span');
                statsElement.className = 'section-stats';
                header.appendChild(statsElement);
            }

            if (pending + completed > 0) {
                statsElement.innerHTML = `<small style="color: #7f8c8d; font-weight: normal; margin-left: 10px;">(${pending}/${pending + completed})</small>`;
            } else {
                statsElement.innerHTML = '';
            }
        }
    }

    static async handleDrop(taskId) {
        try {
            // 通常タスクを割り込みタスクに変換
            await taskAPI.updateTask(taskId, { 
                is_interruption: true,
                priority: 4 // 割り込みタスクは高優先度
            });
            
            await taskManager.loadAllTasks();
            taskManager.renderAllViews();
            
            TaskHelpers.showNotification('割り込みタスクに変換しました', 'success');

        } catch (error) {
            console.error('Drop handling failed:', error);
            TaskHelpers.showNotification('ドロップ操作に失敗しました', 'error');
        }
    }

    static async addQuickInterruption() {
        const title = this.quickInput?.value?.trim();
        if (!title) {
            TaskHelpers.showNotification('タスクタイトルを入力してください', 'warning');
            return;
        }

        try {
            await taskAPI.createInterruption(title);
            
            // 入力フィールドをクリア
            if (this.quickInput) {
                this.quickInput.value = '';
            }
            
            await taskManager.loadAllTasks();
            taskManager.renderAllViews();
            
            TaskHelpers.showNotification('割り込みタスクを追加しました', 'success');

        } catch (error) {
            console.error('Quick add interruption failed:', error);
            TaskHelpers.showNotification('割り込みタスクの追加に失敗しました', 'error');
        }
    }

    static openAddModal() {
        taskManager.openTaskModal(null, { 
            is_interruption: true,
            priority: 4
        });
    }

    // 割り込みタスクの統計情報
    static getStats() {
        const interruptionTasks = taskManager.getFilteredTasks({ is_interruption: true });
        
        return {
            total: interruptionTasks.length,
            completed: interruptionTasks.filter(t => t.status === 'completed').length,
            pending: interruptionTasks.filter(t => t.status === 'pending').length,
            inProgress: interruptionTasks.filter(t => t.status === 'in_progress').length,
            promoted: taskManager.tasks.filter(t => 
                !t.is_interruption && 
                t.title.includes('[元割り込み]') // 昇格時にタイトルにマーク
            ).length
        };
    }

    // 集中度への影響分析
    static getFocusImpact() {
        const stats = this.getStats();
        const insights = [];
        
        if (stats.pending > 5) {
            insights.push({
                type: 'warning',
                message: `未処理の割り込みタスクが${stats.pending}個あります。集中力に影響する可能性があります。`
            });
        }
        
        if (stats.inProgress > 2) {
            insights.push({
                type: 'warning', 
                message: '同時進行中の割り込みタスクが多すぎます。優先順位を見直しましょう。'
            });
        }
        
        if (stats.completed > 0) {
            insights.push({
                type: 'success',
                message: `本日${stats.completed}個の割り込みタスクを処理しました！`
            });
        }

        const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        if (completionRate < 30 && stats.total > 3) {
            insights.push({
                type: 'info',
                message: '割り込みタスクの完了率が低いです。一部をメインタスクに昇格することを検討してください。'
            });
        }
        
        return insights;
    }

    // 自動昇格提案
    static suggestPromotion() {
        const interruptionTasks = taskManager.getFilteredTasks({ 
            is_interruption: true,
            status: 'pending'
        });

        // 長時間未処理のタスクを抽出
        const now = new Date();
        const oldTasks = interruptionTasks.filter(task => {
            const created = new Date(task.created_at);
            const diffHours = (now - created) / (1000 * 60 * 60);
            return diffHours > 24; // 24時間以上未処理
        });

        // 高優先度の割り込みタスクを抽出
        const highPriorityTasks = interruptionTasks.filter(task => task.priority >= 4);

        if (oldTasks.length > 0 || highPriorityTasks.length > 0) {
            return {
                shouldShow: true,
                oldTasks,
                highPriorityTasks,
                message: `${oldTasks.length}個の長期未処理タスクと${highPriorityTasks.length}個の高優先度タスクがあります。メインタスクへの昇格を検討してください。`
            };
        }

        return { shouldShow: false };
    }

    // 一括操作メニュー
    static showBulkActionsMenu() {
        const interruptionTasks = taskManager.getFilteredTasks({ 
            is_interruption: true,
            status: ['pending', 'in_progress']
        });

        if (interruptionTasks.length === 0) {
            TaskHelpers.showNotification('操作対象のタスクがありません', 'info');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">割り込みタスク一括操作</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="bulk-actions">
                        <button class="btn btn-primary" onclick="InterruptionView.bulkPromote()">
                            ⬆ 全て昇格
                        </button>
                        <button class="btn btn-success" onclick="InterruptionView.bulkComplete()">
                            ✓ 全て完了
                        </button>
                        <button class="btn btn-warning" onclick="InterruptionView.bulkAddToToday()">
                            📅  全てTodayに追加
                        </button>
                        <button class="btn btn-danger" onclick="InterruptionView.bulkDelete()">
                            🗑 全て削除
                        </button>
                    </div>
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <p style="margin: 0; color: #7f8c8d; font-size: 14px;">
                            対象: ${interruptionTasks.length}個の未完了割り込みタスク
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // イベントリスナー
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // 一括昇格
    static async bulkPromote() {
        const confirmed = await TaskHelpers.confirm(
            '全ての割り込みタスクをメインタスクに昇格しますか？',
            '一括昇格'
        );

        if (!confirmed) return;

        try {
            const tasks = taskManager.getFilteredTasks({ 
                is_interruption: true,
                status: ['pending', 'in_progress']
            });

            for (const task of tasks) {
                await taskAPI.promoteInterruption(task.id);
            }

            await taskManager.loadAllTasks();
            taskManager.renderAllViews();
            
            TaskHelpers.showNotification(`${tasks.length}個のタスクを昇格しました`, 'success');
            
            // モーダルを閉じる
            const modal = document.querySelector('.modal-overlay');
            if (modal) document.body.removeChild(modal);

        } catch (error) {
            console.error('Bulk promote failed:', error);
            TaskHelpers.showNotification('一括昇格に失敗しました', 'error');
        }
    }

    // 一括完了
    static async bulkComplete() {
        const confirmed = await TaskHelpers.confirm(
            '全ての割り込みタスクを完了にしますか？',
            '一括完了'
        );

        if (!confirmed) return;

        try {
            const tasks = taskManager.getFilteredTasks({ 
                is_interruption: true,
                status: ['pending', 'in_progress']
            });

            for (const task of tasks) {
                await taskAPI.completeTask(task.id);
            }

            await taskManager.loadAllTasks();
            taskManager.renderAllViews();
            
            TaskHelpers.showNotification(`${tasks.length}個のタスクを完了しました`, 'success');
            
            // モーダルを閉じる
            const modal = document.querySelector('.modal-overlay');
            if (modal) document.body.removeChild(modal);

        } catch (error) {
            console.error('Bulk complete failed:', error);
            TaskHelpers.showNotification('一括完了に失敗しました', 'error');
        }
    }

    // Today一括追加
    static async bulkAddToToday() {
        const confirmed = await TaskHelpers.confirm(
            '全ての割り込みタスクをTodayに追加しますか？',
            'Today一括追加'
        );

        if (!confirmed) return;

        try {
            const tasks = taskManager.getFilteredTasks({ 
                is_interruption: true,
                status: ['pending', 'in_progress']
            });

            for (const task of tasks) {
                if (!task.is_today) {
                    await taskAPI.addToToday(task.id);
                }
            }

            await taskManager.loadAllTasks();
            taskManager.renderAllViews();
            
            TaskHelpers.showNotification(`${tasks.length}個のタスクをTodayに追加しました`, 'success');
            
            // モーダルを閉じる
            const modal = document.querySelector('.modal-overlay');
            if (modal) document.body.removeChild(modal);

        } catch (error) {
            console.error('Bulk add to today failed:', error);
            TaskHelpers.showNotification('Today一括追加に失敗しました', 'error');
        }
    }
}

// グローバル関数（HTML onclick用）
window.QuickAdd = {
    addInterruption: () => InterruptionView.addQuickInterruption()
};

// 自動初期化
document.addEventListener('DOMContentLoaded', () => {
    InterruptionView.initialize();
});

window.InterruptionView = InterruptionView;
