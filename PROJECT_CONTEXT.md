# 英语单词学习工具 - 项目上下文文档

**当前版本：v1.2.0**
**最后更新：2026-01-31**

---

## 📋 项目概述

这是一个为2027春考英语备考打造的单词学习工具，支持单词查询、翻译、常用搭配、例句展示等功能。

**核心特点**：
- 离线词典（ECDICT SQLite数据库）
- 双API并行翻译（百度 + 有道）
- Datamuse API智能短语提取
- Merriam-Webster API获取例句
- 7天智能缓存机制
- 支持历史记录和生词本
- 精准的卡片式打印/PDF导出

---

## 🎯 当前版本功能（v1.2.0）

### 1. 单词查询
- 支持单个或多个单词查询（空格/逗号分隔）
- 渐进式加载：先显示基础数据，再异步加载翻译
- 智能缓存：查询过的单词自动缓存7天

### 2. 单词展示
- **释义**：显示词性和中文释义
- **常用搭配**（根据词性智能匹配）：
  - 名词 → 形容词+名词短语（如：major project）
  - 非及物动词/形容词 → 介词搭配（如：depend on）
  - 及物动词 → 不显示搭配
- **同义词**：来自Datamuse API
- **例句**：来自Merriam-Webster API
  - 过滤条件：必须有句号、长度150字符内、3-25个单词
- **词汇等级标签**：高考、四级、六级、托福、雅思、GRE等

### 3. 历史记录和生词本
- 自动保存查询历史（最多100条）
- 收藏单词到生词本
- 支持清空历史记录和生词本

### 4. 打印和PDF导出
- 左右分栏布局（30:70）
- 左侧：单词 + 词汇等级标签
- 右侧：释义、常用搭配、同义词、例句
- PDF导出使用浏览器原生打印功能

### 5. 缓存系统
- 查询结果自动缓存到 localStorage
- 缓存有效期：7天
- 重复查询瞬间加载，无需调用API
- 支持手动清空缓存

---

## 🛠️ 技术栈

### 前端
- **框架**：Next.js 16 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS v4
- **图标**：Lucide React
- **PDF生成**：jsPDF + html2canvas（已弃用，改用浏览器原生打印）

### 后端
- **API Routes**：Next.js API Routes
- **数据库**：SQLite（ECDICT离线词典）
  - 位置：`/Users/macmini/english-vocab-tool/data/stardict.db`
  - 表名：`stardict`
  - 字段：word, phonetic, translation, pos, collins, oxford, tag, exchange, detail

### 第三方API
1. **Datamuse API**（免费，无需密钥）
   - 获取同义词：`/words?rel_syn={word}`
   - 获取形容词搭配：`/words?rel_jjb={word}`
   - 获取右侧搭配：`/words?rc={word}`

2. **Merriam-Webster Dictionary API**
   - 获取例句
   - API Key：存储在环境变量 `MW_API_KEY`

3. **百度翻译API**
   - 翻译短语
   - 需要：`BAIDU_APPID` 和 `BAIDU_SECRET`

4. **有道翻译API**
   - 翻译例句
   - 需要：`YOUDAO_APPID` 和 `YOUDAO_SECRET`

---

## 📁 项目结构

```
english-vocab-tool/
├── app/
│   ├── api/
│   │   └── translate/
│   │       └── route.ts          # 核心API：单词查询、翻译、短语、例句
│   ├── page.tsx                  # 主页面：搜索、显示、打印
│   ├── layout.tsx                # 布局：字体配置
│   └── globals.css               # 全局样式
├── components/
│   └── WordCard.tsx              # 单词卡片组件
├── lib/
│   ├── utils.ts                  # 工具函数：localStorage操作、缓存
│   ├── wordLevels.ts             # 词汇等级判断
│   └── ecdict.db                 # ECDICT离线词典（未使用）
├── data/
│   └── stardict.db               # 实际使用的词典数据库
├── types/
│   └── word.ts                   # TypeScript类型定义
└── .env.local                    # 环境变量（API密钥）
```

---

## 🔑 核心代码说明

### 1. API路由 (`app/api/translate/route.ts`)

**主要函数**：

#### `POST(request)` - 主处理函数
- 接收参数：`{ word: string, skipTranslation?: boolean }`
- 流程：
  1. 从SQLite数据库查询基础信息
  2. 获取例句（Merriam-Webster）
  3. 获取常用搭配（Datamuse，根据词性）
  4. 如果 `skipTranslation=false`，并行翻译短语和例句

#### `getCommonCollocations(word, pos)` - 获取常用搭配
- 根据词性返回不同类型的搭配：
  - 名词：`rel_jjb`（形容词+名词）+ `rc`（名词+名词）
  - 非及物动词/形容词：`rc`（单词+介词）
  - 及物动词：返回空数组

#### `getExamples(word)` - 获取例句
- 从Merriam-Webster API获取
- 完整性检查：
  - 必须以大写字母开头
  - 必须以句号/问号/感叹号结尾
  - 长度：3-25个单词，不超过150字符
  - 不能以连词开头（and/but/if/when/hopes等）

#### `translateBatchBaidu(texts)` - 百度翻译（短语）
- 批量翻译，一次最多20条
- 使用MD5签名

#### `translateBatchYoudao(texts)` - 有道翻译（例句）
- 批量翻译
- 使用SHA256签名

### 2. 主页面 (`app/page.tsx`)

**核心状态**：
```typescript
const [inputValue, setInputValue] = useState('');           // 搜索输入
const [wordsList, setWordsList] = useState<WordData[]>([]); // 单词列表
const [loading, setLoading] = useState(false);              // 加载状态
const [activeTab, setActiveTab] = useState('search');       // 当前标签页
```

