// 持续集成

const baseController = require('./base.js');
const doShellCmd = require('../utils/doShellCmd.js');
const tools = require('../utils/tools.js');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const process = require('process');

class ciController extends baseController {
  constructor(ctx) {
    super(ctx);
  }

  async checkNode(ctx) {
    let reStartPro = "node node/helloworld.js";//这是一条重启服务的linux命令,也可以是执行其他功能的命令~
    let result = await doShellCmd(reStartPro);//调用exec
    console.log(result);
    if (!result) {
      return (ctx.body = tools.commons.resReturn(null, 400, 'node服务启动失败'));
    }
    return (ctx.body = tools.commons.resReturn(result.data, result.errCode, result.msg));
  }

  async callTest(ctx) {
    const doShellCmd = () => {
      let result = {};
      return new Promise(function (resolve, reject) {
        exec('node -v', function (err, stdout, stderr) {
          if (err) {
            // result.errCode = 500;
            // result.msg = "操作失败,请重试！";
            // result.data = err;
            reject(result);
          } else {
            console.log('stdout ', stdout);//标准输出
            result.errCode = 200;
            result.msg = "操作成功！";
            resolve(result);
          }
        })
      })
    }
    const result = null;
    const rr = await doShellCmd()
    //
    // if (!result) {
    //   return (ctx.body = tools.commons.resReturn(null, 400, 'node服务启动失败'));
    // }
    return (ctx.body = tools.commons.resReturn(rr.data, rr.errCode, rr.msg));
  }

  // 更换node执行目录
  async changePath(ctx) {
    console.log(`Starting directory: ${process.cwd()}`);
    try {
      // Step1.跳转到指定目录
      process.chdir('D:\\Workerspace\\svn\\webdesign\\trunk\\library\\basic-manage-2.0');
      console.log(`New directory: ${process.cwd()}`);
      // Step2.执行命令
      const result = await doShellCmd('npm run test:copy')
      return (ctx.body = tools.commons.resReturn(result.data, result.errCode, result.msg, {dd: 32323}));
    } catch (err) {
      console.error(`chdir: ${err}`);
      return (ctx.body = tools.commons.resReturn(err, 400, '当前目录 不存在'));
    }
  }
  // 获取当前系统已的的node相关客户端
  async initNpmClients(ctx) {
    const ret = ['tnpm', 'cnpm', 'npm', 'ayarn', 'tyarn', 'yarn'].filter(npmClient => {
      try {
        execSync(`${npmClient} --version`, { stdio: 'ignore' });
        return true;
      } catch (e) {}
      return false;
    });
    return (ctx.body = tools.commons.resReturn(ret, 200, '操作成功'));
  }
}

module.exports = ciController;
