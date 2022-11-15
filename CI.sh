#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

yarn install && yarn docs:build && \/bin\/cp -rf docs/.vuepress/dist/* /www/wwwroot/blog.xiaorang.fun/