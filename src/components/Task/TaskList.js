import React from 'react';
import TaskItem from './TaskItem';
import './Task.css';

function TaskList({ tasks, categories, loading, refreshTasks }) {
  if (loading) {
    return <div className="task-loading">読み込み中...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="task-empty">
        <p>タスクがありません</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          categories={categories}
          refreshTasks={refreshTasks}
        />
      ))}
    </div>
  );
}

export default TaskList;
