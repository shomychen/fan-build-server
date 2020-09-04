import spawn from 'cross-spawn';

// const getSpeedUpEnv = () => BinaryMirrorConfig.china.ENVS;


export async function executeCommand(npmClient, args, targetDir, opts) {
  // const extraEnv = getSpeedUpEnv();
  return new Promise((resolve, reject) => {
    // 详细日志
    if (['tnpm', 'npm', 'cnpm'].includes(npmClient)) {
      args.push('-d');
    }
    const child = spawn(npmClient, args, {
      cwd: targetDir,
      env: {
        ...opts
      },
    });
    child.stdout.on('data', buffer => {
      if (opts.onData) opts.onData(buffer.toString());
    });
    child.stderr.on('data', buffer => {
      if (opts.onData) opts.onData(buffer.toString());
    });
    child.on('close', code => {
      if (code !== 0) {
        // 退出code不为0时，打印报错信息
        reject(new Error(`command failed: ${npmClient} ${args.join(' ')}`));
        return;
      }
      resolve();
    });
  });
}

export async function installDeps(npmClient, targetDir, opts) {
  let args = [];

  if (['yarn', 'tyarn', 'ayarn'].includes(npmClient)) {
    args = [];
  } else if (['tnpm', 'npm', 'cnpm', 'pnpm'].includes(npmClient)) {
    args = ['install'];
  }

  await executeCommand(npmClient, args, targetDir, opts);
}
