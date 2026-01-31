import { WordData, SavedWord } from '@/types/word';

// 用户类型
export interface User {
  id: string;
  name: string;
  role: '初中' | '高中' | '其他';
  createdAt: number;
}

// localStorage 工具函数（支持多用户隔离）
export const storageUtils = {
  // ===== 用户管理 =====

  // 获取所有用户
  getUsers(): User[] {
    if (typeof window === 'undefined') return [];
    try {
      const users = localStorage.getItem('vocab_users');
      if (!users) return [];
      return JSON.parse(users);
    } catch {
      return [];
    }
  },

  // 获取当前用户
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const currentUserId = localStorage.getItem('vocab_current_user');
      if (!currentUserId) return null;

      const users = this.getUsers();
      return users.find(u => u.id === currentUserId) || null;
    } catch {
      return null;
    }
  },

  // 设置当前用户
  setCurrentUser(userId: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('vocab_current_user', userId);
  },

  // 添加新用户
  addUser(name: string, role: '初中' | '高中' | '其他' = '其他'): User {
    if (typeof window === 'undefined') return { id: '', name: '', role: '其他', createdAt: 0 };

    const users = this.getUsers();
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      role,
      createdAt: Date.now(),
    };

    users.push(newUser);
    localStorage.setItem('vocab_users', JSON.stringify(users));
    this.setCurrentUser(newUser.id);

    return newUser;
  },

  // 删除用户
  deleteUser(userId: string) {
    if (typeof window === 'undefined') return;
    const users = this.getUsers().filter(u => u.id !== userId);
    localStorage.setItem('vocab_users', JSON.stringify(users));

    // 如果删除的是当前用户，切换到第一个用户
    const currentUserId = localStorage.getItem('vocab_current_user');
    if (currentUserId === userId) {
      if (users.length > 0) {
        this.setCurrentUser(users[0].id);
      } else {
        localStorage.removeItem('vocab_current_user');
      }
    }

    // 清理该用户的数据
    this.clearUserData(userId);
  },

  // 初始化默认用户（如果没有用户）
  initDefaultUser(): User {
    const users = this.getUsers();
    if (users.length > 0) {
      const currentUser = this.getCurrentUser();
      if (currentUser) return currentUser;
      return users[0];
    }

    // 创建默认用户
    return this.addUser('用户1', '其他');
  },

  // ===== 数据存储（带用户隔离）=====

  // 获取当前用户ID
  _getUserId(): string {
    const user = this.getCurrentUser();
    return user ? user.id : 'default';
  },

  // 获取带用户前缀的key
  _getKey(key: string): string {
    const userId = this._getUserId();
    return `${userId}_${key}`;
  },

  // 获取历史记录
  getHistory(): SavedWord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this._getKey('wordHistory'));
      if (!data) return [];

      const parsed = JSON.parse(data);
      // 数据格式清理
      return parsed.map((item: any) => ({
        ...item,
        synonyms: Array.isArray(item.synonyms)
          ? item.synonyms.map((s: any) => typeof s === 'string' ? s : s.word || '')
          : [],
        phrases: Array.isArray(item.phrases)
          ? item.phrases.map((p: any) => ({
              phrase: p.phrase || '',
              translation: p.translation || ''
            }))
          : [],
        examples: Array.isArray(item.examples)
          ? item.examples.map((e: any) => ({
              sentence: e.sentence || '',
              translation: e.translation || ''
            }))
          : [],
        translations: Array.isArray(item.translations)
          ? item.translations
          : []
      }));
    } catch {
      return [];
    }
  },

  // 保存到历史记录
  saveToHistory(wordData: WordData) {
    if (typeof window === 'undefined') return;
    try {
      const history = this.getHistory();
      const savedWord: SavedWord = {
        ...wordData,
        savedAt: Date.now(),
        isFavorite: false,
      };

      const existingIndex = history.findIndex((item) => item.word === wordData.word);
      if (existingIndex >= 0) {
        history[existingIndex] = savedWord;
      } else {
        history.unshift(savedWord);
      }

      const limitedHistory = history.slice(0, 100);
      localStorage.setItem(this._getKey('wordHistory'), JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  },

  // 获取生词本
  getFavorites(): SavedWord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this._getKey('wordFavorites'));
      if (!data) return [];

      const parsed = JSON.parse(data);
      return parsed.map((item: any) => ({
        ...item,
        synonyms: Array.isArray(item.synonyms)
          ? item.synonyms.map((s: any) => typeof s === 'string' ? s : s.word || '')
          : [],
        phrases: Array.isArray(item.phrases)
          ? item.phrases.map((p: any) => ({
              phrase: p.phrase || '',
              translation: p.translation || ''
            }))
          : [],
        examples: Array.isArray(item.examples)
          ? item.examples.map((e: any) => ({
              sentence: e.sentence || '',
              translation: e.translation || ''
            }))
          : [],
        translations: Array.isArray(item.translations)
          ? item.translations
          : []
      }));
    } catch {
      return [];
    }
  },

  // 添加/移除生词本
  toggleFavorite(wordData: WordData): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const favorites = this.getFavorites();
      const existingIndex = favorites.findIndex((item) => item.word === wordData.word);

      if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
      } else {
        const savedWord: SavedWord = {
          ...wordData,
          savedAt: Date.now(),
          isFavorite: true,
        };
        favorites.unshift(savedWord);
      }

      localStorage.setItem(this._getKey('wordFavorites'), JSON.stringify(favorites));
      return existingIndex < 0;
    } catch (error) {
      console.error('操作生词本失败:', error);
      return false;
    }
  },

  // 检查是否在生词本中
  isFavorite(word: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const favorites = this.getFavorites();
      return favorites.some((item) => item.word === word);
    } catch {
      return false;
    }
  },

  // 清空历史记录
  clearHistory() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this._getKey('wordHistory'));
  },

  // 清空生词本
  clearFavorites() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this._getKey('wordFavorites'));
  },

  // ===== 查询缓存功能（跨用户共享）=====

  // 从缓存获取单词数据
  getCachedWord(word: string): WordData | null {
    if (typeof window === 'undefined') return null;
    try {
      // 缓存是全局共享的，不区分用户
      const cacheKey = `word_cache_${word.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

      if (now - cacheData.cachedAt > CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheData.data;
    } catch {
      return null;
    }
  },

  // 保存单词到缓存
  cacheWord(wordData: WordData) {
    if (typeof window === 'undefined') return;
    try {
      const cacheKey = `word_cache_${wordData.word.toLowerCase()}`;
      const cacheData = {
        data: wordData,
        cachedAt: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  },

  // 清空所有缓存
  clearCache() {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('word_cache_')) {
        localStorage.removeItem(key);
      }
    });
  },

  // ===== 清理用户数据 =====

  // 清理指定用户的所有数据
  clearUserData(userId: string) {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(`${userId}_`)) {
        localStorage.removeItem(key);
      }
    });
  },
};

// 格式化时间
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString('zh-CN');
}
