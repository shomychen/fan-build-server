const sockjs = require('sockjs'); // 与服务端进行连接
const get  = require( 'lodash/get');
const os = require('os');
let term;

/**
 * get user default shell 获取当前用户系统默认的命令行工具
 * /bin/zsh /bin/bash
 */
const getDefaultShell = () => {
  console.log('当前运行的系统命令行版本 process.platform')
  if (process.platform === 'darwin') {
    return process.env.SHELL || '/bin/bash';
  }

  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/sh';
};

/**
 * Security Check
 *
 */
const securityCheck = (conn) => {
  if (process.env.HOST === '0.0.0.0') {
    conn.write('The current environment is not safe.');
    return false;
  }
  return true;
};

/**
 * 更新 terminal 行与高显示
 *
 */
const resizeTerminal = (opts) => {
  const { cols, rows } = opts;
  if (term && cols && rows) {
    term.resize(cols, rows);
  }
};

/**
 * export terminal socket init needs bind express app server
 */
const initTerminal =(server)=> {
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

    const runSpawnShell = (conn) => {
      try {
        // currentProjectCwd: 指当前跳转到指定目录 的 currentProjectCwd
        // const cwd = currentProjectCwd || this.cwd || process.cwd();
        const cwd = this.cwd || process.cwd();
        const defaultShell = getDefaultShell();

        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        console.log('当前系统的命令行工具', shell)
        console.log('当前目录 的', cwd, defaultShell)
        const defaultShellArgs = ['--login'];
        term = spawn(defaultShell, defaultShellArgs, {
          name: 'xterm-color',
          cols: 180,
          rows: 30,
          cwd,
          env: process.env,
          // env: {
          //   ...process.env,
          //   // LANG: `${osLocaleSync()}.UTF-8`,
          //   TERM: 'xterm-256color',
          //   COLORTERM: 'truecolor',
          // },
        });
        /**
         * stringify command shell string
         * @param command ls/... shell commands
         */
        term.onData(chunk => {
          // _log('ptyProcess data', chunk);
          conn.write(chunk);
        });

        // === socket listener ===
        conn.on('data', data => {
          // _log('terminal conn message', data);
          term.write(data);
        });
        conn.on('close', () => {
          // maybe change the pty cwd
          term.kill();
        });
      } catch (e) {
        console.log('error spawn', e)
      }
    }
    // runSpawnShell(conn)

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
exports.resizeTerminal = resizeTerminal
exports.securityCheck = securityCheck
module.exports = initTerminal
