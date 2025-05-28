import React, { useState, useEffect } from 'react';
import TaskList from '../Task/TaskList';
import supabase from '../../services/supabaseClient';
import './Dashboard.css';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);
  const [motivationQuote, setMotivationQuote] = useState('');

  // 励ましメッセージのリスト
  const motivationQuotes = [
    "🌟 小さな一歩が大きな変化を生みます",
    "💪 今日できることから始めましょう",
    "🎯 完璧を目指さず、進歩を大切に",
    "✨ あなたのペースで大丈夫です",
    "🚀 一つずつ片付けていけばOK",
    "🌈 今日も頑張っているあなたが素晴らしい",
    "⭐ 集中力は波があって当然です",
    "🌻 やる気が出ない日もあります、それでOK"
  ];

  // タスクとカテゴリを取得
  useEffect(() => {
    fetchTasks();
    fetchCategories();
    // 励ましメッセージをランダムに選択
    const randomQuote = motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)];
    setMotivationQuote(randomQuote);
  }, []);

  async function fetchTasks() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          categories(id, name, color)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('タスクの取得中にエラーが発生しました:', error);
        setError('タスクの読み込みに失敗しました。ページを更新してください。');
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
  }

  async function fetchCategories() {
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
  }

  // タスクのフィルタリング
  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'all':
        return tasks;
      case 'active':
        return tasks.filter(task => !task.status);
      case 'completed':
        return tasks.filter(task => task.status);
      case 'today':
        return tasks.filter(task => {
          if (!task.due_date) return false;
          const today = new Date().toDateString();
          const taskDate = new Date(task.due_date).toDateString();
          return today === taskDate && !task.status;
        });
      case 'urgent':
        return tasks.filter(task => task.priority === '高' && !task.status);
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();
  const activeTasks = tasks.filter(task => !task.status);
  const completedTasks = tasks.filter(task => task.status);
  const todaysTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const today = new Date().toDateString();
    const taskDate = new Date(task.due_date).toDateString();
    return today === taskDate && !task.status;
  });
  const urgentTasks = tasks.filter(task => task.priority === '高' && !task.status);

  // タブ切り替え時のアニメーション効果
  const TabButton = ({ tabKey, icon, label, count, isActive, onClick, color = '#6b7280' }) => (
    <button
      onClick={() => onClick(tabKey)}
      className={`tab-button ${isActive ? 'active' : ''}`}
      style={{
        borderColor: isActive ? color : 'transparent',
        color: isActive ? color : '#6b7280'
      }}
    >
      <span className="tab-icon">{icon}</span>
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
            <h1 className="dashboard-title">✨ タスク管理</h1>
            <p className="dashboard-subtitle">{motivationQuote}</p>
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
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
            <button 
              onClick={() => {
                fetchTasks();
                fetchCategories();
              }}
              className="retry-button"
            >
              🔄 再試行
            </button>
          </div>
        </div>
      )}

      {/* タブコントロール */}
      <div className="dashboard-controls">
        <div className="tab-controls">
          <TabButton
            tabKey="all"
            icon="📋"
            label="すべて"
            count={tasks.length}
            isActive={activeTab === 'all'}
            onClick={setActiveTab}
            color="#374151"
          />
          
          <TabButton
            tabKey="active"
            icon="⚡"
            label="未完了"
            count={activeTasks.length}
            isActive={activeTab === 'active'}
            onClick={setActiveTab}
            color="#3b82f6"
          />
          
          <TabButton
            tabKey="today"
            icon="📅"
            label="今日"
            count={todaysTasks.length}
            isActive={activeTab === 'today'}
            onClick={setActiveTab}
            color="#f59e0b"
          />
          
          <TabButton
            tabKey="urgent"
            icon="🔥"
            label="緊急"
            count={urgentTasks.length}
            isActive={activeTab === 'urgent'}
            onClick={setActiveTab}
            color="#dc2626"
          />
          
          <TabButton
            tabKey="completed"
            icon="✅"
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

      {/* フッター */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="focus-tip">
            💡 <strong>集中のコツ:</strong> 一度に一つのタスクに集中しましょう
          </div>
          <div className="app-version">
            ADHDフレンドリー設計 v2.0
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;