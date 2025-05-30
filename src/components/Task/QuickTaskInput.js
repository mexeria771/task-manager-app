import React, { useState, useRef, useEffect } from 'react';
import supabase from '../../services/supabaseClient';
import './Task.css';

function QuickTaskInput({ categories, onTaskAdded }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    category_id: ''
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // フォーカス時に展開
  const handleFocus = () => {
    setIsExpanded(true);
  };

  // Enterキーでの素早い追加
  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey && newTask.title.trim()) {
      e.preventDefault();
      await handleQuickAdd();
    }
  };

  // Escapeキーで折りたたみ
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setNewTask({ title: '', category_id: '' });
      inputRef.current?.blur();
    }
  };

  // 素早いタスク追加
  const handleQuickAdd = async () => {
    if (!newTask.title.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: newTask.title.trim(),
          category_id: newTask.category_id || null,
          status: false
        }]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // リセット
      setNewTask({ title: '', category_id: '' });
      setIsExpanded(false);
      onTaskAdded();
      
      // フォーカスを戻す
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('タスクの追加中にエラーが発生しました:', err);
      alert(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 外側クリックで折りたたみ
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.closest('.quick-input-container').contains(event.target)) {
        if (!newTask.title.trim()) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [newTask.title]);

  return (
    <div className={`quick-input-container ${isExpanded ? 'expanded' : ''}`}>
      {/* メイン入力欄 */}
      <div className="main-input-row">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            onFocus={handleFocus}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            placeholder={isExpanded ? "何をしますか？ (Enter で追加)" : "新しいタスクを入力..."}
            className={`quick-input ${loading ? 'loading' : ''}`}
            disabled={loading}
            autoComplete="off"
          />
          {loading && <div className="input-spinner">...</div>}
        </div>
        
        {/* 追加ボタン */}
        {isExpanded && newTask.title.trim() && (
          <button
            onClick={handleQuickAdd}
            disabled={loading}
            className="quick-add-btn main"
            title="追加"
          >
            追加
          </button>
        )}
      </div>

      {/* カテゴリ選択（必要時のみ表示） */}
      {isExpanded && categories.length > 0 && (
        <div className="expanded-options">
          <div className="quick-options-row">
            <div className="quick-option">
              <label>カテゴリ</label>
              <select
                value={newTask.category_id}
                onChange={(e) => setNewTask({ ...newTask, category_id: e.target.value })}
                className="category-select"
              >
                <option value="">なし</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ヒント */}
          <div className="quick-tips">
            <div className="tips-row">
              <span className="tip">Enter で瞬時追加</span>
              <span className="tip">Esc で閉じる</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickTaskInput;