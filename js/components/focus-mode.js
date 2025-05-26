// フォーカスモードコンポーネント
class FocusMode {
    static overlay = null;
    static content = null;
    static focusedTask = null;
    static timer = null;
    static startTime = null;
    static elapsedSeconds = 0;

    static initialize() {
        this.overlay = document.getElementById('focus-mode-overlay');
        this.content = document.getElementById('focus-task-content');
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // フォーカスモード終了ボタン
        const exitBtn = document.getElementById('exit-focus-btn');
        const closeBtn = document.getElementById('focus-mode-close');
        
        [exitBtn, closeBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.close();
                });
            }
        });

        // オーバーレイクリック（ただし、フォーカスモードでは無効にする）
        this.overlay?.addEventListener('click', (e) => {
            // フォーカスモード中はオーバーレイクリックでは閉じない
            if (e.target === this.overlay && !this.focusedTask) {
                this.close();
            }
        });

        // ESCキーでの終了（注意が必要なので確認）
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive()) {
                this.requestExit();
            }
        });
    }

    static async toggle() {
        if (this.isActive()) {
            this.requestExit();
        } else {
            await this.selectTaskAndStart();
        }
    }

    static async selectTaskAndStart() {
        // フォーカス可能なタスクを取得
        const availableTasks = taskManager.tasks.filter(task => 
            task.status !== 'completed' && 
            task.status !== 'cancelled' &&
            !task.is_focused
        );

        if (availableTasks.length === 0) {
            TaskHelpers.showNotification('フォーカスできるタスクがありません', 'info');
            return;
        }

        // 現在進行中のタスクがあれば優先的に表示
        const inProgressTasks = availableTasks.filter(t => t.status === 'in_progress');
        const todayTasks = availableTasks.filter(t => t.is_today);

        // 推奨順序: 進行中 > Today > 高優先度
        let recommendedTasks = [];
        if (inProgressTasks.length > 0) recommendedTasks.push(...inProgressTasks);
        if (todayTasks.length > 0) recommendedTasks.push(...todayTasks.filter(t => !recommendedTasks.includes(t)));
        
        const highPriorityTasks = availableTasks
            .filter(t => t.priority >= 4 && !recommendedTasks.includes(t))
            .sort((a, b) => b.priority - a.priority);
        
        if (highPriorityTasks.length > 0) recommendedTasks.push(...highPriorityTasks.slice(0, 3));

        this.showTaskSelectionModal(recommendedTasks, availableTasks);
    }

    static showTaskSelectionModal(recommendedTasks, allTasks) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.style.zIndex = '10001'; // フォーカスモーダルより手前
        
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">🎯 フォーカスするタスクを選択</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-content">
                    ${recommendedTasks.length > 0 ? `
                        <div style="margin-bottom: 25px;">
                            <h4 style="color: #2c3e50; margin-bottom: 15px;">📍 おすすめ</h4>
                            <div class="task-list">
                                ${recommendedTasks.map(task => this.generateFocusTaskHTML(task)).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div>
                        <h4 style="color: #2c3e50; margin-bottom: 15px;">📋 すべてのタスク</h4>
                        <div class="search-container" style="margin-bottom: 15px;">
                            <input type="text" class="search-input" id="focus-task-search" placeholder="タスクを検索...">
                            <span class="search-icon">🔍</span>
                        </div>
                        <div class="task-list" id="focus-all-tasks" style="max-height: 300px; overflow-y: auto;">
                            ${allTasks.map(task => this.generateFocusTaskHTML(task)).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                        <p style="margin: 0; color: #1565c0; font-size: 14px;">
                            💡 <strong>フォーカスモードのコツ:</strong><br>
                            • 1つのタスクに集中しましょう<br>
                            • 25分間集中して5分休憩（ポモドーロ技法）<br>
                            • 通知や他のタスクは一時的に忘れましょう
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 検索機能
        const searchInput = modal.querySelector('#focus-task-search');
        const allTasksContainer = modal.querySelector('#focus-all-tasks');
        
        searchInput?.addEventListener('input', TaskHelpers.debounce(() => {
            const query = searchInput.value.toLowerCase();
            const filteredTasks = allTasks.filter(task => 
                task.title.toLowerCase().includes(query) ||
                (task.description && task.description.toLowerCase().includes(query)) ||
                (task.category && task.category.toLowerCase().includes(query))
            );
            
            allTasksContainer.innerHTML = filteredTasks.map(task => 
                this.generateFocusTaskHTML(task)
            ).join('');
        }, 300));

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

    static generateFocusTaskHTML(task) {
        const priority = TaskHelpers.formatPriority(task.priority);
        const status = TaskHelpers.formatStatus(task.status);
        const categoryIcon = TaskHelpers.getCategoryIcon(task.category);
        
        return `
            <div class="task-item" style="cursor: pointer; margin-bottom: 10px;" 
                 onclick="FocusMode.startFocus('${task.id}')">
                <div class="task-header">
                    <h4 class="task-title">
                        ${categoryIcon} ${TaskHelpers.escapeHtml(task.title)}
                    </h4>
                </div>
                ${task.description ? `
                    <div class="task-description">
                        ${TaskHelpers.escapeHtml(TaskHelpers.truncateText(task.description, 80))}
                    </div>
                ` : ''}
                <div class="task-meta">
                    <span class="task-priority ${priority.class}">${priority.text}</span>
                    <span class="task-status ${status.class}">${status.text}</span>
                    ${task.category ? `<span class="task-category">${task.category}</span>` : ''}
                    ${task.is_today ? '<span class="task-tag">📅 Today</span>' : ''}
                    ${task.is_interruption ? '<span class="task-tag">⚡ 割り込み</span>' : ''}
                </div>
            </div>
        `;
    }

    static async startFocus(taskId) {
        try {
            // タスク選択モーダルを閉じる
            const selectionModal = document.querySelector('.modal-overlay[style*="10001"]');
            if (selectionModal) {
                document.body.removeChild(selectionModal);
            }

            // フォーカスタスクを設定
            await taskAPI.setFocusTask(taskId);
            
            // タスク情報を取得
            this.focusedTask = await taskAPI.getTask(taskId);
            
            if (!this.focusedTask) {
                throw new Error('タスクが見つかりません');
            }

            // フォーカスモードUI表示
            await this.showFocusMode();
            
            // タイマー開始
            this.startTimer();
            
            await taskManager.loadAllTasks();
            taskManager.renderAllViews();

        } catch (error) {
            console.error('Start focus failed:', error);
            TaskHelpers.showNotification('フォーカスモードの開始に失敗しました', 'error');
        }
    }

    static async showFocusMode() {
        if (!this.focusedTask || !this.content) return;

        const task = this.focusedTask;
        const priority = TaskHelpers.formatPriority(task.priority);
        const categoryIcon = TaskHelpers.getCategoryIcon(task.category);

        this.content.innerHTML = `
            <div class="focus-task-container" style="text-align: center;">
                <div class="focus-task-info" style="background: rgba(255,255,255,0.1); border-radius: 15px; padding: 25px; margin-bottom: 25px;">
                    <div class="focus-task-icon" style="font-size: 3rem; margin-bottom: 15px;">
                        ${categoryIcon}
                    </div>
                    
                    <h2 class="focus-task-title" style="color: white; margin-bottom: 15px; font-size: 1.8rem;">
                        ${TaskHelpers.escapeHtml(task.title)}
                    </h2>
                    
                    ${task.description ? `
                        <p class="focus-task-description" style="color: rgba(255,255,255,0.9); font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                            ${TaskHelpers.escapeHtml(task.description)}
                        </p>
                    ` : ''}
                    
                    <div class="focus-task-meta" style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-bottom: 20px;">
                        <span class="focus-meta-item" style="background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 20px; color: white; font-size: 14px;">
                            優先度: ${priority.text}
                        </span>
                        ${task.category ? `
                            <span class="focus-meta-item" style="background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 20px; color: white; font-size: 14px;">
                                ${task.category}
                            </span>
                        ` : ''}
                        ${task.due_date ? `
                            <span class="focus-meta-item" style="background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 20px; color: white; font-size: 14px;">
                                期限: ${TaskHelpers.formatRelativeTime(task.due_date)}
                            </span>
                        ` : ''}
                    </div>
                </div>

                <div class="focus-timer" style="background: rgba(255,255,255,0.1); border-radius: 15px; padding: 20px; margin-bottom: 25px;">
                    <div class="timer-display" style="font-size: 3rem; font-weight: bold; color: white; margin-bottom: 15px;">
                        <span id="focus-timer-display">00:00:00</span>
                    </div>
                    
                    <div class="timer-controls" style="display: flex; justify-content: center; gap: 15px;">
                        <button class="btn btn-success" id="focus-complete-btn" style="background: rgba(46, 204, 113, 0.8);">
                            ✓ 完了
                        </button>
                        <button class="btn btn-warning" id="focus-pause-btn" style="background: rgba(243, 156, 18, 0.8);">
                            ⏸ 一時停止
                        </button>
                        <button class="btn btn-secondary" id="focus-notes-btn" style="background: rgba(149, 165, 166, 0.8);">
                            📝 メモ
                        </button>
                    </div>
                </div>

                <div class="focus-progress" style="background: rgba(255,255,255,0.1); border-radius: 15px; padding: 15px;">
                    <div class="pomodoro-timer" style="color: white;">
                        <p style="margin: 0; font-size: 14px; opacity: 0.9;">ポモドーロ技法: 25分集中 → 5分休憩</p>
                        <div style="background: rgba(255,255,255,0.2); height: 6px; border-radius: 3px; margin-top: 10px; overflow: hidden;">
                            <div id="pomodoro-progress" style="background: #2ecc71; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // フォーカスモードボタンのイベントリスナー設定
        this.setupFocusModeButtons();

        // モーダル表示
        this.overlay.classList.add('active');
    }

    static setupFocusModeButtons() {
        const completeBtn = document.getElementById('focus-complete-btn');
        const pauseBtn = document.getElementById('focus-pause-btn');
        const notesBtn = document.getElementById('focus-notes-btn');

        completeBtn?.addEventListener('click', () => {
            this.completeTask();
        });

        pauseBtn?.addEventListener('click', () => {
            this.togglePause();
        });

        notesBtn?.addEventListener('click', () => {
            this.showNotesModal();
        });
    }

    static startTimer() {
        this.startTime = Date.now();
        this.elapsedSeconds = 0;
        
        this.timer = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateTimerDisplay();
            this.updatePomodoroProgress();
        }, 1000);
    }

    static updateTimerDisplay() {
        const display = document.getElementById('focus-timer-display');
        if (!display) return;

        const hours = Math.floor(this.elapsedSeconds / 3600);
        const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
        const seconds = this.elapsedSeconds % 60;

        display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    static updatePomodoroProgress() {
        const progressBar = document.getElementById('pomodoro-progress');
        if (!progressBar) return;

        const pomodoroMinutes = 25;
        const pomodoroSeconds = pomodoroMinutes * 60;
        const progress = Math.min((this.elapsedSeconds / pomodoroSeconds) * 100, 100);
        
        progressBar.style.width = `${progress}%`;

        // 25分経過で通知
        if (this.elapsedSeconds === pomodoroSeconds) {
            TaskHelpers.showNotification('🍅 ポモドーロ完了！5分間休憩しましょう', 'success', 5000);
        }
    }

    static togglePause() {
        const pauseBtn = document.getElementById('focus-pause-btn');
        if (!pauseBtn) return;

        if (this.timer) {
            // 一時停止
            clearInterval(this.timer);
            this.timer = null;
            pauseBtn.innerHTML = '▶ 再開';
            pauseBtn.style.background = 'rgba(46, 204, 113, 0.8)';
        } else {
            // 再開
            this.startTime = Date.now() - (this.elapsedSeconds * 1000);
            this.startTimer();
            pauseBtn.innerHTML = '⏸ 一時停止';
            pauseBtn.style.background = 'rgba(243, 156, 18, 0.8)';
        }
    }

    static async completeTask() {
        const confirmed = await TaskHelpers.confirm(
            `「${this.focusedTask.title}」を完了にしますか？\n\n集中時間: ${this.formatElapsedTime()}`,
            'タスク完了'
        );

        if (!confirmed) return;

        try {
            await taskAPI.completeTask(this.focusedTask.id);
            
            TaskHelpers.showNotification(
                `タスクを完了しました！集中時間: ${this.formatElapsedTime()}`, 
                'success', 
                5000
            );

            this.close();
            
            await taskManager.loadAllTasks();
            taskManager.renderAllViews();

        } catch (error) {
            console.error('Complete focus task failed:', error);
            TaskHelpers.showNotification('タスク完了に失敗しました', 'error');
        }
    }

    static showNotesModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.style.zIndex = '10002';
        
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">📝 フォーカス中のメモ</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-content">
                    <textarea class="form-textarea" id="focus-note-text" rows="6" 
                              placeholder="作業中の気づきやメモを記録しましょう..."></textarea>
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn btn-primary" onclick="FocusMode.saveNote()">
                            保存
                        </button>
                        <button class="btn btn-secondary" onclick="FocusMode.closeNotesModal()">
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // フォーカス
        setTimeout(() => {
            document.getElementById('focus-note-text')?.focus();
        }, 300);

        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeNotesModal();
        });
    }

    static async saveNote() {
        const noteText = document.getElementById('focus-note-text')?.value?.trim();
        if (!noteText) {
            TaskHelpers.showNotification('メモが空です', 'warning');
            return;
        }

        try {
            await taskAPI.addTaskNote(this.focusedTask.id, noteText);
            TaskHelpers.showNotification('メモを保存しました', 'success');
            this.closeNotesModal();
        } catch (error) {
            console.error('Save note failed:', error);
            TaskHelpers.showNotification('メモの保存に失敗しました', 'error');
        }
    }

    static closeNotesModal() {
        const modal = document.querySelector('.modal-overlay[style*="10002"]');
        if (modal) {
            document.body.removeChild(modal);
        }
    }

    static requestExit() {
        if (this.elapsedSeconds > 60) { // 1分以上の場合は確認
            TaskHelpers.confirm(
                `フォーカスモードを終了しますか？\n\n集中時間: ${this.formatElapsedTime()}\n\n※ タスクは完了されません`,
                'フォーカスモード終了'
            ).then(confirmed => {
                if (confirmed) {
                    this.close();
                }
            });
        } else {
            this.close();
        }
    }

    static async close() {
        // タイマー停止
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        // フォーカス状態解除
        if (this.focusedTask) {
            try {
                await taskAPI.clearFocus();
            } catch (error) {
                console.error('Clear focus failed:', error);
            }
        }

        // モーダル閉じる
        this.overlay?.classList.remove('active');
        
        // 状態リセット
        this.focusedTask = null;
        this.startTime = null;
        this.elapsedSeconds = 0;

        // ビュー更新
        await taskManager.loadAllTasks();
        taskManager.renderAllViews();
    }

    static isActive() {
        return this.overlay?.classList.contains('active') || false;
    }

    static formatElapsedTime() {
        const hours = Math.floor(this.elapsedSeconds / 3600);
        const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
        const seconds = this.elapsedSeconds % 60;

        if (hours > 0) {
            return `${hours}時間${minutes}分${seconds}秒`;
        } else if (minutes > 0) {
            return `${minutes}分${seconds}秒`;
        } else {
            return `${seconds}秒`;
        }
    }
}

// 自動初期化
document.addEventListener('DOMContentLoaded', () => {
    FocusMode.initialize();
});

window.FocusMode = FocusMode;
