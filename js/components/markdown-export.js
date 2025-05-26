// Markdown インポート/エクスポートコンポーネント
class MarkdownExport {
    static modal = null;
    static modalContent = null;

    static initialize() {
        this.modal = document.getElementById('import-export-modal-overlay');
        this.modalContent = document.getElementById('import-export-content');
        this.setupEventListeners();
    }

    static setupEventListeners() {
        const closeBtn = document.getElementById('import-export-modal-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }
    }

    static showExportModal() {
        if (!this.modal || !this.modalContent) return;

        document.getElementById('import-export-modal-title').textContent = 'Markdown エクスポート';
        
        this.modalContent.innerHTML = `
            <div class="export-container">
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">📤 エクスポート設定</h4>
                    
                    <div class="form-group">
                        <label class="form-label">エクスポート対象</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 8px;">
                            <label style="display: flex; align-items: center; gap: 5px;">
                                <input type="checkbox" id="export-all" checked> 全てのタスク
                            </label>
                            <label style="display: flex; align-items: center; gap: 5px;">
                                <input type="checkbox" id="export-today"> 今日のタスクのみ
                            </label>
                            <label style="display: flex; align-items: center; gap: 5px;">
                                <input type="checkbox" id="export-pending"> 未完了のみ
                            </label>
                            <label style="display: flex; align-items: center; gap: 5px;">
                                <input type="checkbox" id="export-completed"> 完了済みのみ
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">出力形式</label>
                        <select class="form-select" id="export-format">
                            <option value="markdown">Markdown (.md)</option>
                            <option value="text">プレーンテキスト (.txt)</option>
                            <option value="json">JSON (.json)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">グループ化</label>
                        <select class="form-select" id="export-grouping">
                            <option value="status">ステータス別</option>
                            <option value="category">カテゴリ別</option>
                            <option value="priority">優先度別</option>
                            <option value="date">作成日別</option>
                            <option value="none">グループ化なし</option>
                        </select>
                    </div>
                </div>

                <div style="text-align: center; margin-bottom: 20px;">
                    <button class="btn btn-primary" onclick="MarkdownExport.generateExport()">
                        📄 プレビュー生成
                    </button>
                    <button class="btn btn-success" onclick="MarkdownExport.downloadExport()">
                        💾 ファイルダウンロード
                    </button>
                </div>

                <div id="export-preview" style="display: none;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">📋 プレビュー</h4>
                    <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; max-height: 400px; overflow-y: auto;">
                        <pre id="export-preview-content" style="margin: 0; white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.4;"></pre>
                    </div>
                    <div style="text-align: center; margin-top: 10px;">
                        <button class="btn btn-secondary btn-small" onclick="MarkdownExport.copyToClipboard()">
                            📋 クリップボードにコピー
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.modal.classList.add('active');
        this.setupExportEventListeners();
    }

    static showImportModal() {
        if (!this.modal || !this.modalContent) return;

        document.getElementById('import-export-modal-title').textContent = 'Markdown インポート';
        
        this.modalContent.innerHTML = `
            <div class="import-container">
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">📥 インポート設定</h4>
                    
                    <div class="form-group">
                        <label class="form-label">インポート方法</label>
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <button class="btn btn-secondary" onclick="MarkdownExport.showTextImport()">
                                📝 テキスト貼り付け
                            </button>
                            <button class="btn btn-secondary" onclick="MarkdownExport.showFileImport()">
                                📁 ファイル選択
                            </button>
                        </div>
                    </div>
                </div>

                <div id="import-input-area">
                    <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                        上のボタンからインポート方法を選択してください
                    </div>
                </div>

                <div id="import-preview" style="display: none; margin-top: 20px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">🔍 インポートプレビュー</h4>
                    <div id="import-preview-content" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; max-height: 300px; overflow-y: auto;">
                    </div>
                    <div style="text-align: center; margin-top: 15px;">
                        <button class="btn btn-success" onclick="MarkdownExport.executeImport()">
                            ✅ インポート実行
                        </button>
                        <button class="btn btn-secondary" onclick="MarkdownExport.cancelImport()">
                            ❌ キャンセル
                        </button>
                    </div>
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
                    <h5 style="color: #856404; margin-bottom: 10px;">📋 サポートされるMarkdown形式</h5>
                    <div style="font-size: 13px; color: #856404; line-height: 1.5;">
                        <strong>チェックリスト形式:</strong><br>
                        <code>- [ ] タスクタイトル [カテゴリ] (期限: 2024-12-31)</code><br>
                        <code>- [x] 完了済みタスク</code><br><br>
                        
                        <strong>セクション形式:</strong><br>
                        <code>## 未着手</code><br>
                        <code>## 進行中</code><br>
                        <code>## 完了</code>
                    </div>
                </div>
            </div>
        `;

        this.modal.classList.add('active');
    }

    static setupExportEventListeners() {
        // エクスポート対象の相互排他設定
        const checkboxes = ['export-all', 'export-today', 'export-pending', 'export-completed'];
        
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked && id !== 'export-all') {
                        document.getElementById('export-all').checked = false;
                    } else if (checkbox.checked && id === 'export-all') {
                        checkboxes.slice(1).forEach(otherId => {
                            document.getElementById(otherId).checked = false;
                        });
                    }
                });
            }
        });
    }

    static generateExport() {
        try {
            const tasks = this.getExportTasks();
            const format = document.getElementById('export-format').value;
            const grouping = document.getElementById('export-grouping').value;

            let content = '';
            
            switch (format) {
                case 'markdown':
                    content = this.generateMarkdown(tasks, grouping);
                    break;
                case 'text':
                    content = this.generatePlainText(tasks, grouping);
                    break;
                case 'json':
                    content = this.generateJSON(tasks);
                    break;
            }

            // プレビュー表示
            document.getElementById('export-preview').style.display = 'block';
            document.getElementById('export-preview-content').textContent = content;

        } catch (error) {
            console.error('Export generation failed:', error);
            TaskHelpers.showNotification('エクスポート生成に失敗しました', 'error');
        }
    }

    static getExportTasks() {
        let tasks = [...taskManager.tasks];

        if (document.getElementById('export-today').checked) {
            tasks = tasks.filter(t => t.is_today);
        } else if (document.getElementById('export-pending').checked) {
            tasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
        } else if (document.getElementById('export-completed').checked) {
            tasks = tasks.filter(t => t.status === 'completed');
        }
        // export-all の場合はフィルタリングしない

        return tasks;
    }

    static generateMarkdown(tasks, grouping) {
        if (tasks.length === 0) return '# タスクリスト\n\n_エクスポート対象のタスクがありません_';

        let markdown = `# タスクリスト\n\n_エクスポート日時: ${new Date().toLocaleString('ja-JP')}_\n\n`;

        const grouped = this.groupTasks(tasks, grouping);

        Object.entries(grouped).forEach(([groupName, groupTasks]) => {
            if (grouping !== 'none') {
                markdown += `## ${groupName}\n\n`;
            }

            groupTasks.forEach(task => {
                const checkbox = task.status === 'completed' ? '[x]' : '[ ]';
                const priority = TaskHelpers.formatPriority(task.priority);
                const categoryIcon = TaskHelpers.getCategoryIcon(task.category);
                const dueDate = task.due_date ? ` (期限: ${TaskHelpers.formatDate(task.due_date)})` : '';
                const tags = [];
                
                if (task.is_today) tags.push('Today');
                if (task.is_interruption) tags.push('割り込み');
                if (task.is_focused) tags.push('フォーカス中');
                
                const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';

                markdown += `- ${checkbox} **${task.title}**${dueDate}${tagStr}\n`;
                
                if (task.description) {
                    markdown += `  > ${task.description}\n`;
                }
                
                markdown += `  - ${categoryIcon} ${task.category || '未分類'} | 優先度: ${priority.text} | ステータス: ${TaskHelpers.formatStatus(task.status).text}\n`;
                markdown += `  - 作成: ${TaskHelpers.formatDate(task.created_at)} | 更新: ${TaskHelpers.formatDate(task.updated_at)}\n`;
                markdown += '\n';
            });

            markdown += '\n';
        });

        // 統計情報追加
        const stats = this.calculateExportStats(tasks);
        markdown += `---\n\n## 📊 統計情報\n\n`;
        markdown += `- **総タスク数**: ${stats.total}\n`;
        markdown += `- **完了済み**: ${stats.completed} (${stats.completionRate}%)\n`;
        markdown += `- **進行中**: ${stats.inProgress}\n`;
        markdown += `- **未着手**: ${stats.pending}\n`;
        markdown += `- **今日のタスク**: ${stats.today}\n`;
        markdown += `- **割り込みタスク**: ${stats.interruption}\n`;

        return markdown;
    }

    static generatePlainText(tasks, grouping) {
        if (tasks.length === 0) return 'タスクリスト\n\nエクスポート対象のタスクがありません';

        let text = `タスクリスト\n${'='.repeat(20)}\n\nエクスポート日時: ${new Date().toLocaleString('ja-JP')}\n\n`;

        const grouped = this.groupTasks(tasks, grouping);

        Object.entries(grouped).forEach(([groupName, groupTasks]) => {
            if (grouping !== 'none') {
                text += `${groupName}\n${'-'.repeat(groupName.length)}\n\n`;
            }

            groupTasks.forEach((task, index) => {
                const status = task.status === 'completed' ? '✓' : '○';
                const priority = TaskHelpers.formatPriority(task.priority);
                const dueDate = task.due_date ? ` (期限: ${TaskHelpers.formatDate(task.due_date)})` : '';
                
                text += `${index + 1}. ${status} ${task.title}${dueDate}\n`;
                
                if (task.description) {
                    text += `   説明: ${task.description}\n`;
                }
                
                text += `   カテゴリ: ${task.category || '未分類'} | 優先度: ${priority.text}\n`;
                text += `   作成: ${TaskHelpers.formatDate(task.created_at)}\n\n`;
            });

            text += '\n';
        });

        return text;
    }

    static generateJSON(tasks) {
        const exportData = {
            exportDate: new Date().toISOString(),
            totalTasks: tasks.length,
            tasks: tasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                category: task.category,
                dueDate: task.due_date,
                isToday: task.is_today,
                isInterruption: task.is_interruption,
                isFocused: task.is_focused,
                createdAt: task.created_at,
                updatedAt: task.updated_at
            }))
        };

        return JSON.stringify(exportData, null, 2);
    }

    static groupTasks(tasks, grouping) {
        switch (grouping) {
            case 'status':
                return this.groupByStatus(tasks);
            case 'category':
                return this.groupByCategory(tasks);
            case 'priority':
                return this.groupByPriority(tasks);
            case 'date':
                return this.groupByDate(tasks);
            default:
                return { 'すべてのタスク': tasks };
        }
    }

    static groupByStatus(tasks) {
        const statusNames = {
            'pending': '未着手',
            'in_progress': '進行中',
            'completed': '完了',
            'cancelled': 'キャンセル'
        };

        const grouped = {};
        ['pending', 'in_progress', 'completed', 'cancelled'].forEach(status => {
            const statusTasks = tasks.filter(t => t.status === status);
            if (statusTasks.length > 0) {
                grouped[statusNames[status]] = statusTasks;
            }
        });

        return grouped;
    }

    static groupByCategory(tasks) {
        const grouped = {};
        tasks.forEach(task => {
            const category = task.category || '未分類';
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(task);
        });
        return grouped;
    }

    static groupByPriority(tasks) {
        const priorityNames = {
            5: '最高優先度',
            4: '高優先度',
            3: '普通',
            2: '低優先度',
            1: '最低優先度'
        };

        const grouped = {};
        [5, 4, 3, 2, 1].forEach(priority => {
            const priorityTasks = tasks.filter(t => t.priority === priority);
            if (priorityTasks.length > 0) {
                grouped[priorityNames[priority]] = priorityTasks;
            }
        });

        return grouped;
    }

    static groupByDate(tasks) {
        const grouped = {};
        tasks.forEach(task => {
            const date = TaskHelpers.formatDate(task.created_at, { year: 'numeric', month: 'long', day: 'numeric' });
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(task);
        });
        return grouped;
    }

    static calculateExportStats(tasks) {
        return {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'completed').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            pending: tasks.filter(t => t.status === 'pending').length,
            today: tasks.filter(t => t.is_today).length,
            interruption: tasks.filter(t => t.is_interruption).length,
            completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0
        };
    }

    static downloadExport() {
        const previewContent = document.getElementById('export-preview-content');
        if (!previewContent || !previewContent.textContent) {
            TaskHelpers.showNotification('まずプレビューを生成してください', 'warning');
            return;
        }

        const format = document.getElementById('export-format').value;
        const extensions = { markdown: 'md', text: 'txt', json: 'json' };
        const mimeTypes = { 
            markdown: 'text/markdown', 
            text: 'text/plain', 
            json: 'application/json' 
        };

        const filename = `tasks_${new Date().toISOString().split('T')[0]}.${extensions[format]}`;
        const blob = new Blob([previewContent.textContent], { type: mimeTypes[format] });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        TaskHelpers.showNotification(`${filename} をダウンロードしました`, 'success');
    }

    static copyToClipboard() {
        const previewContent = document.getElementById('export-preview-content');
        if (!previewContent) return;

        navigator.clipboard.writeText(previewContent.textContent).then(() => {
            TaskHelpers.showNotification('クリップボードにコピーしました', 'success');
        }).catch(() => {
            TaskHelpers.showNotification('コピーに失敗しました', 'error');
        });
    }

    // インポート関連
    static showTextImport() {
        const inputArea = document.getElementById('import-input-area');
        inputArea.innerHTML = `
            <div class="form-group">
                <label class="form-label">Markdownテキストを貼り付け</label>
                <textarea class="form-textarea" id="import-text-area" rows="10" 
                          placeholder="Markdownテキストをここに貼り付けてください..."></textarea>
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <button class="btn btn-primary" onclick="MarkdownExport.previewImport()">
                    👁 プレビュー
                </button>
            </div>
        `;
    }

    static showFileImport() {
        const inputArea = document.getElementById('import-input-area');
        inputArea.innerHTML = `
            <div class="form-group">
                <label class="form-label">ファイル選択</label>
                <input type="file" class="form-input" id="import-file-input" 
                       accept=".md,.txt,.json" onchange="MarkdownExport.handleFileSelect()">
            </div>
            <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center; color: #7f8c8d;">
                .md, .txt, .json ファイルに対応しています
            </div>
        `;
    }

    static handleFileSelect() {
        const fileInput = document.getElementById('import-file-input');
        const file = fileInput.files[0];
        
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            document.getElementById('import-text-area')?.remove();
            
            const inputArea = document.getElementById('import-input-area');
            inputArea.innerHTML += `
                <div class="form-group">
                    <label class="form-label">ファイル内容</label>
                    <textarea class="form-textarea" id="import-text-area" rows="10" readonly>${content}</textarea>
                </div>
                <div style="text-align: center; margin-top: 15px;">
                    <button class="btn btn-primary" onclick="MarkdownExport.previewImport()">
                        👁 プレビュー
                    </button>
                </div>
            `;
        };
        
        reader.readAsText(file);
    }

    static previewImport() {
        const textArea = document.getElementById('import-text-area');
        if (!textArea || !textArea.value.trim()) {
            TaskHelpers.showNotification('インポートするテキストを入力してください', 'warning');
            return;
        }

        try {
            const content = textArea.value.trim();
            let parsedTasks = [];

            // JSON形式を試す
            if (content.startsWith('{') || content.startsWith('[')) {
                parsedTasks = this.parseJSON(content);
            } else {
                // Markdown形式として解析
                parsedTasks = this.parseMarkdown(content);
            }

            if (parsedTasks.length === 0) {
                TaskHelpers.showNotification('インポート可能なタスクが見つかりませんでした', 'warning');
                return;
            }

            this.showImportPreview(parsedTasks);

        } catch (error) {
            console.error('Import preview failed:', error);
            TaskHelpers.showNotification('インポートデータの解析に失敗しました', 'error');
        }
    }

    static parseJSON(content) {
        try {
            const data = JSON.parse(content);
            
            // エクスポートしたJSON形式
            if (data.tasks && Array.isArray(data.tasks)) {
                return data.tasks.map(task => ({
                    title: task.title,
                    description: task.description || null,
                    status: task.status || 'pending',
                    priority: task.priority || 3,
                    category: task.category || null,
                    due_date: task.dueDate || null,
                    is_today: task.isToday || false,
                    is_interruption: task.isInterruption || false
                }));
            }
            
            // 単純な配列形式
            if (Array.isArray(data)) {
                return data.map(task => ({
                    title: task.title || task.name || 'タイトルなし',
                    description: task.description || null,
                    status: task.status || 'pending',
                    priority: task.priority || 3,
                    category: task.category || null,
                    due_date: task.due_date || task.dueDate || null,
                    is_today: task.is_today || task.isToday || false,
                    is_interruption: task.is_interruption || task.isInterruption || false
                }));
            }

            return [];
        } catch (error) {
            console.error('JSON parse failed:', error);
            return [];
        }
    }

    static parseMarkdown(content) {
        const lines = content.split('\n');
        const tasks = [];
        let currentCategory = null;
        let currentStatus = 'pending';

        lines.forEach(line => {
            line = line.trim();
            
            // セクションヘッダー検出
            const headerMatch = line.match(/^##\s*(.+)$/);
            if (headerMatch) {
                const header = headerMatch[1].toLowerCase();
                if (header.includes('完了') || header.includes('done')) {
                    currentStatus = 'completed';
                } else if (header.includes('進行') || header.includes('progress')) {
                    currentStatus = 'in_progress';
                } else if (header.includes('キャンセル') || header.includes('cancel')) {
                    currentStatus = 'cancelled';
                } else {
                    currentStatus = 'pending';
                    currentCategory = headerMatch[1];
                }
                return;
            }

            // タスク行検出
            const taskMatch = line.match(/^-\s*\[([ x])\]\s*(.+)$/i);
            if (taskMatch) {
                const isCompleted = taskMatch[1].toLowerCase() === 'x';
                let title = taskMatch[2];
                
                // カテゴリ抽出 [カテゴリ]
                const categoryMatch = title.match(/\[([^\]]+)\]/);
                let category = categoryMatch ? categoryMatch[1] : currentCategory;
                if (categoryMatch) {
                    title = title.replace(categoryMatch[0], '').trim();
                }
                
                // 期限抽出 (期限: 日付)
                const dueDateMatch = title.match(/\(期限:\s*([^)]+)\)/);
                let dueDate = null;
                if (dueDateMatch) {
                    dueDate = new Date(dueDateMatch[1]).toISOString();
                    title = title.replace(dueDateMatch[0], '').trim();
                }
                
                // 優先度抽出
                let priority = 3;
                const priorityMatch = title.match(/優先度:\s*(\d+|最高|高|普通|低|最低)/);
                if (priorityMatch) {
                    const p = priorityMatch[1];
                    if (p === '最高') priority = 5;
                    else if (p === '高') priority = 4;
                    else if (p === '普通') priority = 3;
                    else if (p === '低') priority = 2;
                    else if (p === '最低') priority = 1;
                    else priority = parseInt(p) || 3;
                    
                    title = title.replace(priorityMatch[0], '').trim();
                }

                // **太字**除去
                title = title.replace(/^\*\*(.+)\*\*$/, '$1');
                
                // タグ検出
                let isToday = false;
                let isInterruption = false;
                const tagMatch = title.match(/\[([^\]]+)\]$/);
                if (tagMatch) {
                    const tags = tagMatch[1].toLowerCase();
                    isToday = tags.includes('today');
                    isInterruption = tags.includes('割り込み') || tags.includes('interruption');
                    title = title.replace(tagMatch[0], '').trim();
                }

                tasks.push({
                    title: title.trim(),
                    description: null,
                    status: isCompleted ? 'completed' : currentStatus,
                    priority,
                    category,
                    due_date: dueDate,
                    is_today: isToday,
                    is_interruption: isInterruption
                });
            }
        });

        return tasks;
    }

    static showImportPreview(tasks) {
        const previewContainer = document.getElementById('import-preview');
        const previewContent = document.getElementById('import-preview-content');
        
        if (!previewContainer || !previewContent) return;

        let html = `
            <div style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px;">
                <strong>インポート予定: ${tasks.length}個のタスク</strong>
            </div>
            <div class="task-list">
        `;

        tasks.forEach((task, index) => {
            const priority = TaskHelpers.formatPriority(task.priority);
            const status = TaskHelpers.formatStatus(task.status);
            const categoryIcon = TaskHelpers.getCategoryIcon(task.category);

            html += `
                <div class="task-item" style="margin-bottom: 10px; opacity: 0.8;">
                    <div class="task-header">
                        <h4 class="task-title">
                            ${categoryIcon} ${TaskHelpers.escapeHtml(task.title)}
                        </h4>
                    </div>
                    ${task.description ? `
                        <div class="task-description">
                            ${TaskHelpers.escapeHtml(task.description)}
                        </div>
                    ` : ''}
                    <div class="task-meta">
                        <span class="task-priority ${priority.class}">${priority.text}</span>
                        <span class="task-status ${status.class}">${status.text}</span>
                        ${task.category ? `<span class="task-category">${task.category}</span>` : ''}
                        ${task.due_date ? `<span class="task-due-date">${TaskHelpers.formatDate(task.due_date)}</span>` : ''}
                        ${task.is_today ? '<span class="task-tag">📅 Today</span>' : ''}
                        ${task.is_interruption ? '<span class="task-tag">⚡ 割り込み</span>' : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        previewContent.innerHTML = html;
        previewContainer.style.display = 'block';

        // インポート用にタスクデータを保存
        this.pendingImportTasks = tasks;
    }

    static async executeImport() {
        if (!this.pendingImportTasks || this.pendingImportTasks.length === 0) {
            TaskHelpers.showNotification('インポートするタスクがありません', 'warning');
            return;
        }

        const confirmed = await TaskHelpers.confirm(
            `${this.pendingImportTasks.length}個のタスクをインポートしますか？`,
            'タスクインポート'
        );

        if (!confirmed) return;

        try {
            const results = [];
            for (const taskData of this.pendingImportTasks) {
                const result = await taskAPI.createTask(taskData);
                results.push(result[0]);
            }

            await taskManager.loadAllTasks();
            taskManager.renderAllViews();
            
            TaskHelpers.showNotification(
                `${results.length}個のタスクをインポートしました`, 
                'success'
            );

            this.closeModal();

        } catch (error) {
            console.error('Import execution failed:', error);
            TaskHelpers.showNotification('インポートに失敗しました', 'error');
        }
    }

    static cancelImport() {
        this.pendingImportTasks = null;
        document.getElementById('import-preview').style.display = 'none';
    }

    static closeModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
        this.pendingImportTasks = null;
    }
}

// 自動初期化
document.addEventListener('DOMContentLoaded', () => {
    MarkdownExport.initialize();
});

window.MarkdownExport = MarkdownExport;
