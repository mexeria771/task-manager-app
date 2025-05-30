import React, { useState, useRef } from 'react';
import supabase from '../../services/supabaseClient';
import './Task.css';

function InterruptionTasks({ interruptions, refreshInterruptions }) {
  const [showInterruptions, setShowInterruptions] = useState(false);
  const [newInterruption, setNewInterruption] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // 割り込みタスク追加
  const handleAddInterruption = async () => {
    if (!newInterruption.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('interruption_tasks')
        .insert([{
          title: newInterruption.trim(),
          status: false
        }]);

      if (error) throw error;

      setNewInterruption('');
      refreshInterruptions();
      
      // フォーカスを戻す
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('割り込みタスク追加エラー:', err);
      alert(`割り込みタスク追加エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 割り込みタスクの完了切り替え
  const handleStatusChange = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('interruption_tasks')
        .update({ status: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      refreshInterruptions();
    } catch (err) {
      console.error('割り込みタスク更新エラー:', err);
    }
  };

  // 割り込みタスク削除
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('interruption_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      refreshInterruptions();
    } catch (err) {
      console.error('割り込みタスク削除エラー:', err);
    }
  };

  const activeInterruptions = interruptions.filter(i => !i.status);
  const completedInterruptions = interruptions.filter(i => i.status);

  return (
    <div className="interruption-tasks">
      <div className="interruption-header">
        <button
          onClick={() => setShowInterruptions(!showInterruptions)}
          className="interruption-toggle"
        >
          <span className="interruption-icon">⚡</span>
          <span>割り込みタスク ({activeInterruptions.length})</span>
          <span className="toggle-indicator">{showInterruptions ? '▼' : '▶'}</span>
        </button>
      </div>

      {showInterruptions && (
        <div className="interruption-container">
          {/* 割り込みタスク追加 */}
          <div className="interruption-input-section">
            <input
              ref={inputRef}
              type="text"
              value={newInterruption}
              onChange={(e) => setNewInterruption(e.target.value)}
              placeholder="電話、メールなど簡単なタスク..."
              className="interruption-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddInterruption();
                }
              }}
              disabled={loading}
            />
            <button
              onClick={handleAddInterruption}
              disabled={!newInterruption.trim() || loading}
              className="interruption-add-btn"
            >
              {loading ? '...' : '追加'}
            </button>
          </div>

          {/* 未完了の割り込みタスク */}
          {activeInterruptions.length > 0 && (
            <div className="interruption-list">
              {activeInterruptions.map((interruption) => (
                <div key={interruption.id} className="interruption-item">
                  <button
                    className="interruption-checkbox"
                    onClick={() => handleStatusChange(interruption.id, interruption.status)}
                    title="完了にする"
                  >
                    ○
                  </button>
                  <span className="interruption-title">
                    {interruption.title}
                  </span>
                  <button
                    className="interruption-delete-btn"
                    onClick={() => handleDelete(interruption.id)}
                    title="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 完了済みの割り込みタスク */}
          {completedInterruptions.length > 0 && (
            <div className="interruption-completed">
              <h5 className="interruption-completed-title">
                完了済み ({completedInterruptions.length})
              </h5>
              <div className="interruption-completed-list">
                {completedInterruptions.slice(0, 5).map((interruption) => (
                  <div key={interruption.id} className="interruption-item completed">
                    <span className="interruption-completed-icon">✓</span>
                    <span className="interruption-title completed">
                      {interruption.title}
                    </span>
                    <button
                      className="interruption-delete-btn"
                      onClick={() => handleDelete(interruption.id)}
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {completedInterruptions.length > 5 && (
                  <div className="interruption-more">
                    +{completedInterruptions.length - 5} 個の完了済み
                  </div>
                )}
              </div>
            </div>
          )}

          {activeInterruptions.length === 0 && completedInterruptions.length === 0 && (
            <div className="interruption-empty">
              <p>📞 電話やメールなどの簡単なタスクを記録しましょう</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InterruptionTasks;