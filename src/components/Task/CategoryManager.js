import React, { useState } from 'react';
import supabase from '../../services/supabaseClient';
import './Task.css';

function CategoryManager({ categories, onCategoriesChange }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  // 定義済みの色選択肢
  const colorOptions = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6b7280'  // gray
  ];

  // 新しいカテゴリを追加
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: newCategoryName.trim(),
          color: newCategoryColor
        }]);

      if (error) throw error;

      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
      onCategoriesChange();
    } catch (err) {
      console.error('カテゴリ追加エラー:', err);
      alert(`カテゴリ追加エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // カテゴリを更新
  const handleUpdateCategory = async (categoryId, updatedData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update(updatedData)
        .eq('id', categoryId);

      if (error) throw error;

      setEditingCategory(null);
      onCategoriesChange();
    } catch (err) {
      console.error('カテゴリ更新エラー:', err);
      alert(`カテゴリ更新エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // カテゴリを削除
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('このカテゴリを削除してもよろしいですか？関連するタスクのカテゴリは「なし」になります。')) {
      return;
    }

    setLoading(true);
    try {
      // まず関連するタスクのカテゴリをnullに設定
      await supabase
        .from('tasks')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      // カテゴリを削除
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      onCategoriesChange();
    } catch (err) {
      console.error('カテゴリ削除エラー:', err);
      alert(`カテゴリ削除エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-manager">
      <h4 className="category-manager-title">カテゴリ管理</h4>
      
      {/* 新しいカテゴリ追加 */}
      <div className="add-category-section">
        <div className="add-category-form">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="新しいカテゴリ名"
            className="category-name-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddCategory();
              }
            }}
          />
          
          <div className="color-picker">
            {colorOptions.map((color) => (
              <button
                key={color}
                className={`color-option ${newCategoryColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setNewCategoryColor(color)}
                title={color}
              />
            ))}
          </div>
          
          <button
            onClick={handleAddCategory}
            disabled={!newCategoryName.trim() || loading}
            className="add-category-btn"
          >
            {loading ? '追加中...' : '追加'}
          </button>
        </div>
      </div>

      {/* 既存カテゴリ一覧 */}
      <div className="categories-list">
        {categories.length === 0 ? (
          <p className="no-categories">カテゴリはまだありません</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="category-item">
              {editingCategory === category.id ? (
                <CategoryEditForm
                  category={category}
                  colorOptions={colorOptions}
                  onSave={(updatedData) => handleUpdateCategory(category.id, updatedData)}
                  onCancel={() => setEditingCategory(null)}
                  loading={loading}
                />
              ) : (
                <CategoryDisplay
                  category={category}
                  onEdit={() => setEditingCategory(category.id)}
                  onDelete={() => handleDeleteCategory(category.id)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// カテゴリ表示コンポーネント
function CategoryDisplay({ category, onEdit, onDelete }) {
  return (
    <div className="category-display">
      <div className="category-info">
        <div
          className="category-color-indicator"
          style={{ backgroundColor: category.color }}
        />
        <span className="category-name">{category.name}</span>
      </div>
      
      <div className="category-actions">
        <button
          onClick={onEdit}
          className="category-action-btn edit"
          title="編集"
        >
          編集
        </button>
        <button
          onClick={onDelete}
          className="category-action-btn delete"
          title="削除"
        >
          削除
        </button>
      </div>
    </div>
  );
}

// カテゴリ編集フォームコンポーネント
function CategoryEditForm({ category, colorOptions, onSave, onCancel, loading }) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  return (
    <div className="category-edit-form">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="category-name-input"
        autoFocus
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSave();
          }
        }}
      />
      
      <div className="color-picker">
        {colorOptions.map((colorOption) => (
          <button
            key={colorOption}
            className={`color-option ${color === colorOption ? 'selected' : ''}`}
            style={{ backgroundColor: colorOption }}
            onClick={() => setColor(colorOption)}
            title={colorOption}
          />
        ))}
      </div>
      
      <div className="edit-actions">
        <button
          onClick={onCancel}
          className="category-action-btn cancel"
          disabled={loading}
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          className="category-action-btn save"
          disabled={!name.trim() || loading}
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

export default CategoryManager;