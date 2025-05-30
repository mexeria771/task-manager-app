import React, { useState } from 'react';
import TaskItem from './TaskItem';
import QuickTaskInput from './QuickTaskInput';
import CategoryManager from './CategoryManager';
import supabase from '../../services/supabaseClient';
import './Task.css';

function TaskList({ tasks, categories, loading, refreshTasks }) {
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // タスクを優先度でソート（実行中 > 未完了 > 完了）
  const sortTasks = (tasks) => {
    return [...tasks].sort((a, b) => {
      // 実行中タスクを最上位に
      if (a.is_executing !== b.is_executing) {
        return a.is_executing ? -1 : 1;
      }
      
      // 完了済みは下に
      if (a.status !== b.status) {
        return a.status ? 1 : -1;
      }
      
      // カスタム順序があればそれを使用、なければ作成日順
      if (a.custom_order !== null && b.custom_order !== null) {
        return a.custom_order - b.custom_order;
      }
      
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  const sortedTasks = sortTasks(tasks);
  const activeTasks = sortedTasks.filter(task => !task.status);
  const completedTasks = sortedTasks.filter(task => task.status);
  const executingTasks = sortedTasks.filter(task => task.is_executing);

  // ドラッグ&ドロップ処理
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    try {
      // 未完了タスクのみを対象とする
      const activeTasksList = activeTasks;
      const draggedTask = activeTasksList[draggedIndex];
      
      // 新しい順序を計算
      const newOrder = [...activeTasksList];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(dropIndex, 0, draggedTask);

      // データベースで順序を更新
      const updatePromises = newOrder.map(async (task, index) => {
        return supabase
          .from('tasks')
          .update({ custom_order: index })
          .eq('id', task.id);
      });

      await Promise.all(updatePromises);
      
      refreshTasks();
    } catch (err) {
      console.error('順序変更エラー:', err);
    } finally {
      setDraggedIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="task-container">
        <QuickTaskInput categories={categories} onTaskAdded={refreshTasks} />
        <div className="task-loading">
          <div className="loading-spinner">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-container">
      {/* クイック入力エリア */}
      <QuickTaskInput categories={categories} onTaskAdded={refreshTasks} />
      
      {/* カテゴリ管理 */}
      <div className="category-management">
        <button
          onClick={() => setShowCategoryManager(!showCategoryManager)}
          className="category-manager-toggle"
        >
          {showCategoryManager ? 'カテゴリを隠す' : 'カテゴリを管理'}
        </button>
        
        {showCategoryManager && (
          <CategoryManager 
            categories={categories} 
            onCategoriesChange={refreshTasks}
          />
        )}
      </div>
      
      {/* 統計 */}
      <div className="dashboard-stats">
        <div className="stats-grid">
          <div className="stat-card executing">
            <div className="stat-content">
              <div className="stat-number">{executingTasks.length}</div>
              <div className="stat-label">実行中</div>
            </div>
          </div>
          
          <div className="stat-card total">
            <div className="stat-content">
              <div className="stat-number">{activeTasks.length}</div>
              <div className="stat-label">未完了</div>
            </div>
          </div>
          
          <div className="stat-card completed">
            <div className="stat-content">
              <div className="stat-number">{completedTasks.length}</div>
              <div className="stat-label">完了</div>
            </div>
          </div>
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <h3>最初のタスクを追加してみましょう</h3>
            <p>上の入力欄に何でも書いてEnterを押すだけ</p>
          </div>
        ) : (
          <>
            {/* 実行中タスク */}
            {executingTasks.length > 0 && (
              <div className="task-section executing-section">
                <h3 className="section-title executing-title">
                  🎯 実行中 ({executingTasks.length})
                </h3>
                <div className="task-grid">
                  {executingTasks.map((task, index) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      categories={categories}
                      refreshTasks={refreshTasks}
                      index={index}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 未完了タスク */}
            {activeTasks.filter(t => !t.is_executing).length > 0 && (
              <div className="task-section">
                <h3 className="section-title">
                  📋 やること ({activeTasks.filter(t => !t.is_executing).length})
                </h3>
                <div className="task-grid sortable">
                  {activeTasks
                    .filter(t => !t.is_executing)
                    .map((task, index) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        categories={categories}
                        refreshTasks={refreshTasks}
                        index={index}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      />
                    ))}
                </div>
                <div className="drag-hint">
                  💡 ドラッグしてタスクの順序を変更できます
                </div>
              </div>
            )}

            {/* 完了済みタスク */}
            {completedTasks.length > 0 && (
              <div className="task-section">
                <div className="section-header">
                  <h3 className="section-title completed-title">
                    ✅ 完了済み ({completedTasks.length})
                  </h3>
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="toggle-completed-btn"
                  >
                    {showCompleted ? '隠す' : '表示'}
                  </button>
                </div>
                
                {showCompleted && (
                  <div className="task-grid completed-grid">
                    {completedTasks.slice(0, 10).map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        categories={categories}
                        refreshTasks={refreshTasks}
                        isCompleted={true}
                      />
                    ))}
                    {completedTasks.length > 10 && (
                      <div className="more-completed">
                        +{completedTasks.length - 10} 個の完了済みタスク
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TaskList;