import React, { useState } from 'react';
import supabase from '../../services/supabaseClient';
import './Task.css';

function MarkdownManager({ tasks, categories, onDataChange }) {
  const [showImportExport, setShowImportExport] = useState(false);
  const [markdownText, setMarkdownText] = useState('');
  const [activeTab, setActiveTab] = useState('export'); // export or import
  const [loading, setLoading] = useState(false);

  // タスクをMarkdown形式に変換
  const exportToMarkdown = () => {
    let markdown = '# タスクリスト\n\n';
    
    // カテゴリごとにグループ化
    const tasksByCategory = {};
    
    tasks.forEach(task => {
      const categoryName = task.categories?.name || '未分類';
      if (!tasksByCategory[categoryName]) {
        tasksByCategory[categoryName] = [];
      }
      tasksByCategory[categoryName].push(task);
    });

    Object.keys(tasksByCategory).forEach(categoryName => {
      markdown += `## ${categoryName}\n\n`;
      
      tasksByCategory[categoryName].forEach(task => {
        const checkbox = task.status ? '[x]' : '[ ]';
        const executing = task.is_executing ? ' 🎯' : '';
        markdown += `${checkbox} ${task.title}${executing}\n`;
        
        if (task.description) {
          markdown += `  > ${task.description}\n`;
        }
        
        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks.forEach(subtask => {
            const subCheckbox = subtask.status ? '[x]' : '[ ]';
            markdown += `  - ${subCheckbox} ${subtask.title}\n`;
          });
        }
        
        markdown += '\n';
      });
    });

    setMarkdownText(markdown);
    setActiveTab('export');
  };

  // Markdownからタスクを解析してインポート
  const importFromMarkdown = async () => {
    if (!markdownText.trim()) return;

    setLoading(true);
    try {
      const lines = markdownText.split('\n');
      let currentCategory = null;
      let currentTask = null;
      const tasksToCreate = [];
      const subtasksToCreate = [];

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // カテゴリヘッダー（## カテゴリ名）
        if (trimmedLine.startsWith('## ')) {
          const categoryName = trimmedLine.substring(3).trim();
          currentCategory = categories.find(c => c.name === categoryName);
          
          // カテゴリが存在しない場合は作成
          if (!currentCategory && categoryName !== '未分類') {
            const { data, error } = await supabase
              .from('categories')
              .insert([{ name: categoryName, color: '#6b7280' }])
              .select()
              .single();
            
            if (!error) {
              currentCategory = data;
            }
          }
          continue;
        }

        // メインタスク（- [x] または - [ ]）
        if (trimmedLine.match(/^[\-\*] \[(x| )\]/)) {
          const isCompleted = trimmedLine.includes('[x]');
          const isExecuting = trimmedLine.includes('🎯');
          const title = trimmedLine
            .replace(/^[\-\*] \[(x| )\]/, '')
            .replace('🎯', '')
            .trim();

          currentTask = {
            title,
            status: isCompleted,
            is_executing: isExecuting && !isCompleted,
            category_id: currentCategory?.id || null,
            description: null,
            subtasks: []
          };
          tasksToCreate.push(currentTask);
          continue;
        }

        // 説明（> 説明文）
        if (trimmedLine.startsWith('> ') && currentTask) {
          currentTask.description = trimmedLine.substring(2).trim();
          continue;
        }

        // サブタスク（  - [x] または  - [ ]）
        if (trimmedLine.match(/^  \- \[(x| )\]/)) {
          const isCompleted = trimmedLine.includes('[x]');
          const title = trimmedLine
            .replace(/^  \- \[(x| )\]/, '')
            .trim();

          if (currentTask) {
            currentTask.subtasks.push({
              title,
              status: isCompleted
            });
          }
          continue;
        }
      }

      // データベースにタスクを挿入
      for (const task of tasksToCreate) {
        const subtasks = task.subtasks;
        delete task.subtasks;

        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .insert([task])
          .select()
          .single();

        if (taskError) throw taskError;

        // サブタスクを挿入
        if (subtasks.length > 0) {
          const subtasksWithTaskId = subtasks.map(subtask => ({
            ...subtask,
            task_id: taskData.id
          }));

          const { error: subtaskError } = await supabase
            .from('subtasks')
            .insert(subtasksWithTaskId);

          if (subtaskError) throw subtaskError;
        }
      }

      setMarkdownText('');
      onDataChange();
      alert(`${tasksToCreate.length}個のタスクをインポートしました`);
    } catch (err) {
      console.error('インポートエラー:', err);
      alert(`インポートエラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // クリップボードにコピー
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdownText);
      alert('クリップボードにコピーしました');
    } catch (err) {
      console.error('コピーエラー:', err);
      // フォールバック
      const textArea = document.createElement('textarea');
      textArea.value = markdownText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('クリップボードにコピーしました');
    }
  };

  return (
    <div className="markdown-management">
      <button
        onClick={() => setShowImportExport(!showImportExport)}
        className="markdown-manager-toggle"
      >
        {showImportExport ? 'Markdown機能を隠す' : 'Markdown インポート/エクスポート'}
      </button>
      
      {showImportExport && (
        <div className="markdown-manager">
          <div className="markdown-tabs">
            <button
              onClick={() => {
                setActiveTab('export');
                exportToMarkdown();
              }}
              className={`markdown-tab ${activeTab === 'export' ? 'active' : ''}`}
            >
              エクスポート
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`markdown-tab ${activeTab === 'import' ? 'active' : ''}`}
            >
              インポート
            </button>
          </div>

          <div className="markdown-content">
            {activeTab === 'export' && (
              <div className="export-section">
                <h4>タスクをMarkdown形式でエクスポート</h4>
                <textarea
                  value={markdownText}
                  readOnly
                  className="markdown-textarea"
                  placeholder="エクスポートボタンを押してMarkdownを生成してください"
                  rows="15"
                />
                <div className="export-actions">
                  <button onClick={exportToMarkdown} className="export-btn">
                    エクスポート実行
                  </button>
                  <button 
                    onClick={copyToClipboard} 
                    disabled={!markdownText}
                    className="copy-btn"
                  >
                    クリップボードにコピー
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'import' && (
              <div className="import-section">
                <h4>Markdown形式でタスクをインポート</h4>
                <p className="import-help">
                  以下の形式でタスクを記述してください：<br/>
                  <code>- [ ] タスク名</code> (未完了)<br/>
                  <code>- [x] タスク名</code> (完了)<br/>
                  <code>- [ ] タスク名 🎯</code> (実行中)<br/>
                  <code>&nbsp;&nbsp;- [ ] サブタスク</code> (サブタスク)<br/>
                  <code>&nbsp;&nbsp;&gt; 説明文</code> (説明)
                </p>
                <textarea
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  className="markdown-textarea"
                  placeholder="## カテゴリ名&#10;&#10;- [ ] タスク名&#10;  > 説明文&#10;  - [ ] サブタスク名&#10;&#10;- [x] 完了したタスク&#10;- [ ] 実行中のタスク 🎯"
                  rows="15"
                />
                <div className="import-actions">
                  <button 
                    onClick={importFromMarkdown}
                    disabled={!markdownText.trim() || loading}
                    className="import-btn"
                  >
                    {loading ? 'インポート中...' : 'インポート実行'}
                  </button>
                  <button 
                    onClick={() => setMarkdownText('')}
                    className="clear-btn"
                  >
                    クリア
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MarkdownManager;