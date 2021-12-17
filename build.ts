import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'
import * as UglifyJS from 'uglify-js'
import { type } from "os"
import { spawn, ChildProcessWithoutNullStreams } from "child_process"
import { ExecException, execSync } from 'child_process'
import { devDependencies } from './package.json'
import { compilerOptions } from './tsconfig.json'

class Color {
    private base(code: number, msg: string): string {
        return `\u001B[${code}m${msg}\u001B[39m`
    }
    cyan(msg: string): string {
        return this.base(36, msg)
    }    

    green(msg: string): string {
        return this.base(32, msg)
    }    

    gray(msg: string): string {
        return this.base(90, msg)
    }

    red(msg: string): string {
        return this.base(31, msg)
    }

    yellow(msg: string): string {
        return this.base(33, msg)
    }
}

class Logger {
    private color = new Color()

    private time(): string {
        const now = new Date(Date.now())

        return this.color.gray(`${now.getFullYear()}-${now.getMonth()}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds()}`)
    }

    info(...msgs: string[]) {
        let msg = `${this.time()} [${this.color.green('INFO')}]:`
        msgs.forEach((v, i) => {
            msg += " " + v
        })

        console.log(msg)
    }

    error(msg: Error | string) {
        console.log(`${this.time()} [${this.color.red('ERROR')}]: ${msg}`)
    }

    warn(msg: Error | string) {
        console.log(`${this.time()} [${this.color.yellow('WARNING')}]: ${msg}`)
    }
}

const colors = new Color()

const logger = new Logger()

const publicHtml = './public/demo.html',
    distDir = './dist',
    jsDir = path.join(distDir, 'js'),
    // 使用 tsconfig.json 中的 outDir 作为编译目录
    buildDir = compilerOptions.outDir as string

const ujOptions = {
    mangle: {
        toplevel: true,
    },
    nameCache: {}
}

function open(dir: string) {
    let ls: ChildProcessWithoutNullStreams = null
    switch (type()) {
        case "Windows_NT":
            ls = spawn('explorer', [dir])
        case "Darwin":
            break
        default:
            if (process.env.WSL_INTEROP) {
                dir = dir.replace("/mnt/", "")
                const disk = dir.substring(0, 1).toUpperCase()
                dir = dir.slice(1).replace(/\//g, "\\")
                dir = disk + ":" + dir
                ls = spawn("/mnt/c/Windows/explorer.exe", [dir])
            } else {

            }
            break
    }
    if (ls) {
        ls.on('error', e => {
            ls.kill()
            logger.error(e)
        })
    }
}

if (!fs.existsSync(distDir)) {
    logger.warn("编译目录不存在")
    logger.info("创建编译目录...")
    fs.mkdirSync(distDir)
    fs.mkdirSync(jsDir)
    fs.mkdirSync(buildDir)
    logger.info(`编译目录 '${colors.cyan('./dist')}' 已创建`)
    const echarts = devDependencies.echarts
    const version = (echarts).slice(1)

    const downloadUrl = `http://cdn.staticfile.org/echarts/${version}/echarts.min.js`

    const filename = `${jsDir}/echarts.min.js`
    const file = fs.createWriteStream(filename)
    logger.info(`开始下载 '${colors.cyan(downloadUrl)}'`)
    http.get(downloadUrl, res => {
        if (res.statusCode !== 200) {
            logger.error("下载失败")
            return
        }

        res.on('end', () => {
            logger.info(`'${colors.cyan('echarts.min.js')}' 下载完成`)
        })

        file.on('finish', () => {
            file.close()
        }).on('error', (err) => {
            if (err) {
                throw err
            }
            fs.unlink(filename, err => {
                if (err) {
                    throw err
                }
            })
        })

        res.pipe(file)
    })
}

function deleteAllFiles(path: string, suffix: string | null) {
    let files = []
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path)
        files.forEach((file, index) => {
            const curPath = path + '/' + file
            if (!suffix) {
                if (fs.statSync(curPath).isDirectory()) {
                    deleteAllFiles(curPath, null)
                } else {
                    fs.unlinkSync(curPath)
                }
            } else {
                if (file.endsWith(suffix)) {
                    fs.unlinkSync(curPath)
                }
            }
        })
    }
}

const _files = fs.readdirSync(buildDir)
if (_files.length) {
    deleteAllFiles(buildDir, null)
    deleteAllFiles(distDir, '.html')
}

logger.info("开始编译全部 typescript 文件...")
execSync('tsc')
logger.info("编译完成")


fs.readdirSync(buildDir).forEach((filename, index) => {
    const name = filename.slice(0, filename.length - 3)
    const filepath = path.join(buildDir, filename)
    const targetFilePath = path.join(distDir, `${name}.html`)
    fs.copyFile(publicHtml, targetFilePath, e => {
        if (e) throw e
        logger.info(`已创建网页 '${colors.cyan(`${name}.html`)}'`)

        const newName = index + ".js"
        const newFile = path.join(buildDir, newName)

        fs.readFile(targetFilePath, (err, data) => {
            if (err) {
                return logger.error(err)
            }


            const result = data.toString("utf-8").replace(`<script type="text/javascript" src="./js/items/"></script>`, `<script type="text/javascript" src="./js/items/${newName}"></script>`)
            fs.writeFile(targetFilePath, result, err => {
                if (err) return logger.error(err)
            })
        })

        fs.readFile(filepath, (err, data) => {
            if (err) return logger.error(err)
            const content = data.toString("utf-8")
            const lines = content.split("\n")
            let result: string[] = []
            lines.forEach((line: string, num: number) => {
                if (num === 0 || num > 21) {
                    result.push(line)
                }
            })

            logger.info('开始压缩 js 文件', `'${colors.cyan(filename)}'`)
            const uj = UglifyJS.minify(result.join('\n'), ujOptions)
            if (uj.error) {
                throw uj.error
            }

            fs.writeFile(newFile, uj.code, err => {
                if (err) return console.error(err)
            })
            logger.info('压缩完成')

            logger.info(`异步删除 '${colors.cyan(filename)}'...`)
            fs.unlink(filepath, e => {
                if (e) throw e
                logger.info(`已删除 '${colors.cyan(filename)}'`)
            })
        })
    })
})

open(path.join(__dirname, distDir))

process.on('exit', code => {
    logger.info("已完成")
})