import React, { useState, useEffect, useCallback } from 'react';
import TaskList from '../Task/TaskList';
import supabase from '../../services/supabaseClient';
import './Dashboard.css';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);

  // タスクとカテゴリを取得
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          categories(id, name, color),
          subtasks(id, title, status)
        `)
        .order('custom_order', { ascending: true, nullsLast: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('タスクの取得中にエラーが発生しました:', error);
        setError('タスクの読み込みに失敗しました。データベースの設定を確認してください。');
      } else {
        setTasks(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('予期しないエラー:', err);
      setError('接続エラーが発生しました。インターネット接続を確認してください。');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('カテゴリの取得中にエラーが発生しました:', error);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      console.error('カテゴリ取得エラー:', err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, [fetchTasks, fetchCategories]);

  // タスクのフィルタリング
  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'all':
        return tasks;
      case 'active':
        return tasks.filter(task => !task.status);
      case 'executing':
        return tasks.filter(task => task.is_executing);
      case 'completed':
        return tasks.filter(task => task.status);
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();
  const activeTasks = tasks.filter(task => !task.status);
  const completedTasks = tasks.filter(task => task.status);
  const executingTasks = tasks.filter(task => task.is_executing);

  // タブ切り替えボタン
  const TabButton = ({ tabKey, label, count, isActive, onClick, color = '#6b7280' }) => (
    <button
      onClick={() => onClick(tabKey)}
      className={`tab-button ${isActive ? 'active' : ''}`}
      style={{
        borderColor: isActive ? color : 'transparent',
        color: isActive ? color : '#6b7280'
      }}
    >
      <span className="tab-label">{label}</span>
      <span className="tab-count" style={{ backgroundColor: isActive ? color : '#e5e7eb' }}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="dashboard-container">
      {/* ヘッダー */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="dashboard-title">タスク管理</h1>
          </div>
          
          {/* 時刻表示 */}
          <div className="header-time">
            <div className="current-time">
              {new Date().toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="current-date">
              {new Date().toLocaleDateString('ja-JP', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'short' 
              })}
            </div>
          </div>
        </div>
      </header>

      {/* エラー表示 */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-message">{error}</span>
            <button 
              onClick={() => {
                fetchTasks();
                fetchCategories();
              }}
              className="retry-button"
            >
              再試行
            </button>
          </div>
        </div>
      )}

      {/* タブコントロール */}
      <div className="dashboard-controls">
        <div className="tab-controls">
          <TabButton
            tabKey="all"
            label="すべて"
            count={tasks.length}
            isActive={activeTab === 'all'}
            onClick={setActiveTab}
            color="#374151"
          />
          
          <TabButton
            tabKey="executing"
            label="実行中"
            count={executingTasks.length}
            isActive={activeTab === 'executing'}
            onClick={setActiveTab}
            color="#f59e0b"
          />
          
          <TabButton
            tabKey="active"
            label="未完了"
            count={activeTasks.length}
            isActive={activeTab === 'active'}
            onClick={setActiveTab}
            color="#3b82f6"
          />
          
          <TabButton
            tabKey="completed"
            label="完了"
            count={completedTasks.length}
            isActive={activeTab === 'completed'}
            onClick={setActiveTab}
            color="#10b981"
          />
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className={`main-content ${loading ? 'loading' : ''}`}>
        <TaskList
          tasks={filteredTasks}
          categories={categories}
          loading={loading}
          refreshTasks={fetchTasks}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}

export default Dashboard;