**核心函数**：

#### `handleSearch()` - 搜索单词
1. 检查缓存，优先使用缓存数据
2. 对未缓存的单词，先获取基础数据（skipTranslation=true）
3. 异步加载翻译（skipTranslation=false）
4. 保存到历史记录和缓存

#### `exportToPDF()` - 导出PDF
- 使用浏览器原生打印功能
- 弹出提示，引导用户选择"另存为PDF"

### 3. 缓存系统 (`lib/utils.ts`)

**缓存函数**：

#### `getCachedWord(word)` - 获取缓存
- 缓存键：`word_cache_{word.toLowerCase()}`
- 检查有效期：7天
- 过期自动删除

#### `cacheWord(wordData)` - 保存缓存
- 保存格式：`{ data: WordData, cachedAt: timestamp }`

#### `clearCache()` - 清空所有缓存
- 删除所有以 `word_cache_` 开头的键

---

## 🎨 打印样式说明

### CSS选择器策略
使用精确的选择器匹配DOM结构，确保打印时正确应用样式。

**关键选择器**：
```css
/* 强制横向布局 */
.print\:bg-white > div > div {
  display: flex !important;
  flex-direction: row !important;
}

/* 左侧（30%）*/
.print\:bg-white > div > div > div:first-child {
  width: 30% !important;
  flex: 0 0 30% !important;
}

/* 右侧（70%）*/
.print\:bg-white > div > div > div:nth-child(2) {
  width: 70% !important;
  flex: 0 0 70% !important;
}

/* 隐藏音标和按钮 */
.print\:bg-white > div > div > div:first-child p,
.print\:bg-white > div > div > div:first-child button,
.print\:bg-white > div > div > div:first-child svg {
  display: none !important;
}
```

---

## 🐛 已知问题和解决方案

### ❌ 问题1：html2canvas不支持oklch颜色
**原因**：Tailwind CSS v4使用现代颜色格式`oklch()`，html2canvas不支持

**解决方案**：弃用html2canvas，改用浏览器原生打印功能

### ❌ 问题2：打印时所有内容挤在左侧
**原因**：Tailwind的响应式类`flex-col md:flex-row`在打印时未正确覆盖

**解决方案**：
- 使用全局覆盖：`[class*="flex-col"] { flex-direction: row !important; }`
- 使用精确选择器强制宽度
- 添加`flex-shrink: 0`锁定宽度

### ❌ 问题3：短语质量差（如"project many"）
**原因**：Datamuse API的`rel_trg`端点返回不相关的词

**解决方案**：
- 改用`rel_jjb`（形容词）和`rc`（右侧搭配）端点
- 添加分数过滤（score > 100 或 score > 50）
- 添加黑名单过滤代词、冠词等

### ❌ 问题4：例句不完整（如"hopes she will approve..."）
**原因**：Merriam-Webster API清理标记时删除了主语

**解决方案**：
- 添加完整性检查：必须以大写字母开头、有句号结尾
- 不能以连词或从句开头（and/but/if/hopes等）
- 长度限制：3-25个单词，150字符内

---

## 📊 数据流程图

```
用户输入 "project approve"
    ↓
检查缓存 (localStorage)
    ↓
未命中 → 调用 /api/translate (skipTranslation=true)
    ↓
返回基础数据 → 立即显示
    ↓
后台调用 /api/translate (skipTranslation=false)
    ↓
并行处理：
    ├─ 百度翻译API（短语）
    └─ 有道翻译API（例句）
    ↓
更新界面 + 保存缓存 + 保存历史记录
```

---

## 🔐 环境变量

创建 `.env.local` 文件：

```bash
# Merriam-Webster Dictionary API
MW_API_KEY=your_merriam_webster_api_key

# 百度翻译API
BAIDU_APPID=your_baidu_appid
BAIDU_SECRET=your_baidu_secret

# 有道翻译API
YOUDAO_APPID=your_youdao_appid
YOUDAO_SECRET=your_youdao_secret
```

---

## 🚀 运行项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问
http://localhost:3000
```

---

## 📝 版本历史

### v1.2.0 (2026-01-31)
- ✅ 智能词性搭配（根据词性返回不同搭配类型）
- ✅ 完整例句过滤（必须有句号、长度适中）
- ✅ 7天智能缓存机制
- ✅ 精准打印布局（完全重构CSS）
- ✅ PDF导出改用浏览器原生打印
- ✅ "常见短语"改名为"常用搭配"

### v1.1.0 (之前)
- ✅ 双API并行翻译（百度+有道）
- ✅ 渐进式加载
- ✅ 卡片式打印布局
- ✅ 历史记录和生词本

### v1.0.0 (初始版本)
- ✅ 基础单词查询
- ✅ 离线词典
- ✅ 例句和短语

---

## 🎯 下次开发建议

### 待优化项
1. **短语翻译速度**：考虑使用批量翻译或缓存翻译结果
2. **错误处理**：API失败时的降级策略
3. **移动端优化**：打印在移动端的体验
4. **导出格式**：支持导出为Word/Excel

### 可能的新功能
1. **单词复习模式**：基于艾宾浩斯遗忘曲线
2. **发音功能增强**：使用真实语音API
3. **词根词缀分析**
4. **记忆进度统计**

---

## 📞 技术支持

如果遇到问题，检查：
1. 环境变量是否配置正确（`.env.local`）
2. 数据库文件是否存在（`data/stardict.db`）
3. 浏览器控制台是否有错误
4. API调用是否超出配额

---

**祝您游戏愉快！🎮**
**下次继续开发时，查看这个文档即可快速上手！**
