const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const venvPython = isWindows
  ? path.join(rootDir, '.venv', 'Scripts', 'python.exe')
  : path.join(rootDir, '.venv', 'bin', 'python');

const pythonCmd = fs.existsSync(venvPython) ? venvPython : (isWindows ? 'python' : 'python3');

const proc = spawn(pythonCmd, ['-m', 'uvicorn', 'backend.main:app', '--reload', '--port', '8000'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

proc.on('close', (code) => {
  process.exit(code || 0);
});
