# 部署指南 🚀

## 快速部署到Vercel

### 第一步：准备项目

确保项目已经构建成功：
```bash
npm run build
```

如果构建成功，继续下一步。

### 第二步：初始化Git仓库（如果还没有）

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 创建第一次提交
git commit -m "Initial commit: English vocab learning tool"
```

### 第三步：推送到GitHub

1. 在GitHub上创建一个新仓库
2. 按照GitHub的指示推送代码：

```bash
git remote add origin https://github.com/你的用户名/english-vocab-tool.git
git branch -M main
git push -u origin main
```

### 第四步：部署到Vercel

#### 方法A：通过Vercel网站（推荐，最简单）

1. 访问 [Vercel官网](https://vercel.com/)
2. 使用GitHub账号登录
3. 点击 "Add New Project"
4. 选择你的 `english-vocab-tool` 仓库
5. 保持默认配置，点击 "Deploy"
6. 等待部署完成（通常1-2分钟）
7. 访问Vercel提供的URL测试应用

#### 方法B：通过Vercel CLI

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署（在项目目录下运行）
vercel

# 按提示操作，选择默认选项即可
```

### 第五步：配置有道API（可选）

如果想使用真实的词典数据而不是模拟数据：

1. 申请有道翻译API密钥：
   - 访问 https://ai.youdao.com/
   - 注册并创建应用
   - 获取 AppKey 和 AppSecret

2. 在Vercel项目设置中添加环境变量：
   - 进入项目 → Settings → Environment Variables
   - 添加以下两个变量：
     - `YOUDAO_APP_KEY`: 你的AppKey
     - `YOUDAO_APP_SECRET`: 你的AppSecret
   - 保存后重新部署（Vercel会自动重新部署）

## 测试部署

部署完成后，访问Vercel提供的URL，测试以下功能：

- [ ] 查询单词（输入 hello, study, learn）
- [ ] 查看单词卡片显示是否正常
- [ ] 收藏单词到生词本
- [ ] 查看历史记录
- [ ] 导出PDF
- [ ] 打印功能

## 自定义域名（可选）

如果你有自己的域名：

1. 在Vercel项目设置中进入 "Domains"
2. 添加你的域名
3. 按照指示配置DNS记录
4. 等待DNS生效（可能需要几分钟到几小时）

## 故障排除

### 问题1：构建失败

检查错误日志，通常是依赖问题或TypeScript类型错误。

解决方法：
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install --cache /tmp/npm-cache
npm run build
```

### 问题2：API不工作

确认环境变量配置正确：
- 检查Vercel项目设置中的环境变量
- 确保变量名完全匹配（区分大小写）
- 修改环境变量后需要重新部署

### 问题3：页面显示空白

查看浏览器控制台的错误信息。可能原因：
- JavaScript加载失败
- API请求被阻止（检查CORS设置）

## 性能优化建议

1. **使用真实API密钥**：模拟数据只包含少量单词
2. **添加缓存**：可以在API路由中添加缓存逻辑
3. **优化图片**：如果添加图片，使用Next.js的Image组件
4. **监控使用**：在Vercel控制台查看访问量和性能指标

## 更新部署

当你修改代码后：

```bash
# 提交更改
git add .
git commit -m "描述你的更改"
git push

# Vercel会自动检测并重新部署
```

## 成本说明

- **Vercel免费版**：
  - 每月100GB流量
  - 无限部署
  - 自动HTTPS
  - 对个人项目完全足够

- **有道API免费版**：
  - 每小时调用频次：1000次
  - 每天翻译字符数：10000字符
  - 对个人学习完全足够

## 支持

如果遇到问题，可以：
1. 查看 [Vercel文档](https://vercel.com/docs)
2. 查看 [Next.js文档](https://nextjs.org/docs)
3. 查看项目的 [README.md](./README.md)

---

**部署愉快！🎉**
