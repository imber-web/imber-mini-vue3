const args = require('minimist')(process.argv.slice(2)) //解析命令行参数
const path = require('path')
const target = args._[0] || 'reactivity'
const format = args.f || 'global'
// 入口
const entry = path.resolve(__dirname, `../packages/${target}/src/index.ts`)
//获取包名
const globalName = require(path.resolve(
  __dirname,
  `../packages/${target}/package.json`
)).buildOptions?.name
// global就是iife格式,需要增加一个全局变量
const outputFormat = format.startsWith('global')
  ? 'iife'
  : format === 'cjs'
  ? 'cjs'
  : 'esm'
// 出口
const outfile = path.resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
)

const { build } = require('esbuild')
build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  sourcemap: true,
  format: outputFormat,
  globalName,
  platform: format === 'cjs' ? 'node' : 'browser',
  watch: {
    // 监控文件变化
    onRebuild(error) {
      if (!error) console.log(`rebuilt~~~~`)
    }
  }
}).then(() => {
  console.log('watching~~~')
})
