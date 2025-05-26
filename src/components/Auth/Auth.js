import React, { useState } from 'react';
import supabase from '../../services/supabaseClient';
import './Auth.css';

function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);

  // サインアップ処理
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Supabaseでサインアップ
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // サインアップ後、デモデータを作成するためのSQLを実行
      const { data: userData } = await supabase.auth.getUser();
      if (userData && userData.user) {
        await supabase.rpc('create_demo_categories', { user_uuid: userData.user.id });
        await supabase.rpc('create_demo_tasks', { user_uuid: userData.user.id });
      }
    }

    setLoading(false);
  };

  // サインイン処理
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h1 className="auth-title">
          {isSignUp ? 'アカウント作成' : 'ログイン'}
        </h1>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="auth-form">
          <div className="form-field">
            <label htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="password">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="auth-button"
            disabled={loading}
          >
            {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
          </button>
        </form>

        <div className="auth-switch">
          <button
            className="auth-switch-button"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'すでにアカウントをお持ちの方' : '新規アカウント作成'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
