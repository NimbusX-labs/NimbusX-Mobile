const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const dotslashCache = process.env.DOTSLASH_CACHE || path.join(projectRoot, '.bundle', 'dotslash-cache');

fs.mkdirSync(dotslashCache, { recursive: true });

const extraArgs = process.argv.slice(2);
const startArgs = extraArgs.length === 1 && /^\d+$/.test(extraArgs[0])
  ? ['--port', extraArgs[0]]
  : extraArgs;

const child = spawn(
  process.execPath,
  [require.resolve('react-native/cli.js'), 'start', ...startArgs],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      DOTSLASH_CACHE: dotslashCache,
    },
    stdio: 'inherit',
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code || 0);
});
