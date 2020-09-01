const spawn = require('cross-spawn') ;
const {  fork } = require('child_process');
const nodeSpawn = require('node-pty').spawn;
const runCommand = (script, options, ipc = false) => {
  options.env = {
    ...process.env,
    ...options.env,
    FORCE_COLOR: '1',
  };

  options.cwd = options.cwd || process.cwd();

  if (process.platform !== 'win32' || !ipc) {
    options.stdio = ipc ? [null, null, null, 'ipc'] : 'pipe';
    options.env = {
      ...process.env,
      ...options.env,
      FORCE_COLOR: '1',
    };

    options.cwd = options.cwd || process.cwd();

    const sh = 'npm';
    const shFlag = '-c';

    const proc = spawn(sh, [shFlag, script], options);
    return proc;
  }
  options.stdio = 'pipe';
  // TODO下面可能没有执行
  const binPath = require.resolve(
    script.indexOf('umi') > -1 ? 'umi/bin/umi' : '@alipay/bigfish/bin/bigfish',
    {
      paths: [options.cwd],
    },
  );
  const child = fork(binPath, ['dev'], options);
  return child;
}
// exports.resizeTerminal = resizeTerminal
// exports.securityCheck = securityCheck
module.exports = runCommand
