import React, { useState, useRef } from 'react';
import supabase from '../../services/supabaseClient';
import './Task.css';

function QuickAddTask({ categories, onTaskAdded }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('中');
  const [categoryId, setCategoryId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: title.trim(),
          priority,
          category_id: categoryId || null,
          due_date: dueDate || null,
          status: false
        }]);

      if (error) throw error;

      // リセット
      setTitle('');
      setPriority('中');
      setCategoryId('');
      setDueDate('');
      setShowExtended(false);
      inputRef.current?.focus();
      
      onTaskAdded();
    } catch (error) {
      console.error('タスク追加エラー:', error);
      alert('タスクの追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="quick-add-task">
      <form onSubmit={handleSubmit} className="quick-add-form">
        <div className="quick-add-main">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="新しいタスクを入力... (Enterで追加)"
            className="quick-add-input"
            disabled={isLoading}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowExtended(!showExtended)}
            className="quick-options-toggle"
            title="詳細オプション"
          >
            ⚙️
          </button>
          <button
            type="submit"
            disabled={!title.trim() || isLoading}
            className="quick-add-btn"
          >
            {isLoading ? '⏳' : '追加'}
          </button>
        </div>

        {showExtended && (
          <div className="quick-add-extended">
            <div className="quick-options">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="quick-priority"
              >
                <option value="高">🔴 高</option>
                <option value="中">🟡 中</option>
                <option value="低">🟢 低</option>
              </select>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="quick-category"
              >
                <option value="">📂 カテゴリなし</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    📁 {category.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="quick-date"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default QuickAddTask;