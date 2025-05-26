import React, { useState } from 'react';
import supabase from '../../services/supabaseClient';
import './Category.css';

function AddCategoryModal({ onClose, onCategoryAdded }) {
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#000000'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ユーザーIDの取得
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error('ユーザー情報が取得できませんでした');
      }

      // カテゴリの追加（user_idを明示的に設定）
      const { error: insertError } = await supabase
        .from('categories')
        .insert([{
          name: newCategory.name,
          color: newCategory.color,
          user_id: userData.user.id
        }]);

      if (insertError) throw insertError;
      
      onCategoryAdded();
    } catch (err) {
      console.error('カテゴリの追加中にエラーが発生しました:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">新しいカテゴリ</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="category-form">
          <div className="form-field">
            <label htmlFor="category-name">
              カテゴリ名
            </label>
            <input
              id="category-name"
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="category-color">
              カラー
            </label>
            <div className="color-picker">
              <input
                id="category-color"
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              />
              <span className="color-value">{newCategory.color}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={loading}
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCategoryModal;