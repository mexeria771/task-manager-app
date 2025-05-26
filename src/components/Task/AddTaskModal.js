import React, { useState } from 'react';
import supabase from '../../services/supabaseClient';
import './Task.css';

function AddTaskModal({ categories, onClose, onTaskAdded }) {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: '中',
    due_date: '',
    category_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ユーザーIDの取得
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error('ユーザー情報が取得できませんでした');
      }

      // タスクの追加（user_idを明示的に設定）
      const { error: insertError } = await supabase
        .from('tasks')
        .insert([{
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
          category_id: newTask.category_id || null,
          status: false,
          user_id: userData.user.id
        }]);

      if (insertError) throw insertError;

      onTaskAdded();
    } catch (err) {
      console.error('タスクの追加中にエラーが発生しました:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">新しいタスク</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-field">
            <label htmlFor="new-title">
              タイトル
            </label>
            <input
              id="new-title"
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="new-description">
              説明
            </label>
            <textarea
              id="new-description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="new-priority">
                優先度
              </label>
              <select
                id="new-priority"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="高">高</option>
                <option value="中">中</option>
                <option value="低">低</option>
              </select>
            </div>
            
            <div className="form-field">
              <label htmlFor="new-due-date">
                期限日
              </label>
              <input
                id="new-due-date"
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="new-category">
              カテゴリ
            </label>
            <select
              id="new-category"
              value={newTask.category_id}
              onChange={(e) => setNewTask({ ...newTask, category_id: e.target.value })}
            >
              <option value="">カテゴリなし</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={loading}
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;