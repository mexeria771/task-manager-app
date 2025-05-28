import React, { useState } from 'react';
import TaskItem from './TaskItem';
import QuickTaskInput from './QuickTaskInput';
import './Task.css';

function TaskList({ tasks, categories, loading, refreshTasks }) {
  const [showCompleted, setShowCompleted] = useState(true);

  // タスクを優先度と期限でソート
  const sortTasks = (tasks) => {
    return [...tasks].sort((a, b) => {
      // 完了済みは下に
      if (a.status !== b.status) {
        return a.status ? 1 : -1;
      }
      
      // 優先度でソート (高 > 中 > 低)
      const priorityOrder = { '高': 3, '中': 2, '低': 1 };
      const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // 期限でソート
      if (a.due_date && b.due_date) {
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      
      // 最後に作成日順
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  const sortedTasks = sortTasks(tasks);
  const activeTasks = sortedTasks.filter(task => !task.status);
  const completedTasks = sortedTasks.filter(task => task.status);
  const todaysTasks = activeTasks.filter(task => {
    if (!task.due_date) return false;
    const today = new Date().toDateString();
    const taskDate = new Date(task.due_date).toDateString();
    return today === taskDate;
  });

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
      {/* クイック入力エリア - 最優先表示 */}
      <QuickTaskInput categories={categories} onTaskAdded={refreshTasks} />
      
      {/* 統計 */}
      <div className="dashboard-stats">
        <div className="stats-grid">
          <div className="stat-card urgent">
            <div className="stat-content">
              <div className="stat-number">{activeTasks.filter(t => t.priority === '高').length}</div>
              <div className="stat-label">緊急</div>
            </div>
          </div>
          
          <div className="stat-card today">
            <div className="stat-content">
              <div className="stat-number">{todaysTasks.length}</div>
              <div className="stat-label">今日</div>
            </div>
          </div>
          
          <div className="stat-card progress">
            <div className="stat-content">
              <div className="stat-number">
                {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
              </div>
              <div className="stat-label">完了率</div>
            </div>
          </div>
          
          <div className="stat-card total">
            <div className="stat-content">
              <div className="stat-number">{activeTasks.length}</div>
              <div className="stat-label">残り</div>
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
            {/* 今日のタスク */}
            {todaysTasks.length > 0 && (
              <div className="task-section">
                <h3 className="section-title today-title">
                  今日やること ({todaysTasks.length})
                </h3>
                <div className="task-grid">
                  {todaysTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      categories={categories}
                      refreshTasks={refreshTasks}
                      isHighlighted={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 緊急タスク */}
            {activeTasks.filter(t => t.priority === '高' && !todaysTasks.includes(t)).length > 0 && (
              <div className="task-section">
                <h3 className="section-title urgent-title">
                  緊急・重要 ({activeTasks.filter(t => t.priority === '高' && !todaysTasks.includes(t)).length})
                </h3>
                <div className="task-grid">
                  {activeTasks
                    .filter(t => t.priority === '高' && !todaysTasks.includes(t))
                    .map((task) => (
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

            {/* 通常のタスク */}
            {activeTasks.filter(t => t.priority !== '高' && !todaysTasks.includes(t)).length > 0 && (
              <div className="task-section">
                <h3 className="section-title normal-title">
                  その他のタスク ({activeTasks.filter(t => t.priority !== '高' && !todaysTasks.includes(t)).length})
                </h3>
                <div className="task-grid">
                  {activeTasks
                    .filter(t => t.priority !== '高' && !todaysTasks.includes(t))
                    .map((task) => (
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