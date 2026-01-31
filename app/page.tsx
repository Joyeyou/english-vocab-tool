'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, History, Download, Trash2, Users, Plus, X, User, LogIn } from 'lucide-react';
import WordCard from '@/components/WordCard';
import { WordData } from '@/types/word';
import { storageUtils, User as UserType } from '@/lib/utils';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [wordsList, setWordsList] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'favorites'>('search');

  // 用户管理状态
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'初中' | '高中' | '其他'>('其他');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // 初始化用户
  useEffect(() => {
    const users = storageUtils.getUsers();
    setUsers(users);
    const currentUser = storageUtils.getCurrentUser();
    setCurrentUser(currentUser);

    // 如果没有用户或没有当前用户，显示登录弹窗
    if (users.length === 0) {
      setShowLoginModal(true);
    } else if (!currentUser) {
      setShowLoginModal(true);
    }
  }, []);

  // 添加新用户
  const handleAddUser = () => {
    if (!newUserName.trim()) {
      alert('请输入用户名');
      return;
    }
    const newUser = storageUtils.addUser(newUserName, newUserRole);
    setNewUserName('');
    setShowAddUserModal(false);
    setUsers(storageUtils.getUsers());
    // 自动登录新用户
    setSelectedUserId(newUser.id);
  };

  // 登录用户
  const handleLogin = () => {
    if (!selectedUserId) {
      alert('请选择用户');
      return;
    }
    storageUtils.setCurrentUser(selectedUserId);
    setCurrentUser(storageUtils.getCurrentUser());
    setShowLoginModal(false);
    setWordsList([]);
    setActiveTab('search');
  };

  // 删除用户
  const handleDeleteUser = (userId: string) => {
    if (users.length <= 1) {
      alert('至少需要一个用户');
      return;
    }
    if (confirm('确定要删除该用户及其所有数据吗？')) {
      storageUtils.deleteUser(userId);
      const updatedUsers = storageUtils.getUsers();
      setUsers(updatedUsers);

      // 如果删除的是当前选中的用户，清空选择
      if (selectedUserId === userId) {
        setSelectedUserId('');
      }
    }
  };

  // 退出登录
  const handleLogout = () => {
    setShowLoginModal(true);
    setCurrentUser(null);
    setWordsList([]);
    setActiveTab('search');
  };

  // 获取用户徽章颜色
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case '初中': return 'bg-green-100 text-green-700';
      case '高中': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 查询单词
  const handleSearch = async () => {
    if (!inputValue.trim()) return;

    setLoading(true);
    const words = inputValue
      .split(/[\s,，、]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    try {
      const results: WordData[] = [];
      const wordsToFetch: { word: string; index: number }[] = [];

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const cachedData = storageUtils.getCachedWord(word);

        if (cachedData) {
          results.push(cachedData);
        } else {
          wordsToFetch.push({ word, index: i });
          results.push({ word, translations: [], phrases: [], examples: [], synonyms: [] } as WordData);
        }
      }

      setWordsList(results);
      setActiveTab('search');
      setLoading(false);

      if (wordsToFetch.length === 0) return;

      for (const { word, index } of wordsToFetch) {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, skipTranslation: true }),
        });

        if (response.ok) {
          const wordData = await response.json();
          setWordsList((prevList) => {
            const newList = [...prevList];
            newList[index] = wordData;
            return newList;
          });
        }
      }

      for (const { word, index } of wordsToFetch) {
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, skipTranslation: false }),
        })
          .then((response) => response.json())
          .then((translatedData) => {
            setWordsList((prevList) => {
              const newList = [...prevList];
              newList[index] = translatedData;
              return newList;
            });
            storageUtils.saveToHistory(translatedData);
            storageUtils.cacheWord(translatedData);
          });
      }
    } catch (error) {
      console.error('查询失败:', error);
      alert('查询失败，请稍后重试');
      setLoading(false);
    }
  };

  const loadHistory = () => {
    setWordsList(storageUtils.getHistory());
    setActiveTab('history');
  };

  const loadFavorites = () => {
    setWordsList(storageUtils.getFavorites());
    setActiveTab('favorites');
  };

  // 导出PDF
  const exportToPDF = () => {
    if (wordsList.length === 0) {
      alert('没有可导出的内容');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: fixed; left: -9999px; top: 0; width: 800px; height: 0; border: none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      alert('无法创建打印页面');
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>英语单词学习卡片</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4; margin: 8mm; margin-bottom: 15mm; }
          @page :bottom { content: counter(page) " / " counter(pages); font-size: 10px; color: #666; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #1a1a1a;
            padding: 8mm;
          }
          .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 4px; }
          .date { text-align: center; font-size: 10px; color: #666; margin-bottom: 12px; }
          .card {
            display: flex;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 8px;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .card-left {
            width: 26%;
            background: #f8f9fa;
            padding: 8px;
            text-align: center;
            border-right: 1px solid #ddd;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .word { font-size: 16px; font-weight: bold; }
          .phonetic { font-size: 10px; color: #666; margin-top: 2px; }
          .card-right { width: 74%; padding: 6px; }
          .section-title { font-size: 9px; font-weight: bold; color: #555; margin-bottom: 2px; text-transform: uppercase; }
          .translations { font-size: 10px; margin-bottom: 4px; }
          .translations span { margin-right: 8px; }
          .pos { color: #2563eb; font-weight: 600; }
          .phrases { font-size: 10px; }
          .phrases span { margin-right: 8px; }
          .derived { font-size: 10px; }
          .derived span { margin-right: 8px; }
        </style>
      </head>
      <body>
        <div class="title">英语单词学习卡片</div>
        <div class="date">生成时间：${new Date().toLocaleDateString('zh-CN')}</div>
        ${wordsList.map(wordData => `
          <div class="card">
            <div class="card-left">
              <div class="word">${wordData.word}</div>
              ${wordData.phonetic ? `<div class="phonetic">/${wordData.phonetic}/</div>` : ''}
            </div>
            <div class="card-right">
              <div class="section-title">释义</div>
              <div class="translations">
                ${wordData.translations.map(t => `<span><span class="pos">${t.partOfSpeech}</span> ${t.chineseDefinition}</span>`).join('')}
              </div>
              ${wordData.phrases && wordData.phrases.length > 0 ? `
                <div class="section-title">常用搭配</div>
                <div class="phrases">
                  ${wordData.phrases.slice(0, 3).map(p => `<span><b>${p.phrase}</b>${p.translation ? ' (' + p.translation + ')' : ''}</span>`).join('')}
                </div>
              ` : ''}
              ${wordData.derivedWords && wordData.derivedWords.length > 0 ? `
                <div class="section-title">派生词</div>
                <div class="derived">
                  ${wordData.derivedWords.slice(0, 4).map(d => `<span><b>${d.word}</b>${d.partOfSpeech ? ' (' + d.partOfSpeech + ')' : ''}${d.definition ? ' ·' + d.definition : ''}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    };
  };

  const handleClear = () => {
    if (activeTab === 'search') {
      setWordsList([]);
    } else if (activeTab === 'history') {
      if (confirm('确定要清空所有历史记录吗？')) {
        storageUtils.clearHistory();
        setWordsList([]);
      }
    } else if (activeTab === 'favorites') {
      if (confirm('确定要清空所有生词本吗？')) {
        storageUtils.clearFavorites();
        setWordsList([]);
      }
    }
  };

  const addAllToFavorites = () => {
    if (wordsList.length === 0) return;

    let addedCount = 0;
    let existingCount = 0;

    wordsList.forEach(wordData => {
      const isAdded = storageUtils.toggleFavorite(wordData);
      if (isAdded) addedCount++;
      else existingCount++;
    });

    if (addedCount > 0 && existingCount > 0) {
      alert(`已添加 ${addedCount} 个新单词到生词本\n${existingCount} 个单词已在生词本中`);
    } else if (addedCount > 0) {
      alert(`已添加 ${addedCount} 个单词到生词本`);
    } else {
      alert('所有单词都已在生词本中');
    }

    if (activeTab === 'favorites') loadFavorites();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">英语单词学习工具</h1>
            </div>

            {/* 用户信息 */}
            {currentUser && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-800">{currentUser.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(currentUser.role)}`}>
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  切换用户
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容区 */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* 搜索区域 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 no-print">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入单词，多个单词用空格或逗号分隔..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center gap-2 font-medium"
            >
              <Search className="w-5 h-5" />
              {loading ? '查询中...' : '查询'}
            </button>
          </div>
        </div>

        {/* 标签页和操作按钮 */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 no-print">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              查询结果
            </button>
            <button
              onClick={loadHistory}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              历史记录
            </button>
            <button
              onClick={loadFavorites}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              生词本
            </button>
          </div>

          {wordsList.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出PDF
              </button>
              <button
                onClick={addAllToFavorites}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                全部添加
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </button>
            </div>
          )}
        </div>

        {/* 单词卡片列表 */}
        <div className="print-container">
          {wordsList.length === 0 ? (
            <div className="text-center py-16 text-gray-500 no-print">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">
                {activeTab === 'search' && '输入单词开始查询'}
                {activeTab === 'history' && '暂无历史记录'}
                {activeTab === 'favorites' && '暂无收藏的单词'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {wordsList.map((wordData, index) => (
                <WordCard
                  key={`${wordData.word}-${index}`}
                  wordData={wordData}
                  onFavoriteChange={() => {
                    if (activeTab === 'favorites') loadFavorites();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 登录弹窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* 弹窗头部 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3" />
              <h2 className="text-2xl font-bold">英语单词学习工具</h2>
              <p className="text-white/80 text-sm mt-1">请选择用户登录</p>
            </div>

            <div className="p-6">
              {/* 用户列表 */}
              {users.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">已添加的用户</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedUserId === user.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedUserId === user.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{user.name}</div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                        {selectedUserId === user.id && (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 按钮组 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowAddUserModal(true);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  添加新用户
                </button>
                <button
                  onClick={handleLogin}
                  disabled={users.length > 0 && !selectedUserId}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-5 h-5" />
                  登录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加用户弹窗 */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">添加新用户</h3>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setShowLoginModal(true);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="如：老大、初一(1)班"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年级
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['初中', '高中', '其他'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setNewUserRole(role)}
                      className={`py-3 rounded-lg border font-medium transition-all ${
                        newUserRole === role
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddUser}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                添加并登录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                冲刺2027春考英语 135+
              </p>
              <p className="text-sm text-gray-500 mt-1">坚持每天学习，梦想终会实现！</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600">
                版本 <span className="font-mono font-semibold text-blue-600">v2.0.0</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">多用户支持 - 数据隔离 - 智能词性搭配 - 7天缓存</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
