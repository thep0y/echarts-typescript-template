# echarts-typescript-template

自用echarts模板，适用仅展示 echarts 图表的工作或体验 echarts 的使用。

## 使用

### 克隆

克隆项目到本地：

```bash
# github
https://github.com/thep0y/echarts-typescript-template.git
# gitee
https://gitee.com/thepoy/echarts-typescript-template.git
```

`echarts`的`ts`文件在`src`目录中，可以编辑此模板中的[同步爬虫和异步爬虫效率对比.ts](https://github.com/thep0y/echarts-typescript-template/blob/main/src/%E5%90%8C%E6%AD%A5%E7%88%AC%E8%99%AB%E5%92%8C%E5%BC%82%E6%AD%A5%E7%88%AC%E8%99%AB%E6%95%88%E7%8E%87%E5%AF%B9%E6%AF%94.ts)，或创建自己写的模板。

`src`中可以创建多个`ts`。

### 编译

项目根目录中有两个文件可以用来编译，其中`build.sh`仅适用于`Linux`或`macOS`，因为不具备跨平台通用性，所以之后又写了`build.ts`用来编译。

但每个人对编译目录的结构可能有不同的要求，可根据自己的需求修改`build.ts`中编译目录：

```typescript
const publicHtml = './public/demo.html',
    distDir = './dist',
    jsDir = path.join(distDir, 'js'),
    // 使用 tsconfig.json 中的 outDir 作为编译目录
    buildDir = compilerOptions.outDir as string
```

最终的编译命令为：

```shell
yarn build
```

此编译脚本会下载`package.json`中对应的`echarts`的版本的`min.js`。

![屏幕截图 2021-12-17 112123.png](https://cdn.jsdelivr.net/gh/thep0y/image-bed/md/1639711937135322.png)

当前的编译脚本可在三大平台使用，但编译完成后打开文件管理器仅支持`Windows`系统中，`Linux`和`macOS`的代码没有写，待以后完成。

`Windows`中此编译命令可在`PowerShell`或`wsl`中执行，推荐使用`wsl`。

### 查看图表

在弹出的文件管理器中打开`同步爬虫和异步爬虫效率对比.html`，就能查看生成的图表了。

![](https://cdn.jsdelivr.net/gh/thep0y/image-bed/md/1639712252883631.png)

![屏幕截图 2021-12-17 113845.png](https://cdn.jsdelivr.net/gh/thep0y/image-bed/md/1639712352756908.png)
