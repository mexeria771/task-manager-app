import React, { useState } from 'react';
import TaskItem from './TaskItem';
import QuickTaskInput from './QuickTaskInput';
import CategoryManager from './CategoryManager';
import './Task.css';

function TaskList({ tasks, categories, loading, refreshTasks }) {
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // タスクを完了状態でソート
  const sortTasks = (tasks) => {
    return [...tasks].sort((a, b) => {
      // 完了済みは下に
      if (a.status !== b.status) {
        return a.status ? 1 : -1;
      }
      
      // 最後に作成日順
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  const sortedTasks = sortTasks(tasks);
  const activeTasks = sortedTasks.filter(task => !task.status);
  const completedTasks = sortedTasks.filter(task => task.status);

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
            {/* 未完了タスク */}
            {activeTasks.length > 0 && (
              <div className="task-section">
                <h3 className="section-title">
                  やること ({activeTasks.length})
                </h3>
                <div className="task-grid">
                  {activeTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      categories={categories}
                      refreshTasks={refreshTasks}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 完了済みタスク */}
            {completedTasks.length > 0 && (
              <div className="task-section">
                <div className="section-header">
                  <h3 className="section-title completed-title">
                    完了済み ({completedTasks.length})
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