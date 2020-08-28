const exec = require('child_process').exec; // 用于执行本地命令操作
const doShellCmd = (cmd) => {
  let str = cmd;
  let result = {};
  return new Promise(function (resolve, reject) {
    exec(str, function (err, stdout, stderr) {
      if (err) {
        result.errCode = 500;
        result.msg = "操作失败,请重试！";
        result.data = err;
        reject(result);
      } else {
        // console.log('stdout ', stdout);//标准输出
        result.errCode = 200;
        result.msg = "操作成功！";
        result.data = stdout;
        resolve(result);
      }
    })
  })
}

module.exports  = doShellCmd
