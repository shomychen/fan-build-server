const sockjs = require('sockjs'); // 与服务端进行连接
const get  = require( 'lodash/get');
const os = require('os');

const initPageSocket =(server)=> {
  const terminalSS = sockjs.createServer();
  terminalSS.on('connection', conn => {
    console.log('内部参数' , this)
    // const { currentProject, projectsByKey } = this.config.data;
    // const currentProjectCwd = get(projectsByKey, `${currentProject}.path`);
    const currentProjectCwd = undefined
    const cwd = currentProjectCwd || process.cwd(); // 识别当前node执行所在的目录
    console.log('连接 \'/terminal-socket\'')
    // insecurity env to run shell
    const safe = securityCheck(conn);
    let spawn;
    try {
      // eslint-disable-next-line prefer-destructuring
      spawn = require('node-pty').spawn;
    } catch (e) {
      conn.write(
        'Failed to install or prebuild node-pty module',
      );
      return false;
    }
    if (safe) {
      const defaultShell = getDefaultShell();
      const defaultShellArgs = ['--login'];
      term = spawn(defaultShell, defaultShellArgs, {
        name: 'xterm-color',
        cols: 180,
        rows: 30,
        cwd,
        env: {
          ...process.env,
          // LANG: `${osLocaleSync()}.UTF-8`,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        },
      });
      /**
       * stringify command shell string
       * @param command ls/... shell commands
       */
      term.onData(chunk => {
        // _log('ptyProcess data', chunk);
        // console.log('onData ==>接收客户端返回的数据', chunk)
        conn.write(chunk);
      });

      // === socket listener ===
      conn.on('data', data => {
        // console.log('data ==> 接收客户端返回的数据', data)
        // _log('terminal conn message', data);
        term.write(data);
      });
      conn.on('close', () => {
        // maybe change the pty cwd
        term.kill();
      });
    }
  });
  terminalSS.installHandlers(server, {
    prefix: '/terminal-socket',
    log: () => {},
  });
}
module.exports = initPageSocket
