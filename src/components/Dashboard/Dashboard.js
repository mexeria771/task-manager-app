import React, { useState, useEffect } from 'react';
import TaskList from '../Task/TaskList';
import AddTaskModal from '../Task/AddTaskModal';
import AddCategoryModal from '../Category/AddCategoryModal';
import supabase from '../../services/supabaseClient';
import './Dashboard.css';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, completed, upcoming
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // タスクとカテゴリを取得
  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, []);

  async function fetchTasks() {
    setLoading(true);

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        categories(id, name, color)
      `)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('タスクの取得中にエラーが発生しました:', error);
    } else {
      setTasks(data || []);
    }

    setLoading(false);
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('カテゴリの取得中にエラーが発生しました:', error);
    } else {
      setCategories(data || []);
    }
  }

  // タスクのフィルタリング
  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return task.status;
    if (activeTab === 'upcoming') {
      return !task.status && task.due_date && new Date(task.due_date) >= new Date();
    }
    return true;
  });



  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">タスク管理アプリ</h1>
      </header>

      <div className="dashboard-controls">
        <div className="tab-controls">
          <button
            onClick={() => setActiveTab('all')}
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          >
            すべて
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          >
            完了済み
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
          >
            予定
          </button>
        </div>
        <div className="action-controls">
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="category-button"
          >
            カテゴリ追加
          </button>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="task-button"
          >
            タスク追加
          </button>
        </div>
      </div>

      <TaskList
        tasks={filteredTasks}
        categories={categories}
        loading={loading}
        refreshTasks={fetchTasks}
      />

      {showAddTaskModal && (
        <AddTaskModal
          categories={categories}
          onClose={() => setShowAddTaskModal(false)}
          onTaskAdded={() => {
            fetchTasks();
            setShowAddTaskModal(false);
          }}
        />
      )}

      {showAddCategoryModal && (
        <AddCategoryModal
          onClose={() => setShowAddCategoryModal(false)}
          onCategoryAdded={() => {
            fetchCategories();
            setShowAddCategoryModal(false);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
