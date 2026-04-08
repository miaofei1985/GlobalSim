#!/bin/bash
# GlobalSim 代码推送脚本
# 使用方法：bash scripts/push-to-github.sh

set -e

echo "🚀 GlobalSim 代码推送至 GitHub"
echo "================================"

# 检查远程仓库配置
REMOTE_URL="https://github.com/miaofei1985/GlobalSim.git"
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [ "$CURRENT_REMOTE" != "$REMOTE_URL" ]; then
    echo "⚙️  配置远程仓库地址..."
    git remote set-url origin $REMOTE_URL
fi

# 显示当前状态
echo ""
echo "📊 当前 Git 状态:"
git status --short

# 检查是否有未提交的更改
CHANGES=$(git status --porcelain)
if [ -n "$CHANGES" ]; then
    echo ""
    read -p "发现未提交的更改，是否先提交？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "feat: W1 核心基建完成 - 注册/钱包/行情/撮合引擎"
    fi
fi

# 确保在 dev 分支
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "⚠️  切换到 dev 分支..."
    git checkout dev
fi

echo ""
echo "📤 准备推送到 GitHub..."
echo "仓库地址：$REMOTE_URL"
echo ""
echo "⚠️  注意：接下来需要输入 GitHub 凭证"
echo "   - 用户名：miaofei1985"
echo "   - 密码：请使用 Personal Access Token (PAT)"
echo ""
echo "💡 如果没有 PAT，请访问：https://github.com/settings/tokens"
echo "   创建 token 时勾选：repo, workflow 权限"
echo ""

# 执行推送
git push -u origin dev

echo ""
echo "✅ 推送成功！"
echo "🔗 查看仓库：https://github.com/miaofei1985/GlobalSim"
echo ""
echo "📋 下一步操作："
echo "   1. 在 GitHub 检查文件是否完整"
echo "   2. 配置 GitHub Actions CI/CD (可选)"
echo "   3. 邀请团队成员加入仓库"
