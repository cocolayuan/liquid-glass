#!/usr/bin/env bash
# 一键部署 dist 到 gh-pages 分支（GitHub Pages）
set -e

npm run build

URL=$(git remote get-url origin)
cd dist
touch .nojekyll
rm -rf .git
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.email="deploy@local" -c user.name="deploy" commit -q -m "Deploy demo"
git push -q -f "$URL" gh-pages
rm -rf .git
cd ..
echo "✓ Deployed to gh-pages → https://cocolayuan.github.io/liquid-glass/"
