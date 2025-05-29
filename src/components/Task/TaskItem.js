import React, { useState } from 'react';
import supabase from '../../services/supabaseClient';
import './Task.css';

function TaskItem({ task, categories, refreshTasks, isCompleted }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({ ...task });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isQuickEdit, setIsQuickEdit] = useState(false);

  // タスクの完了/未完了切り替え
  const handleStatusChange = async () => {
    try {
      const newStatus = !task.status;
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);
      
      if (updateError) throw updateError;
      
      refreshTasks();
    } catch (err) {
      console.error('タスクの更新中にエラーが発生しました:', err);
      alert(`更新エラー: ${err.message}`);
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
          category_id: editedTask.category_id
        })
        .eq('id', task.id);
      
      if (updateError) throw updateError;
      
      setIsEditing(false);
      refreshTasks();
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
        alert(`削除エラー: ${err.message}`);
      }
    }
  };

  // 素早いタイトル編集
  const handleQuickTitleEdit = async (newTitle) => {
    if (!newTitle.trim() || newTitle === task.title) {
      setIsQuickEdit(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title: newTitle.trim() })
        .eq('id', task.id);
      
      if (error) throw error;
      refreshTasks();
    } catch (err) {
      console.error('タイトル更新エラー:', err);
      alert(`タイトル更新エラー: ${err.message}`);
    }
    setIsQuickEdit(false);
  };

  // 編集モードの表示
  if (isEditing) {
    return (
      <div className="task-item-edit">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="edit-form">
          <div className="form-field">
            <label htmlFor="title">タイトル</label>
            <input
              id="title"
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              placeholder="何をしますか？"
              autoFocus
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="description">説明（任意）</label>
            <textarea
              id="description"
              value={editedTask.description || ''}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              placeholder="詳細情報があれば..."
              rows="3"
            />
          </div>

          <div className="form-field">
            <label htmlFor="category">カテゴリ</label>
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
        </div>

        <div className="edit-actions">
          <button
            onClick={() => setIsEditing(false)}
            className="cancel-btn"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="save-btn"
            disabled={loading || !editedTask.title.trim()}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    );
  }

  // 通常モードの表示
  return (
    <div className={`task-card ${task.status ? 'completed' : ''}`}>
      {/* 左側：完了チェック */}
      <div className="task-left-section">
        <button
          className={`completion-btn ${task.status ? 'completed' : ''}`}
          onClick={handleStatusChange}
          title={task.status ? 'クリックで未完了に戻す' : 'クリックで完了'}
        >
          <div className="completion-icon">
            {task.status ? '✓' : '○'}
          </div>
        </button>
      </div>

      {/* 中央：メインコンテンツ */}
      <div className="task-content">
        <div className="task-header">
          {isQuickEdit ? (
            <input
              type="text"
              defaultValue={task.title}
              autoFocus
              onBlur={(e) => handleQuickTitleEdit(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleQuickTitleEdit(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsQuickEdit(false);
                }
              }}
              className="quick-title-edit"
            />
          ) : (
            <h3 
              className={`task-title ${task.status ? 'completed' : ''}`}
              onClick={() => setIsQuickEdit(true)}
              title="クリックでタイトル編集"
            >
              {task.title}
            </h3>
          )}
        </div>
        
        <div className="task-meta">
          {task.categories && (
            <span 
              className="category-tag"
              style={{ 
                backgroundColor: task.categories.color + '20',
                color: task.categories.color,
                borderColor: task.categories.color + '50'
              }}
            >
              {task.categories.name}
            </span>
          )}
        </div>
        
        {task.description && !task.status && (
          <p className="task-description">
            {task.description}
          </p>
        )}
      </div>

      {/* 右側：アクション */}
      <div className="task-actions">
        <button
          onClick={() => setIsEditing(true)}
          className="action-btn edit-btn"
          title="詳細編集"
        >
          編集
        </button>
        <button
          onClick={handleDelete}
          className="action-btn delete-btn"
          title="削除"
        >
          削除
        </button>
      </div>
    </div>
  );
}

export default TaskItem;