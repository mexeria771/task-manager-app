import React, { useState, useEffect } from 'react';
import Auth from './components/Auth/Auth';
import Dashboard from './components/Dashboard/Dashboard';
import supabase from './services/supabaseClient';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-container">読み込み中...</div>;
  }

  return (
    <div className="app-container">
      {!session ? <Auth /> : <Dashboard session={session} />}
    </div>
  );
}

export default App;
