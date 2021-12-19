import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'
import * as UglifyJS from 'uglify-js'
import { type } from "os"
import { spawn, ChildProcessWithoutNullStreams, exec } from "child_process"
import { ExecException, execSync } from 'child_process'
import { devDependencies } from './package.json'
import { compilerOptions } from './tsconfig.json'

/**
 * 彩色文字
 */
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

/**
 * 彩色日志
 */
class Logger {
    private color = new Color()
    private addDate = false

    constructor(addDate: boolean = false) {
        this.addDate = addDate
    }

    private _time(): string {
        if (this.addDate) {
            return this.datetime()
        }
        return this.time()
    }

    private datetime(): string {
        const now = new Date(Date.now())

        let mon: string | number = now.getMonth()
        let date: string | number = now.getDate()
        let hour: string | number = now.getHours()
        let min: string | number = now.getMinutes()
        let sec: string | number = now.getSeconds()
        mon = mon < 10 ? '0' + mon : mon
        date = date < 10 ? '0' + date : date
        hour = hour < 10 ? '0' + hour : hour
        min = min < 10 ? '0' + min : min
        sec = sec < 10 ? '0' + sec : sec

        return this.color.gray(`${now.getFullYear()}-${mon}-${date} ${hour}:${min}:${sec}`)
    }

    private time(): string {
        const now = new Date(Date.now())

        let hour: string | number = now.getHours()
        let min: string | number = now.getMinutes()
        let sec: string | number = now.getSeconds()
        let mils: string | number = now.getMilliseconds()
        hour = hour < 10 ? '0' + hour : hour
        min = min < 10 ? '0' + min : min
        sec = sec < 10 ? '0' + sec : sec
        mils = mils < 100 ? mils < 10 ? '00' + mils : "0" + mils : mils

        return this.color.gray(`${hour}:${min}:${sec}.${mils}`)
    }

    info(...msgs: string[]) {
        let msg = `${this._time()} [${this.color.green('INFO')}]:`
        msgs.forEach((v, i) => {
            msg += " " + v
        })

        console.log(msg)
    }

    error(msg: Error | string) {
        console.log(`${this._time()} [${this.color.red('ERROR')}]: ${msg}`)
    }

    warn(msg: Error | string) {
        console.log(`${this._time()} [${this.color.yellow('WARNING')}]: ${msg}`)
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
    logger.info("正在打开文件管理器...")
    let cmd: ChildProcessWithoutNullStreams = null
    switch (type()) {
        case "Windows_NT":
            cmd = spawn('explorer', [dir])
            break
        case "Darwin":
            break
        default:
            if (process.env.WSL_INTEROP) {
                dir = dir.replace("/mnt/", "")
                const disk = dir.substring(0, 1).toUpperCase()
                dir = dir.slice(1).replace(/\//g, "\\")
                dir = disk + ":" + dir
                cmd = spawn("/mnt/c/Windows/explorer.exe", [dir])
            } else {
                const desktop = process.env.XDG_SESSION_DESKTOP
                switch (desktop) {
                    case 'KDE':
                        exec(`nohup dolphin ${dir} --new-window > /dev/null 2>&1 &`, (err) => {
                            if (err) throw err
                            logger.info("已在文件管器中打开编绎目录")
                        })
                        break
                    default:
                        logger.warn(`未知的桌面：${desktop}`)
                        break
                }
            }
            break
    }
    if (cmd) {
        cmd.on('error', e => {
            cmd.kill()
            logger.error(e)
        })
        cmd.stdout.on('data', data => {
            console.log(data)
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

process.on('exit', () => {
    logger.info("已完成")
})