#!/bin/bash

# AI绘本故事应用 - GitHub部署脚本
# 使用前请确保已安装Git并配置好GitHub账户

echo "🚀 AI绘本故事应用 - GitHub部署脚本"
echo "================================="

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "❌ 错误：Git未安装，请先安装Git"
    exit 1
fi

# 提示用户输入仓库信息
echo "📝 请输入您的GitHub信息："
read -p "GitHub用户名: " GITHUB_USERNAME
read -p "仓库名称 (默认: ai-storybook-app): " REPO_NAME
REPO_NAME=${REPO_NAME:-ai-storybook-app}

echo ""
echo "🔧 准备部署到: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""

# 初始化Git仓库
echo "📦 初始化Git仓库..."
git init

# 添加所有文件
echo "📂 添加项目文件..."
git add .

# 创建初始提交
echo "💾 创建初始提交..."
git commit -m "Initial commit - AI Storybook App for Children

Features:
- AI-powered story generation with Volcano Engine API
- Multi-tier image system (API + Library + SVG fallback)
- Text-to-speech with synchronized highlighting
- Mobile-responsive design for children aged 3-8
- Comprehensive error handling and fallback mechanisms"

# 设置默认分支为main
git branch -M main

# 添加远程仓库
echo "🌐 添加远程GitHub仓库..."
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# 推送到GitHub
echo "🚀 推送到GitHub..."
git push -u origin main

echo ""
echo "✅ 部署完成！"
echo "📱 应用地址: https://$GITHUB_USERNAME.github.io/$REPO_NAME"
echo "📚 仓库地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "⚠️  请注意："
echo "1. 需要在GitHub仓库设置中启用GitHub Pages"
echo "2. 选择main分支作为Pages源"
echo "3. 首次部署可能需要几分钟生效"
echo ""
echo "🎉 让孩子们享受AI故事的魅力吧！"