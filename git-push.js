const { execFileSync } = require('child_process');
const { existsSync, writeFileSync } = require('fs');
const path = require('path');
const cwd = path.resolve('d:/Gaana_Nextleap');
const remoteUrl = 'https://github.com/ishpreetsingh252003/GaanaNextleap.git';

function run(cmd, args) {
  console.log('>', cmd, args.join(' '));
  return execFileSync(cmd, args, { cwd, stdio: 'inherit' });
}

try {
  if (!existsSync(path.join(cwd, '.git'))) {
    run('git', ['init']);
  }

  const gitignoreContent = `# dependencies
node_modules/

# next.js
.next/
out/

# build output
dist/

# local env files
.env
.env.local
.env.*.local

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# editor files
.vscode/
.DS_Store

# typescript
*.tsbuildinfo

# misc
coverage/\n`;
  if (!existsSync(path.join(cwd, '.gitignore'))) {
    writeFileSync(path.join(cwd, '.gitignore'), gitignoreContent, 'utf8');
    console.log('Created .gitignore');
  }

  try {
    run('git', ['rm', '-r', '--cached', 'node_modules']);
  } catch (e) {
    // ignore if node_modules not tracked
  }

  run('git', ['add', '.gitignore']);
  run('git', ['add', '.']);
  try {
    run('git', ['commit', '-m', 'Initial commit from VS Code']);
  } catch (e) {
    if (!/nothing to commit/.test(e.message)) {
      throw e;
    }
  }

  run('git', ['branch', '-M', 'main']);

  let remoteExists = false;
  try {
    execFileSync('git', ['remote', 'get-url', 'origin'], { cwd, stdio: 'pipe', encoding: 'utf8' });
    remoteExists = true;
  } catch (e) {
    remoteExists = false;
  }

  if (remoteExists) {
    run('git', ['remote', 'set-url', 'origin', remoteUrl]);
  } else {
    run('git', ['remote', 'add', 'origin', remoteUrl]);
  }

  run('git', ['push', '-u', 'origin', 'main']);
  console.log('Push completed.');
} catch (err) {
  console.error('ERROR', err.message || err);
  process.exit(1);
}
