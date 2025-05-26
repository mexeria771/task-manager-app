import React, { useState } from 'react';
import supabase from '../../services/supabaseClient';
import './Task.css';

function TaskItem({ task, categories, refreshTasks }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({ ...task });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // タスクの更新処理
  const handleStatusChange = async () => {
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: !task.status })
        .eq('id', task.id);
      
      if (updateError) throw updateError;
      
      refreshTasks();
    } catch (err) {
      console.error('タスクの更新中にエラーが発生しました:', err);
      alert(`エラー: ${err.message}`);
    }
  };

  // タスクの保存処理
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title: editedTask.title,
          description: editedTask.description,
          priority: editedTask.priority,
          due_date: editedTask.due_date,
          category_id: editedTask.category_id
        })
        .eq('id', task.id);
      
      if (updateError) throw updateError;
      
      setIsEditing(false);
      refreshTasks(); // 最新のカテゴリ名も取得するため再取得
    } catch (err) {
      console.error('タスクの保存中にエラーが発生しました:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // タスクの削除処理
  const handleDelete = async () => {
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      try {
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', task.id);
        
        if (deleteError) throw deleteError;
        
        refreshTasks();
      } catch (err) {
        console.error('タスクの削除中にエラーが発生しました:', err);
        alert(`エラー: ${err.message}`);
      }
    }
  };

  // 優先度に応じた色を取得
  const getPriorityColor = (priority) => {
    switch (priority) {
      case '高': return 'priority-high';
      case '中': return 'priority-medium';
      case '低': return 'priority-low';
      default: return '';
    }
  };

  // 編集モードの表示
  if (isEditing) {
    return (
      <div className="task-item task-edit-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="form-field">
          <label htmlFor="title">
            タイトル
          </label>
          <input
            id="title"
            type="text"
            value={editedTask.title}
            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            required
          />
        </div>
        
        <div className="form-field">
          <label htmlFor="description">
            説明
          </label>
          <textarea
            id="description"
            value={editedTask.description || ''}
            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="priority">
              優先度
            </label>
            <select
              id="priority"
              value={editedTask.priority || '中'}
              onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
            >
              <option value="高">高</option>
              <option value="中">中</option>
              <option value="低">低</option>
            </select>
          </div>
          
          <div className="form-field">
            <label htmlFor="due_date">
              期限日
            </label>
            <input
              id="due_date"
              type="date"
              value={editedTask.due_date || ''}
              onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="category">
            カテゴリ
          </label>
          <select
            id="category"
            value={editedTask.category_id || ''}
            onChange={(e) => setEditedTask({ ...editedTask, category_id: e.target.value })}
          >
            <option value="">カテゴリなし</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="task-edit-actions">
          <button
            onClick={() => setIsEditing(false)}
            className="cancel-button"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="save-button"
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    );
  }

  // 通常モードの表示
  return (
    <div className="task-item">
      <div className="task-check">
        <input
          type="checkbox"
          checked={task.status}
          onChange={handleStatusChange}
        />
      </div>
      <div className="task-content">
        <div className="task-header">
          <h3 className={`task-title ${task.status ? 'completed' : ''}`}>
            {task.title}
          </h3>
          {task.categories && (
            <span
              className="task-category"
              style={{ backgroundColor: task.categories.color }}
            >
              {task.categories.name}
            </span>
          )}
        </div>
        {task.description && (
          <p className={`task-description ${task.status ? 'completed' : ''}`}>
            {task.description}
          </p>
        )}
        <div className="task-meta">
          {task.priority && (
            <span className={`task-priority ${getPriorityColor(task.priority)}`}>
              優先度: {task.priority}
            </span>
          )}
          {task.due_date && (
            <span className="task-due-date">
              期限: {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="task-actions">
        <button
          onClick={() => setIsEditing(true)}
          className="edit-button"
        >
          編集
        </button>
        <button
          onClick={handleDelete}
          className="delete-button"
        >
          削除
        </button>
      </div>
    </div>
  );
}

export default TaskItem;