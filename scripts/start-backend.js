const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const venvPython = isWindows
  ? path.join(rootDir, '.venv', 'Scripts', 'python.exe')
  : path.join(rootDir, '.venv', 'bin', 'python');

let pythonCmd = isWindows ? 'python' : 'python3';

// 1. Check if venv python has uvicorn
if (fs.existsSync(venvPython)) {
  try {
    execSync(`"${venvPython}" -c "import uvicorn"`, { stdio: 'ignore' });
    pythonCmd = venvPython;
  } catch {
    // 2. If venv does not have uvicorn, try system python
    try {
      execSync('python -c "import uvicorn"', { stdio: 'ignore' });
      pythonCmd = 'python';
    } catch {
      pythonCmd = venvPython;
    }
  }
}

const proc = spawn(pythonCmd, ['-m', 'uvicorn', 'backend.main:app', '--reload', '--port', '8000'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: false,
});

proc.on('close', (code) => {
  process.exit(code || 0);
});
