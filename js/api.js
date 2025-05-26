// Supabase API連携モジュール
class SupabaseAPI {
    constructor() {
        this.supabaseUrl = 'https://rsxsydqnoxvzhbeilvat.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeHN5ZHFub3h2emhiZWlsdmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxOTAxOTksImV4cCI6MjA2MTc2NjE5OX0.kJVtGn0ooXrAjq-608wqNnbLxdeL9LY4gscPp3FlV_E';
        this.userId = this.getUserId();
    }

    // ユーザーID生成・取得
    getUserId() {
        let userId = localStorage.getItem('taskManagerUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('taskManagerUserId', userId);
        }
        return userId;
    }

    // HTTP リクエストヘルパー
    async request(endpoint, options = {}) {
        const url = `${this.supabaseUrl}/rest/v1/${endpoint}`;
        const config = {
            headers: {
                'apikey': this.supabaseKey,
                'Authorization': `Bearer ${this.supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // === ADHD Tasks API ===
    
    // タスク一覧取得
    async getTasks(filters = {}) {
        let query = `adhd_tasks?select=*&order=created_at.desc`;
        
        if (filters.is_today) query += `&is_today=eq.true`;
        if (filters.is_interruption) query += `&is_interruption=eq.true`;
        if (filters.is_focused) query += `&is_focused=eq.true`;
        if (filters.status) query += `&status=eq.${filters.status}`;
        if (filters.category) query += `&category=eq.${filters.category}`;
        
        return await this.request(query);
    }

    // タスク作成
    async createTask(taskData) {
        const task = {
            title: taskData.title,
            description: taskData.description || null,
            status: taskData.status || 'pending',
            priority: taskData.priority || 3,
            category: taskData.category || null,
            due_date: taskData.due_date || null,
            is_today: taskData.is_today || false,
            is_interruption: taskData.is_interruption || false,
            is_focused: taskData.is_focused || false,
            parent_task_id: taskData.parent_task_id || null
        };

        return await this.request('adhd_tasks', {
            method: 'POST',
            body: JSON.stringify(task)
        });
    }

    // タスク更新
    async updateTask(taskId, updates) {
        updates.updated_at = new Date().toISOString();
        
        return await this.request(`adhd_tasks?id=eq.${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    }

    // タスク削除
    async deleteTask(taskId) {
        return await this.request(`adhd_tasks?id=eq.${taskId}`, {
            method: 'DELETE'
        });
    }

    // 特定タスク取得
    async getTask(taskId) {
        const result = await this.request(`adhd_tasks?id=eq.${taskId}`);
        return result[0] || null;
    }

    // === Today Tasks ===
    
    // 今日のタスク取得
    async getTodayTasks() {
        return await this.getTasks({ is_today: true, status: 'pending' });
    }

    // タスクをTodayに追加
    async addToToday(taskId) {
        return await this.updateTask(taskId, { is_today: true });
    }

    // タスクをTodayから削除
    async removeFromToday(taskId) {
        return await this.updateTask(taskId, { is_today: false });
    }

    // === Interruption Tasks ===
    
    // 割り込みタスク取得
    async getInterruptionTasks() {
        return await this.getTasks({ is_interruption: true });
    }

    // 割り込みタスク作成
    async createInterruption(title, description = '') {
        return await this.createTask({
            title,
            description,
            is_interruption: true,
            priority: 4 // 割り込みタスクは高優先度
        });
    }

    // 割り込みタスクをメインタスクに昇格
    async promoteInterruption(taskId) {
        return await this.updateTask(taskId, { 
            is_interruption: false,
            priority: 3 // 通常優先度に戻す
        });
    }

    // === Focus Mode ===
    
    // フォーカス中のタスク取得
    async getFocusedTask() {
        const result = await this.getTasks({ is_focused: true });
        return result[0] || null;
    }

    // タスクをフォーカスに設定
    async setFocusTask(taskId) {
        // 既存のフォーカスを解除
        await this.clearFocus();
        
        // 新しいタスクをフォーカスに設定
        return await this.updateTask(taskId, { 
            is_focused: true,
            status: 'in_progress'
        });
    }

    // フォーカス解除
    async clearFocus() {
        const focusedTask = await this.getFocusedTask();
        if (focusedTask) {
            return await this.updateTask(focusedTask.id, { 
                is_focused: false 
            });
        }
    }

    // === Task Status Management ===
    
    // タスク完了
    async completeTask(taskId) {
        return await this.updateTask(taskId, { 
            status: 'completed',
            is_focused: false,
            is_today: false
        });
    }

    // タスク状態変更
    async changeTaskStatus(taskId, status) {
        const updates = { status };
        
        // 完了時は特別処理
        if (status === 'completed') {
            updates.is_focused = false;
            updates.is_today = false;
        }
        
        return await this.updateTask(taskId, updates);
    }

    // === Tags API ===
    
    // タグ一覧取得
    async getTags() {
        return await this.request('adhd_tags?order=name.asc');
    }

    // タグ作成
    async createTag(name, color = '#007bff') {
        return await this.request('adhd_tags', {
            method: 'POST',
            body: JSON.stringify({ name, color })
        });
    }

    // タスクにタグ追加
    async addTagToTask(taskId, tagId) {
        return await this.request('adhd_task_tags', {
            method: 'POST',
            body: JSON.stringify({ task_id: taskId, tag_id: tagId })
        });
    }

    // タスクからタグ削除
    async removeTagFromTask(taskId, tagId) {
        return await this.request(`adhd_task_tags?task_id=eq.${taskId}&tag_id=eq.${tagId}`, {
            method: 'DELETE'
        });
    }

    // タスクのタグ取得
    async getTaskTags(taskId) {
        return await this.request(`adhd_task_tags?select=*,adhd_tags(*)&task_id=eq.${taskId}`);
    }

    // === Search & Filter ===
    
    // タスク検索
    async searchTasks(query) {
        const encodedQuery = encodeURIComponent(`%${query}%`);
        return await this.request(`adhd_tasks?or=(title.ilike.${encodedQuery},description.ilike.${encodedQuery})`);
    }

    // カテゴリ別タスク取得
    async getTasksByCategory(category) {
        return await this.getTasks({ category });
    }

    // 優先度別タスク取得
    async getTasksByPriority(priority) {
        return await this.request(`adhd_tasks?priority=eq.${priority}&order=created_at.desc`);
    }

    // 期限近いタスク取得
    async getUpcomingTasks(days = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        
        return await this.request(`adhd_tasks?due_date=lte.${futureDate.toISOString()}&status=neq.completed&order=due_date.asc`);
    }

    // === Task Notes ===
    
    // タスクノート取得
    async getTaskNotes(taskId) {
        return await this.request(`adhd_task_notes?task_id=eq.${taskId}&order=created_at.desc`);
    }

    // ノート追加
    async addTaskNote(taskId, note) {
        return await this.request('adhd_task_notes', {
            method: 'POST',
            body: JSON.stringify({ task_id: taskId, note })
        });
    }

    // === Statistics ===
    
    // 基本統計取得
    async getTaskStats() {
        const [pending, inProgress, completed] = await Promise.all([
            this.request('adhd_tasks?status=eq.pending&select=count'),
            this.request('adhd_tasks?status=eq.in_progress&select=count'),
            this.request('adhd_tasks?status=eq.completed&select=count')
        ]);

        return {
            pending: pending[0]?.count || 0,
            inProgress: inProgress[0]?.count || 0,
            completed: completed[0]?.count || 0
        };
    }
}

// グローバルAPI インスタンス
window.taskAPI = new SupabaseAPI();
