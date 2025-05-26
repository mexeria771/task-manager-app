// データベースビューコンポーネント
class DBView {
    static container = null;
    static emptyState = null;
    static currentPage = 1;
    static itemsPerPage = 20;
    static totalItems = 0;

    static initialize() {
        this.container = document.getElementById('db-tasks');
        this.emptyState = document.getElementById('db-empty');
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // ドラッグ&ドロップ設定
        TaskHelpers.setupDragAndDrop(this.container, (taskId, event) => {
            this.handleDrop(taskId, event);
        });
    }

    static async render() {
        if (!this.container) return;

        try {
            // フィルター適用されたタスク取得
            let allTasks = taskManager.getFilteredTasks();

            // 検索フィルタ適用
            if (taskManager.searchQueries.db) {
                allTasks = taskManager.applySearchFilter(allTasks, taskManager.searchQueries.db);
            }

            this.totalItems = allTasks.length;

            // ページネーション適用
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const paginatedTasks = allTasks.slice(startIndex, endIndex);

            this.renderTasks(paginatedTasks);
            this.renderPagination();
            this.updateEmptyState(allTasks.length === 0);
            this.updateStats(allTasks);

        } catch (error) {
            console.error('DB view render failed:', error);
            this.container.innerHTML = '<p class="text-center" style="color: #e74c3c;">表示エラーが発生しました</p>';
        }
    }

    static renderTasks(tasks) {
        if (tasks.length === 0) {
            this.container.innerHTML = '';
            return;
        }

        // タスクをステータス別にグループ化
        const grouped = {
            in_progress: tasks.filter(t => t.status === 'in_progress'),
            pending: tasks.filter(t => t.status === 'pending'),
            completed: tasks.filter(t => t.status === 'completed'),
            cancelled: tasks.filter(t => t.status === 'cancelled')
        };

        let html = '';

        // 進行中のタスクを最初に表示
        if (grouped.in_progress.length > 0) {
            html += this.renderTaskGroup('🔄 進行中', grouped.in_progress, 'in-progress');
        }

        // 未着手タスク
        if (grouped.pending.length > 0) {
            html += this.renderTaskGroup('📋 未着手', grouped.pending, 'pending');
        }

        // 完了タスク（折りたたみ可能）
        if (grouped.completed.length > 0) {
            html += this.renderTaskGroup('✅ 完了', grouped.completed, 'completed', true);
        }

        // キャンセルタスク（折りたたみ可能）
        if (grouped.cancelled.length > 0) {
            html += this.renderTaskGroup('❌ キャンセル', grouped.cancelled, 'cancelled', true);
        }

        this.container.innerHTML = html;

        // 折りたたみ機能の設定
        this.setupCollapsibleGroups();

        // アニメーション追加
        this.container.querySelectorAll('.task-item').forEach((item, index) => {
            item.style.animationDelay = `${index * 0.05}s`;
            item.classList.add('fade-in');
        });
    }

