// タスクマネージャー コアコンポーネント
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentEditingTask = null;
        this.filters = {
            status: '',
            priority: '',
            category: '',
            sort: 'created_at.desc'
        };
        this.searchQueries = {
            today: '',
            db: ''
        };
        
        this.initializeEventListeners();
        this.setupKeyboardShortcuts();
    }

    // 初期化
    async initialize() {
        try {
            await this.loadAllTasks();
            this.renderAllViews();
            TaskHelpers.showNotification('タスクマネージャーが正常に起動しました', 'success');
        } catch (error) {
            console.error('Initialization failed:', error);
            TaskHelpers.showNotification('初期化に失敗しました', 'error');
        }
    }

    // 全タスク読み込み
    async loadAllTasks() {
        try {
            this.tasks = await taskAPI.getTasks();
            return this.tasks;
        } catch (error) {
            console.error('Failed to load tasks:', error);
            throw error;
        }
    }

    // イベントリスナー設定
    initializeEventListeners() {
        // 新しいタスクボタン
        document.getElementById('new-task-btn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // メインタスクボタン
        document.getElementById('new-main-task-btn').addEventListener('click', () => {
            this.openTaskModal(null, { is_interruption: false });
        });

        // フォーカスモード切り替え
        document.getElementById('focus-toggle-btn').addEventListener('click', () => {
            FocusMode.toggle();
        });

        // タスクモーダル
        this.setupTaskModal();

        // フィルター切り替え
        document.getElementById('filter-toggle-btn').addEventListener('click', () => {
            const container = document.getElementById('filter-container');
            container.style.display = container.style.display === 'none' ? 'flex' : 'none';
        });

        // フィルター変更
        this.setupFilterListeners();

        // 検索
        this.setupSearchListeners();

        // インポート/エクスポート
        this.setupImportExportListeners();
    }

    // タスクモーダル設定
    setupTaskModal() {
        const overlay = document.getElementById('task-modal-overlay');
        const closeBtn = document.getElementById('task-modal-close');
        const cancelBtn = document.getElementById('task-cancel-btn');
        const deleteBtn = document.getElementById('task-delete-btn');
        const form = document.getElementById('task-form');

        // 閉じるボタン
        [closeBtn, cancelBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeTaskModal();
            });
        });

        // オーバーレイクリック
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeTaskModal();
            }
        });

        // フォーム送信
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveTask();
        });

        // 削除ボタン
        deleteBtn.addEventListener('click', async () => {
            await this.deleteTask();
        });
    }

    // フィルターリスナー設定
    setupFilterListeners() {
        const filterElements = [
            'status-filter',
            'priority-filter', 
            'category-filter',
            'sort-filter'
        ];

        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.updateFilters();
                });
            }
        });
    }

    // 検索リスナー設定
    setupSearchListeners() {
        // Today検索
        const todaySearch = document.getElementById('today-search');
        if (todaySearch) {
            todaySearch.addEventListener('input', TaskHelpers.debounce(() => {
                this.searchQueries.today = todaySearch.value;
                TodayView.render();
            }, 300));
        }

        // DB検索
        const dbSearch = document.getElementById('db-search');
        if (dbSearch) {
            dbSearch.addEventListener('input', TaskHelpers.debounce(() => {
                this.searchQueries.db = dbSearch.value;
                DBView.render();
            }, 300));
        }
    }

    // インポート/エクスポートリスナー設定
    setupImportExportListeners() {
        document.getElementById('export-btn').addEventListener('click', () => {
            MarkdownExport.showExportModal();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            MarkdownExport.showImportModal();
        });
    }

    // キーボードショートカット設定
    setupKeyboardShortcuts() {
        TaskHelpers.setupKeyboardShortcuts();

        // カスタムショートカットイベント
        window.addEventListener('shortcut:new-task', () => {
            this.openTaskModal();
        });

        window.addEventListener('shortcut:focus-search', () => {
            const dbSearch = document.getElementById('db-search');
            if (dbSearch) dbSearch.focus();
        });

        window.addEventListener('shortcut:toggle-focus', () => {
            FocusMode.toggle();
        });

        window.addEventListener('shortcut:escape', () => {
            this.closeTaskModal();
            FocusMode.close();
            MarkdownExport.closeModal();
        });
    }

    // フィルター更新
    updateFilters() {
        this.filters = {
            status: document.getElementById('status-filter').value,
            priority: document.getElementById('priority-filter').value,
            category: document.getElementById('category-filter').value,
            sort: document.getElementById('sort-filter').value
        };

        DBView.render();
    }

    // タスクモーダルを開く
    openTaskModal(task = null, defaults = {}) {
        this.currentEditingTask = task;
        const overlay = document.getElementById('task-modal-overlay');
        const title = document.getElementById('task-modal-title');
        const deleteBtn = document.getElementById('task-delete-btn');
        
        // タイトル設定
        title.textContent = task ? 'タスク編集' : '新しいタスク';
        
        // 削除ボタン表示/非表示
        deleteBtn.style.display = task ? 'inline-flex' : 'none';
        
        // フォーム入力値設定
        this.populateTaskForm(task, defaults);
        
        // モーダル表示
        overlay.classList.add('active');
        
        // タイトルフィールドにフォーカス
        setTimeout(() => {
            document.getElementById('task-title').focus();
        }, 300);
    }

    // タスクモーダルを閉じる
    closeTaskModal() {
        const overlay = document.getElementById('task-modal-overlay');
        overlay.classList.remove('active');
        this.currentEditingTask = null;
        document.getElementById('task-form').reset();
    }

    // フォーム入力値設定
    populateTaskForm(task, defaults = {}) {
        const form = document.getElementById('task-form');
        
        if (task) {
            // 既存タスクの編集
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-title').value = task.title || '';
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('task-status').value = task.status || 'pending';
            document.getElementById('task-priority').value = task.priority || 3;
            document.getElementById('task-category').value = task.category || '';
            document.getElementById('task-is-today').checked = task.is_today || false;
            document.getElementById('task-is-interruption').checked = task.is_interruption || false;
            
            // 期限日時設定
            if (task.due_date) {
                const date = new Date(task.due_date);
                document.getElementById('task-due-date').value = 
                    date.toISOString().slice(0, 16);
            }
        } else {
            // 新規タスク
            form.reset();
            document.getElementById('task-priority').value = defaults.priority || 3;
            document.getElementById('task-is-today').checked = defaults.is_today || false;
            document.getElementById('task-is-interruption').checked = defaults.is_interruption || false;
            
            if (defaults.category) {
                document.getElementById('task-category').value = defaults.category;
            }
        }
    }

    // タスク保存
    async saveTask() {
        try {
            const form = document.getElementById('task-form');
            const formData = new FormData(form);
            
            const taskData = {
                title: formData.get('title').trim(),
                description: formData.get('description')?.trim() || null,
                status: formData.get('status'),
                priority: parseInt(formData.get('priority')),
                category: formData.get('category') || null,
                due_date: formData.get('due_date') || null,
                is_today: document.getElementById('task-is-today').checked,
                is_interruption: document.getElementById('task-is-interruption').checked
            };

            // バリデーション
            if (!taskData.title) {
                TaskHelpers.showNotification('タイトルは必須です', 'error');
                return;
            }

            // 期限日時のISO形式変換
            if (taskData.due_date) {
                taskData.due_date = new Date(taskData.due_date).toISOString();
            }

            let savedTask;
            if (this.currentEditingTask) {
                // 更新
                await taskAPI.updateTask(this.currentEditingTask.id, taskData);
                savedTask = { ...this.currentEditingTask, ...taskData };
                TaskHelpers.showNotification('タスクを更新しました', 'success');
            } else {
                // 新規作成
                const result = await taskAPI.createTask(taskData);
                savedTask = result[0];
                TaskHelpers.showNotification('タスクを作成しました', 'success');
            }

            // ローカルタスクリスト更新
            await this.loadAllTasks();
            this.renderAllViews();
            this.closeTaskModal();

        } catch (error) {
            console.error('Save task failed:', error);
            TaskHelpers.showNotification('タスクの保存に失敗しました', 'error');
        }
    }

    // タスク削除
    async deleteTask() {
        if (!this.currentEditingTask) return;

        const confirmed = await TaskHelpers.confirm(
            `「${this.currentEditingTask.title}」を削除しますか？\nこの操作は取り消せません。`,
            'タスク削除'
        );

        if (!confirmed) return;

        try {
            await taskAPI.deleteTask(this.currentEditingTask.id);
            
            // ローカルタスクリスト更新
            await this.loadAllTasks();
            this.renderAllViews();
            this.closeTaskModal();
            
            TaskHelpers.showNotification('タスクを削除しました', 'success');

        } catch (error) {
            console.error('Delete task failed:', error);
            TaskHelpers.showNotification('タスクの削除に失敗しました', 'error');
        }
    }

    // タスクステータス変更
    async changeTaskStatus(taskId, newStatus) {
        try {
            await taskAPI.changeTaskStatus(taskId, newStatus);
            await this.loadAllTasks();
            this.renderAllViews();
            
            const statusText = TaskHelpers.formatStatus(newStatus).text;
            TaskHelpers.showNotification(`タスクを${statusText}に変更しました`, 'success');

        } catch (error) {
            console.error('Change status failed:', error);
            TaskHelpers.showNotification('ステータス変更に失敗しました', 'error');
        }
    }

    // タスクの Today 追加/削除
    async toggleToday(taskId) {
        try {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            if (task.is_today) {
                await taskAPI.removeFromToday(taskId);
                TaskHelpers.showNotification('Todayから削除しました', 'info');
            } else {
                await taskAPI.addToToday(taskId);
                TaskHelpers.showNotification('Todayに追加しました', 'success');
            }

            await this.loadAllTasks();
            this.renderAllViews();

        } catch (error) {
            console.error('Toggle today failed:', error);
            TaskHelpers.showNotification('操作に失敗しました', 'error');
        }
    }

    // 割り込みタスクの昇格
    async promoteInterruption(taskId) {
        try {
            await taskAPI.promoteInterruption(taskId);
            await this.loadAllTasks();
            this.renderAllViews();
            
            TaskHelpers.showNotification('メインタスクに昇格しました', 'success');

        } catch (error) {
            console.error('Promote interruption failed:', error);
            TaskHelpers.showNotification('昇格に失敗しました', 'error');
        }
    }

    // フォーカスタスク設定
    async setFocusTask(taskId) {
        try {
            await taskAPI.setFocusTask(taskId);
            await this.loadAllTasks();
            this.renderAllViews();
            
            TaskHelpers.showNotification('フォーカスタスクに設定しました', 'success');

        } catch (error) {
            console.error('Set focus task failed:', error);
            TaskHelpers.showNotification('フォーカス設定に失敗しました', 'error');
        }
    }

    // 全ビュー描画
    renderAllViews() {
        TodayView.render();
        InterruptionView.render();
        DBView.render();
    }

    // フィルタ済みタスク取得
    getFilteredTasks(additionalFilters = {}) {
        let filtered = [...this.tasks];

        // 基本フィルター適用
        Object.keys({ ...this.filters, ...additionalFilters }).forEach(key => {
            const value = additionalFilters[key] !== undefined ? 
                         additionalFilters[key] : this.filters[key];
            
            if (value) {
                switch (key) {
                    case 'status':
                        filtered = filtered.filter(task => task.status === value);
                        break;
                    case 'priority':
                        filtered = filtered.filter(task => task.priority === parseInt(value));
                        break;
                    case 'category':
                        filtered = filtered.filter(task => task.category === value);
                        break;
                    case 'is_today':
                        filtered = filtered.filter(task => task.is_today === value);
                        break;
                    case 'is_interruption':
                        filtered = filtered.filter(task => task.is_interruption === value);
                        break;
                }
            }
        });

        // ソート適用
        const [sortField, sortDirection] = this.filters.sort.split('.');
        filtered.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            // 日付の場合
            if (sortField.includes('date') || sortField.includes('at')) {
                aVal = new Date(aVal || 0);
                bVal = new Date(bVal || 0);
            }

            // 文字列の場合
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (sortDirection === 'desc') {
                return bVal > aVal ? 1 : -1;
            } else {
                return aVal > bVal ? 1 : -1;
            }
        });

        return filtered;
    }

    // 検索フィルタ適用
    applySearchFilter(tasks, query) {
        if (!query.trim()) return tasks;

        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return tasks.filter(task => {
            const searchText = [
                task.title || '',
                task.description || '',
                task.category || ''
            ].join(' ').toLowerCase();

            return searchTerms.every(term => searchText.includes(term));
        });
    }

    // タスクHTML生成
    generateTaskHTML(task, options = {}) {
        const priority = TaskHelpers.formatPriority(task.priority);
        const status = TaskHelpers.formatStatus(task.status);
        const categoryIcon = TaskHelpers.getCategoryIcon(task.category);
        const dueDate = task.due_date ? TaskHelpers.formatRelativeTime(task.due_date) : '';
        
        const showActions = options.showActions !== false;
        const showToday = options.showToday !== false;
        const showFocus = options.showFocus !== false;
        const showPromote = options.showPromote === true;

        const dueDateClass = task.due_date ? 
            (new Date(task.due_date) < new Date() ? 'overdue' : 
             new Date(task.due_date).toDateString() === new Date().toDateString() ? 'today' : '') : '';

        return `
            <div class="task-item ${task.status === 'completed' ? 'completed' : ''} ${task.is_focused ? 'focused' : ''}" 
                 data-task-id="${task.id}" 
                 draggable="true"
                 onclick="taskManager.openTaskModal(taskManager.tasks.find(t => t.id === '${task.id}'))">
                <div class="task-header">
                    <h4 class="task-title ${task.status === 'completed' ? 'completed' : ''}">
                        ${categoryIcon} ${TaskHelpers.escapeHtml(task.title)}
                    </h4>
                </div>
                
                ${task.description ? `
                    <div class="task-description">
                        ${TaskHelpers.escapeHtml(TaskHelpers.truncateText(task.description, 100))}
                    </div>
                ` : ''}
                
                <div class="task-meta">
                    <span class="task-priority ${priority.class}">${priority.text}</span>
                    <span class="task-status ${status.class}">${status.text}</span>
                    ${task.category ? `<span class="task-category">${task.category}</span>` : ''}
                    ${dueDate ? `<span class="task-due-date ${dueDateClass}">${dueDate}</span>` : ''}
                    ${task.is_today ? '<span class="task-tag">📅 Today</span>' : ''}
                    ${task.is_interruption ? '<span class="task-tag">⚡ 割り込み</span>' : ''}
                    ${task.is_focused ? '<span class="task-tag">🎯 フォーカス中</span>' : ''}
                </div>
                
                ${showActions ? `
                    <div class="task-actions" onclick="event.stopPropagation()">
                        ${task.status !== 'completed' ? `
                            <button class="btn btn-small btn-success" 
                                    onclick="taskManager.changeTaskStatus('${task.id}', 'completed')">
                                ✓ 完了
                            </button>
                        ` : `
                            <button class="btn btn-small btn-secondary" 
                                    onclick="taskManager.changeTaskStatus('${task.id}', 'pending')">
                                ↩ 未完了
                            </button>
                        `}
                        
                        ${showToday ? `
                            <button class="btn btn-small ${task.is_today ? 'btn-warning' : 'btn-primary'}" 
                                    onclick="taskManager.toggleToday('${task.id}')">
                                ${task.is_today ? '📅 Today削除' : '📅 Today追加'}
                            </button>
                        ` : ''}
                        
                        ${showFocus && !task.is_focused && task.status !== 'completed' ? `
                            <button class="btn btn-small btn-warning" 
                                    onclick="taskManager.setFocusTask('${task.id}')">
                                🎯 フォーカス
                            </button>
                        ` : ''}
                        
                        ${showPromote && task.is_interruption ? `
                            <button class="btn btn-small btn-primary" 
                                    onclick="taskManager.promoteInterruption('${task.id}')">
                                ⬆ 昇格
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
}

// グローバルインスタンス
window.taskManager = new TaskManager();
