// ユーティリティヘルパー関数
class TaskHelpers {
    // 日付フォーマット
    static formatDate(date, options = {}) {
        if (!date) return '';
        
        const d = new Date(date);
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options
        };
        
        return d.toLocaleDateString('ja-JP', defaultOptions);
    }

    // 相対時間表示
    static formatRelativeTime(date) {
        if (!date) return '';
        
        const now = new Date();
        const target = new Date(date);
        const diffMs = target.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return '今日';
        if (diffDays === 1) return '明日';
        if (diffDays === -1) return '昨日';
        if (diffDays > 0) return `${diffDays}日後`;
        if (diffDays < 0) return `${Math.abs(diffDays)}日前`;
        
        return this.formatDate(date);
    }

    // 優先度表示
    static formatPriority(priority) {
        const priorities = {
            1: { text: '最低', class: 'priority-lowest', color: '#6c757d' },
            2: { text: '低', class: 'priority-low', color: '#28a745' },
            3: { text: '普通', class: 'priority-medium', color: '#ffc107' },
            4: { text: '高', class: 'priority-high', color: '#fd7e14' },
            5: { text: '最高', class: 'priority-highest', color: '#dc3545' }
        };
        
        return priorities[priority] || priorities[3];
    }

    // ステータス表示
    static formatStatus(status) {
        const statuses = {
            'pending': { text: '未着手', class: 'status-pending', color: '#6c757d' },
            'in_progress': { text: '進行中', class: 'status-in-progress', color: '#007bff' },
            'completed': { text: '完了', class: 'status-completed', color: '#28a745' },
            'cancelled': { text: 'キャンセル', class: 'status-cancelled', color: '#dc3545' }
        };
        
        return statuses[status] || statuses['pending'];
    }

    // カテゴリアイコン
    static getCategoryIcon(category) {
        const icons = {
            'work': '💼',
            'personal': '🏠',
            'health': '💪',
            'learning': '📚',
            'shopping': '🛒',
            'urgent': '🚨',
            'project': '📊',
            'meeting': '🤝',
            'call': '📞',
            'email': '📧',
            'research': '🔍',
            'maintenance': '🔧'
        };
        
        return icons[category] || '📝';
    }

    // HTML エスケープ
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // テキスト切り詰め
    static truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // UUID生成
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // ローカルストレージヘルパー
    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('LocalStorage save failed:', error);
            return false;
        }
    }

    static loadFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('LocalStorage load failed:', error);
            return defaultValue;
        }
    }

    // 通知表示
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // スタイル設定
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });

        // 背景色設定
        const colors = {
            'success': '#28a745',
            'error': '#dc3545',
            'warning': '#ffc107',
            'info': '#007bff'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // アニメーション表示
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // 自動削除
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // ローディング表示
    static showLoading(element) {
        if (!element) return;
        
        const loader = document.createElement('div');
        loader.className = 'loading-spinner';
        loader.innerHTML = `
            <div class="spinner">
                <div class="bounce1"></div>
                <div class="bounce2"></div>
                <div class="bounce3"></div>
            </div>
        `;
        
        element.appendChild(loader);
        return loader;
    }

    static hideLoading(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }

    // 確認ダイアログ
    static async confirm(message, title = '確認') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <div class="confirm-content">
                    <h3>${this.escapeHtml(title)}</h3>
                    <p>${this.escapeHtml(message)}</p>
                    <div class="confirm-buttons">
                        <button class="btn btn-secondary cancel-btn">キャンセル</button>
                        <button class="btn btn-primary confirm-btn">OK</button>
                    </div>
                </div>
            `;

            // スタイル設定
            Object.assign(modal.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '10000'
            });

            document.body.appendChild(modal);

            // イベントリスナー
            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });

            modal.querySelector('.confirm-btn').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            });
        });
    }

    // キーボードショートカット
    static setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+N: 新しいタスク
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('shortcut:new-task'));
            }
            
            // Ctrl+F: 検索フォーカス
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('shortcut:focus-search'));
            }
            
            // F2: フォーカスモード切り替え
            if (e.key === 'F2') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('shortcut:toggle-focus'));
            }
            
            // Escape: モーダル閉じる・フォーカス解除
            if (e.key === 'Escape') {
                window.dispatchEvent(new CustomEvent('shortcut:escape'));
            }
        });
    }

    // ドラッグ&ドロップヘルパー
    static setupDragAndDrop(container, onDrop) {
        if (!container) return;

        container.addEventListener('dragstart', (e) => {
            if (e.target.draggable) {
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId || '');
                e.target.classList.add('dragging');
            }
        });

        container.addEventListener('dragend', (e) => {
            if (e.target.draggable) {
                e.target.classList.remove('dragging');
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingElement = container.querySelector('.dragging');
            const afterElement = this.getDragAfterElement(container, e.clientY);
            
            if (afterElement == null) {
                container.appendChild(draggingElement);
            } else {
                container.insertBefore(draggingElement, afterElement);
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            if (taskId && onDrop) {
                onDrop(taskId, e);
            }
        });
    }

    static getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('[draggable]:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // デバウンス関数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // スロットル関数
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Markdownエクスポート用データ変換
    static tasksToMarkdown(tasks) {
        if (!tasks || tasks.length === 0) return '# タスク一覧\n\n_タスクがありません_';
        
        let markdown = '# タスク一覧\n\n';
        
        // ステータス別に分類
        const grouped = tasks.reduce((acc, task) => {
            const status = task.status || 'pending';
            if (!acc[status]) acc[status] = [];
            acc[status].push(task);
            return acc;
        }, {});

        const statusOrder = ['pending', 'in_progress', 'completed', 'cancelled'];
        const statusNames = {
            'pending': '未着手',
            'in_progress': '進行中',
            'completed': '完了',
            'cancelled': 'キャンセル'
        };

        statusOrder.forEach(status => {
            if (grouped[status] && grouped[status].length > 0) {
                markdown += `## ${statusNames[status]}\n\n`;
                
                grouped[status].forEach(task => {
                    const checkbox = status === 'completed' ? '[x]' : '[ ]';
                    const priority = this.formatPriority(task.priority);
                    const dueDate = task.due_date ? ` (期限: ${this.formatDate(task.due_date)})` : '';
                    const category = task.category ? ` [${task.category}]` : '';
                    
                    markdown += `- ${checkbox} **${task.title}**${category}${dueDate}\n`;
                    
                    if (task.description) {
                        markdown += `  - ${task.description}\n`;
                    }
                    
                    markdown += `  - 優先度: ${priority.text}\n`;
                    markdown += '\n';
                });
                
                markdown += '\n';
            }
        });

        return markdown;
    }

    // Markdownインポート用データ変換
    static markdownToTasks(markdown) {
        const lines = markdown.split('\n');
        const tasks = [];
        let currentCategory = null;
        
        lines.forEach(line => {
            line = line.trim();
            
            // カテゴリヘッダー検出
            if (line.startsWith('## ')) {
                currentCategory = line.substring(3).trim();
                return;
            }
            
            // タスク行検出
            const taskMatch = line.match(/^-\s*\[([ x])\]\s*(.+)$/);
            if (taskMatch) {
                const isCompleted = taskMatch[1] === 'x';
                let title = taskMatch[2];
                
                // カテゴリ抽出
                const categoryMatch = title.match(/\[([^\]]+)\]/);
                const category = categoryMatch ? categoryMatch[1] : currentCategory;
                if (categoryMatch) {
                    title = title.replace(categoryMatch[0], '').trim();
                }
                
                // 期限抽出
                const dueDateMatch = title.match(/\(期限:\s*([^)]+)\)/);
                const dueDate = dueDateMatch ? new Date(dueDateMatch[1]).toISOString() : null;
                if (dueDateMatch) {
                    title = title.replace(dueDateMatch[0], '').trim();
                }
                
                // **太字**除去
                title = title.replace(/^\*\*(.+)\*\*$/, '$1');
                
                tasks.push({
                    title,
                    category,
                    due_date: dueDate,
                    status: isCompleted ? 'completed' : 'pending',
                    priority: 3 // デフォルト優先度
                });
            }
        });
        
        return tasks;
    }
}

// グローバルヘルパーとして公開
window.TaskHelpers = TaskHelpers;