    static renderTaskGroup(title, tasks, groupClass, collapsible = false) {
        const groupId = `group-${groupClass}`;
        const isCollapsed = collapsible && localStorage.getItem(`collapsed-${groupClass}`) === 'true';

        return `
            <div class="task-group ${groupClass}" style="margin-bottom: 25px;">
                <div class="task-group-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 10px 15px; background: #f8f9fa; border-radius: 8px; cursor: ${collapsible ? 'pointer' : 'default'};" ${collapsible ? `onclick="DBView.toggleGroup('${groupClass}')"` : ''}>
                    <h3 style="margin: 0; color: #2c3e50; font-size: 1.1rem;">
                        ${title} <span style="color: #7f8c8d; font-weight: normal; font-size: 0.9rem;">(${tasks.length})</span>
                    </h3>
                    ${collapsible ? `
                        <span class="collapse-icon" style="font-size: 1.2rem; color: #7f8c8d;">
                            ${isCollapsed ? '▶' : '▼'}
                        </span>
                    ` : ''}
                </div>
                <div class="task-group-content" id="${groupId}" style="display: ${isCollapsed ? 'none' : 'block'};">
                    <div class="task-list">
                        ${tasks.map(task => taskManager.generateTaskHTML(task, {
                            showActions: true,
                            showToday: true,
                            showFocus: true,
                            showPromote: task.is_interruption
                        })).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    static setupCollapsibleGroups() {
        // 折りたたみ状態は既にHTMLで設定済み
        // ここでは必要に応じて追加の設定を行う
    }

    static toggleGroup(groupClass) {
        const groupContent = document.getElementById(`group-${groupClass}`);
        const icon = document.querySelector(`[onclick*="${groupClass}"] .collapse-icon`);
        
        if (groupContent && icon) {
            const isVisible = groupContent.style.display !== 'none';
            groupContent.style.display = isVisible ? 'none' : 'block';
            icon.textContent = isVisible ? '▶' : '▼';
            
            // 状態を保存
            localStorage.setItem(`collapsed-${groupClass}`, isVisible.toString());
        }
    }

    static renderPagination() {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            // ページネーション不要
            this.removePagination();
            return;
        }

        let paginationHTML = `
            <div class="pagination-container" style="display: flex; justify-content: center; align-items: center; margin-top: 25px; gap: 10px;">
                <button class="btn btn-small btn-secondary" ${this.currentPage <= 1 ? 'disabled' : ''} 
                        onclick="DBView.goToPage(${this.currentPage - 1})">
                    ‹ 前へ
                </button>
                
                <div class="pagination-info" style="display: flex; align-items: center; gap: 10px;">
        `;

        // ページ番号表示（最大5個）
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        if (startPage > 1) {
            paginationHTML += `<button class="btn btn-small btn-secondary" onclick="DBView.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span style="color: #7f8c8d;">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="btn btn-small ${i === this.currentPage ? 'btn-primary' : 'btn-secondary'}" 
                        onclick="DBView.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span style="color: #7f8c8d;">...</span>`;
            }
            paginationHTML += `<button class="btn btn-small btn-secondary" onclick="DBView.goToPage(${totalPages})">${totalPages}</button>`;
        }

        paginationHTML += `
                </div>
                
                <button class="btn btn-small btn-secondary" ${this.currentPage >= totalPages ? 'disabled' : ''} 
                        onclick="DBView.goToPage(${this.currentPage + 1})">
                    次へ ›
                </button>
            </div>
            
            <div class="pagination-stats" style="text-align: center; margin-top: 10px; color: #7f8c8d; font-size: 14px;">
                ${(this.currentPage - 1) * this.itemsPerPage + 1}-${Math.min(this.currentPage * this.itemsPerPage, this.totalItems)} / ${this.totalItems}件
            </div>
        `;

        // 既存のページネーションを削除してから追加
        this.removePagination();
        this.container.insertAdjacentHTML('afterend', paginationHTML);
    }

    static removePagination() {
        const existing = document.querySelector('.pagination-container');
        const existingStats = document.querySelector('.pagination-stats');
        if (existing) existing.remove();
        if (existingStats) existingStats.remove();
    }

    static goToPage(page) {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.render();
        
        // スクロール位置をトップに
        this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    static updateEmptyState(isEmpty) {
        if (this.emptyState) {
            this.emptyState.style.display = isEmpty ? 'block' : 'none';
        }
    }

    static updateStats(tasks) {
        const header = document.querySelector('#db-view-section .section-header');
        if (!header) return;

        let statsElement = header.querySelector('.db-stats');
        if (!statsElement) {
            statsElement = document.createElement('div');
            statsElement.className = 'db-stats';
            header.appendChild(statsElement);
        }

        const stats = this.calculateStats(tasks);
        
        statsElement.innerHTML = `
            <div style="font-size: 12px; color: #7f8c8d; text-align: right; line-height: 1.4;">
                <div>総タスク: ${stats.total}</div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 3px;">
                    <span style="color: #007bff;">進行中: ${stats.inProgress}</span>
                    <span style="color: #6c757d;">未着手: ${stats.pending}</span>
                    <span style="color: #28a745;">完了: ${stats.completed}</span>
                </div>
            </div>
        `;
    }

    static calculateStats(tasks) {
        return {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            cancelled: tasks.filter(t => t.status === 'cancelled').length,
            today: tasks.filter(t => t.is_today).length,
            interruption: tasks.filter(t => t.is_interruption).length,
            focused: tasks.filter(t => t.is_focused).length
        };
    }

    static async handleDrop(taskId, event) {
        // ドロップされた場所に応じて処理を変更
        const dropTarget = event.target.closest('.task-group');
        
        if (dropTarget) {
            const groupClass = dropTarget.classList[1]; // task-group の次のクラス
            await this.handleGroupDrop(taskId, groupClass);
        }
    }

    static async handleGroupDrop(taskId, groupClass) {
        try {
            let updates = {};
            
            switch (groupClass) {
                case 'pending':
                    updates.status = 'pending';
                    break;
                case 'in-progress':
                    updates.status = 'in_progress';
                    break;
                case 'completed':
                    updates.status = 'completed';
                    break;
                case 'cancelled':
                    updates.status = 'cancelled';
                    break;
                default:
                    return;
            }

            await taskAPI.updateTask(taskId, updates);
            await taskManager.loadAllTasks();
            taskManager.renderAllViews();
            
            const statusText = TaskHelpers.formatStatus(updates.status).text;
            TaskHelpers.showNotification(`タスクを${statusText}に変更しました`, 'success');

        } catch (error) {
            console.error('Group drop failed:', error);
            TaskHelpers.showNotification('ステータス変更に失敗しました', 'error');
        }
    }

    // フィルタークリア
    static clearFilters() {
        document.getElementById('status-filter').value = '';
        document.getElementById('priority-filter').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('sort-filter').value = 'created_at.desc';
        document.getElementById('db-search').value = '';
        
        taskManager.updateFilters();
        taskManager.searchQueries.db = '';
        this.currentPage = 1;
        this.render();
        
        TaskHelpers.showNotification('フィルターをクリアしました', 'info');
    }

    // 高度な分析
    static getAdvancedAnalytics() {
        const allTasks = taskManager.tasks;
        const now = new Date();
        
        // 期限切れタスク
        const overdueTasks = allTasks.filter(task => 
            task.due_date && 
            new Date(task.due_date) < now && 
            task.status !== 'completed' && 
            task.status !== 'cancelled'
        );
        
        // 長期停滞タスク（1週間以上更新されていない）
        const stalledTasks = allTasks.filter(task => {
            if (task.status === 'completed' || task.status === 'cancelled') return false;
            const updated = new Date(task.updated_at);
            const diffDays = (now - updated) / (1000 * 60 * 60 * 24);
            return diffDays > 7;
        });
        
        // カテゴリ別分析
        const categoryStats = {};
        allTasks.forEach(task => {
            const category = task.category || 'その他';
            if (!categoryStats[category]) {
                categoryStats[category] = { total: 0, completed: 0, pending: 0 };
            }
            categoryStats[category].total++;
            if (task.status === 'completed') categoryStats[category].completed++;
            if (task.status === 'pending') categoryStats[category].pending++;
        });
        
        // 優先度分析
        const priorityStats = {};
        [1, 2, 3, 4, 5].forEach(priority => {
            const tasks = allTasks.filter(t => t.priority === priority);
            priorityStats[priority] = {
                total: tasks.length,
                completed: tasks.filter(t => t.status === 'completed').length,
                completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0
            };
        });
        
        return {
            overdue: overdueTasks,
            stalled: stalledTasks,
            categoryStats,
            priorityStats,
            insights: this.generateInsights(overdueTasks, stalledTasks, categoryStats, priorityStats)
        };
    }

    static generateInsights(overdue, stalled, categories, priorities) {
        const insights = [];
        
        if (overdue.length > 0) {
            insights.push({
                type: 'warning',
                title: '期限切れタスク',
                message: `${overdue.length}個のタスクが期限切れです。優先的に対応しましょう。`
            });
        }
        
        if (stalled.length > 0) {
            insights.push({
                type: 'info',
                title: '停滞タスク',
                message: `${stalled.length}個のタスクが1週間以上更新されていません。進捗確認が必要です。`
            });
        }
        
        // 最も完了率の高いカテゴリ
        const bestCategory = Object.entries(categories)
            .filter(([, stats]) => stats.total >= 3)
            .sort((a, b) => (b[1].completed / b[1].total) - (a[1].completed / a[1].total))[0];
        
        if (bestCategory) {
            const [category, stats] = bestCategory;
            const rate = Math.round((stats.completed / stats.total) * 100);
            insights.push({
                type: 'success',
                title: '得意分野',
                message: `「${category}」カテゴリの完了率が${rate}%と高いです！`
            });
        }
        
        // 高優先度タスクの状況
        const highPriorityCompletion = priorities[5].completionRate;
        if (highPriorityCompletion < 50 && priorities[5].total > 0) {
            insights.push({
                type: 'warning',
                title: '高優先度タスク',
                message: `最高優先度タスクの完了率が${highPriorityCompletion}%と低いです。集中的に取り組みましょう。`
            });
        }
        
        return insights;
    }

    // 分析レポート表示
    static showAnalyticsModal() {
        const analytics = this.getAdvancedAnalytics();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title">📊 タスク分析レポート</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-content">
                    <!-- インサイト -->
                    <div style="margin-bottom: 25px;">
                        <h4 style="color: #2c3e50; margin-bottom: 15px;">💡 インサイト</h4>
                        ${analytics.insights.length > 0 ? 
                            analytics.insights.map(insight => `
                                <div style="padding: 12px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid ${
                                    insight.type === 'warning' ? '#f39c12' : 
                                    insight.type === 'success' ? '#27ae60' : '#3498db'
                                }; background: ${
                                    insight.type === 'warning' ? '#fef9e7' : 
                                    insight.type === 'success' ? '#eafaf1' : '#ebf3fd'
                                };">
                                    <strong>${insight.title}</strong><br>
                                    <span style="color: #7f8c8d; font-size: 14px;">${insight.message}</span>
                                </div>
                            `).join('') :
                            '<p style="color: #7f8c8d;">現在特筆すべき傾向はありません。</p>'
                        }
                    </div>
                    
                    <!-- カテゴリ別統計 -->
                    <div style="margin-bottom: 25px;">
                        <h4 style="color: #2c3e50; margin-bottom: 15px;">📂 カテゴリ別完了率</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            ${Object.entries(analytics.categoryStats).map(([category, stats]) => {
                                const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                                return `
                                    <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                                        <div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px;">
                                            ${TaskHelpers.getCategoryIcon(category)} ${category}
                                        </div>
                                        <div style="font-size: 24px; font-weight: bold; color: ${rate >= 70 ? '#27ae60' : rate >= 40 ? '#f39c12' : '#e74c3c'}; margin-bottom: 5px;">
                                            ${rate}%
                                        </div>
                                        <div style="font-size: 12px; color: #7f8c8d;">
                                            ${stats.completed}/${stats.total} 完了
                                        </div>
                                        <div style="background: #ecf0f1; height: 4px; border-radius: 2px; margin-top: 8px;">
                                            <div style="background: ${rate >= 70 ? '#27ae60' : rate >= 40 ? '#f39c12' : '#e74c3c'}; height: 100%; width: ${rate}%; border-radius: 2px;"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <!-- 優先度別統計 -->
                    <div>
                        <h4 style="color: #2c3e50; margin-bottom: 15px;">⭐ 優先度別完了率</h4>
                        ${[5, 4, 3, 2, 1].map(priority => {
                            const stats = analytics.priorityStats[priority];
                            const priorityData = TaskHelpers.formatPriority(priority);
                            return `
                                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 15px; margin-bottom: 8px; background: #f8f9fa; border-radius: 8px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <span class="task-priority ${priorityData.class}">${priorityData.text}</span>
                                        <span style="color: #7f8c8d; font-size: 14px;">${stats.total}個</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 15px;">
                                        <div style="font-weight: 600; color: ${stats.completionRate >= 70 ? '#27ae60' : stats.completionRate >= 40 ? '#f39c12' : '#e74c3c'};">
                                            ${stats.completionRate}%
                                        </div>
                                        <div style="width: 100px; background: #ecf0f1; height: 6px; border-radius: 3px;">
                                            <div style="background: ${stats.completionRate >= 70 ? '#27ae60' : stats.completionRate >= 40 ? '#f39c12' : '#e74c3c'}; height: 100%; width: ${stats.completionRate}%; border-radius: 3px;"></div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
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
}

// 自動初期化
document.addEventListener('DOMContentLoaded', () => {
    DBView.initialize();
});

window.DBView = DBView;
