#!/bin/bash
set -euxo pipefail

PUBLIC_HTML="./public/demo.html"

DIS_DIR="./dist"
BUILD_DIR="$DIS_DIR/js/items"

# 如果 dist 目录不存在，则创建目录并下载 package.json 中对应版本的 echarts
if [ ! -d $DIS_DIR ]; then
    mkdir -p $BUILD_DIR
    # 从 package.json 中获取 echarts 版本
    json=$(cat package.json)
    echo $json
    version=$(python3 -c "print($json['devDependencies']['echarts'][1:])")
    curl -L "https://cdn.staticfile.org/echarts/$version/echarts.min.js" -o "$DIS_DIR/js/echarts.min.js"
fi

if [ ! -d $BUILD_DIR ]; then
    mkdir -p $BUILD_DIR
else
    if [ "$(ls -A $BUILD_DIR)" ]; then
        rm $BUILD_DIR/*
        rm $DIS_DIR/*.html
    fi
fi

echo '正在编译项目中所有 ts 文件...'
tsc
echo '编译完成'

echo '处理编译的文件...'
for file in $BUILD_DIR/*; do
    fullname=$(basename $file)
    name=$(echo $fullname | cut -d . -f1)
    target_file="$DIS_DIR/$name.html"
    cp $PUBLIC_HTML $target_file

    # 替换第 14 行的js导入语句
    sed -i "14c \ \ <script type=\"text/javascript\" src=\"./js/items/$name.js\"></script>" $target_file

    # 删除第 2 到 22 行
    if [ "$(uname)" == "Darwin" ]; then
        sed -i '' '2,22d' "$file"
    else
        sed -i '2,22d' "$file"
    fi
done
echo '已完成'