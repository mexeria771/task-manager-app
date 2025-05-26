// Today ビューコンポーネント
class TodayView {
    static container = null;
    static emptyState = null;

    static initialize() {
        this.container = document.getElementById('today-tasks');
        this.emptyState = document.getElementById('today-empty');
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // Today追加ボタン
        document.getElementById('add-to-today-btn').addEventListener('click', () => {
            this.showAddToTodayModal();
        });

        // ドラッグ&ドロップ設定
        TaskHelpers.setupDragAndDrop(this.container, (taskId) => {
            this.handleDrop(taskId);
        });
    }

    static async render() {
        if (!this.container) return;

        try {
            // 今日のタスクを取得
            let todayTasks = taskManager.getFilteredTasks({ 
                is_today: true,
                status: ['pending', 'in_progress'] // 完了済みは除外
            });

            // 検索フィルタ適用
            if (taskManager.searchQueries.today) {
                todayTasks = taskManager.applySearchFilter(todayTasks, taskManager.searchQueries.today);
            }

            // 優先度とステータスでソート
            todayTasks.sort((a, b) => {
                // 進行中のタスクを優先
                if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
                if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
                
                // 優先度でソート
                if (a.priority !== b.priority) return b.priority - a.priority;
                
                // 作成日時でソート
                return new Date(b.created_at) - new Date(a.created_at);
            });

            this.renderTasks(todayTasks);
            this.updateEmptyState(todayTasks.length === 0);

        } catch (error) {
            console.error('Today view render failed:', error);
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
                showToday: false, // Today画面なのでToday追加ボタンは非表示
                showFocus: true,
                showPromote: false
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
            item.classList.add('fade-in');
        });
    }

    static updateEmptyState(isEmpty) {
        if (this.emptyState) {
            this.emptyState.style.display = isEmpty ? 'block' : 'none';
        }
    }

    static async handleDrop(taskId) {
        try {
            await taskManager.toggleToday(taskId);
        } catch (error) {
            console.error('Drop handling failed:', error);
            TaskHelpers.showNotification('ドロップ操作に失敗しました', 'error');
        }
    }

    static showAddToTodayModal() {
        // 今日のタスクに追加できるタスクを表示するモーダル
        const availableTasks = taskManager.tasks.filter(task => 
            !task.is_today && 
            task.status !== 'completed' && 
            task.status !== 'cancelled'
        );

        if (availableTasks.length === 0) {
            TaskHelpers.showNotification('追加できるタスクがありません', 'info');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Todayに追加するタスクを選択</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="task-list" style="max-height: 400px; overflow-y: auto;">
                        ${availableTasks.map(task => `
                            <div class="task-item" style="cursor: pointer;" onclick="TodayView.addTaskToToday('${task.id}')">
                                <div class="task-header">
                                    <h4 class="task-title">
                                        ${TaskHelpers.getCategoryIcon(task.category)} 
                                        ${TaskHelpers.escapeHtml(task.title)}
                                    </h4>
                                </div>
                                <div class="task-meta">
                                    <span class="task-priority ${TaskHelpers.formatPriority(task.priority).class}">
                                        ${TaskHelpers.formatPriority(task.priority).text}
                                    </span>
                                    <span class="task-status ${TaskHelpers.formatStatus(task.status).class}">
                                        ${TaskHelpers.formatStatus(task.status).text}
                                    </span>
                                    ${task.category ? `<span class="task-category">${task.category}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
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

    static async addTaskToToday(taskId) {
        try {
            await taskManager.toggleToday(taskId);
            
            // モーダルを閉じる
            const modal = document.querySelector('.modal-overlay');
            if (modal) {
                document.body.removeChild(modal);
            }
            
        } catch (error) {
            console.error('Add to today failed:', error);
            TaskHelpers.showNotification('Todayへの追加に失敗しました', 'error');
        }
    }

    // 統計情報取得
    static getStats() {
        const todayTasks = taskManager.getFilteredTasks({ is_today: true });
        
        return {
            total: todayTasks.length,
            completed: todayTasks.filter(t => t.status === 'completed').length,
            inProgress: todayTasks.filter(t => t.status === 'in_progress').length,
            pending: todayTasks.filter(t => t.status === 'pending').length,
            completionRate: todayTasks.length > 0 ? 
                Math.round((todayTasks.filter(t => t.status === 'completed').length / todayTasks.length) * 100) : 0
        };
    }

    // 進捗表示更新
    static updateProgressDisplay() {
        const stats = this.getStats();
        const header = document.querySelector('#today-section .section-header');
        
        if (header && stats.total > 0) {
            let progressHTML = header.querySelector('.progress-display');
            if (!progressHTML) {
                progressHTML = document.createElement('div');
                progressHTML.className = 'progress-display';
                header.appendChild(progressHTML);
            }
            
            progressHTML.innerHTML = `
                <div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">
                    完了: ${stats.completed}/${stats.total} (${stats.completionRate}%)
                </div>
                <div style="background: #ecf0f1; height: 4px; border-radius: 2px; margin-top: 3px;">
                    <div style="background: #27ae60; height: 100%; width: ${stats.completionRate}%; border-radius: 2px; transition: width 0.3s ease;"></div>
                </div>
            `;
        }
    }

    // 集中度合い分析
    static getFocusInsights() {
        const todayTasks = taskManager.getFilteredTasks({ is_today: true });
        const completedTasks = todayTasks.filter(t => t.status === 'completed');
        
        let insights = [];
        
        if (completedTasks.length > 0) {
            insights.push(`✅ 今日は${completedTasks.length}個のタスクを完了しました！`);
        }
        
        const highPriorityPending = todayTasks.filter(t => 
            t.priority >= 4 && t.status === 'pending'
        );
        
        if (highPriorityPending.length > 0) {
            insights.push(`⚠️ 高優先度のタスクが${highPriorityPending.length}個残っています`);
        }
        
        const inProgressTasks = todayTasks.filter(t => t.status === 'in_progress');
        if (inProgressTasks.length > 1) {
            insights.push(`💡 同時進行タスクが多いです。集中のために1つに絞りましょう`);
        }
        
        return insights;
    }
}

// 自動初期化
document.addEventListener('DOMContentLoaded', () => {
    TodayView.initialize();
});

window.TodayView = TodayView;
