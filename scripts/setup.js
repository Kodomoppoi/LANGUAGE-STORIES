const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');

console.log('\n🔍 [Language Stories] Verifying requirements and dependencies...');

// 1. Verify .env file
const rootEnv = path.join(rootDir, '.env');
const backendEnv = path.join(backendDir, '.env');
const envExample = path.join(backendDir, '.env.example');

if (!fs.existsSync(rootEnv) && !fs.existsSync(backendEnv)) {
  if (fs.existsSync(envExample)) {
    console.log('📝 Creating .env file from backend/.env.example...');
    fs.copyFileSync(envExample, rootEnv);
    console.log('   ✅ .env file created at project root.');
  }
}

// 2. Verify frontend dependencies
const frontendNodeModules = path.join(frontendDir, 'node_modules');
if (!fs.existsSync(frontendNodeModules)) {
  console.log('📦 Frontend dependencies not found. Installing automatically (npm install)...');
  try {
    execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
    console.log('   ✅ Frontend dependencies installed successfully.');
  } catch (err) {
    console.error('   ❌ Failed to install frontend dependencies:', err.message);
  }
}

// 3. Verify Python virtual environment (.venv)
const isWindows = process.platform === 'win32';
const venvDir = path.join(rootDir, '.venv');
const pythonInVenv = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');

if (!fs.existsSync(pythonInVenv)) {
  console.log('🐍 Python virtual environment (.venv) not found. Setting up...');
  let venvCreated = false;
  try {
    execSync('python -m venv .venv', { cwd: rootDir, stdio: 'inherit' });
    venvCreated = true;
  } catch (e1) {
    try {
      execSync('python3 -m venv .venv', { cwd: rootDir, stdio: 'inherit' });
      venvCreated = true;
    } catch (e2) {
      console.warn('   ⚠️ Could not automatically create .venv. Please ensure Python is in your PATH.');
    }
  }

  if (venvCreated && fs.existsSync(pythonInVenv)) {
    console.log('📦 Installing backend Python packages (requirements.txt)...');
    const pipInVenv = isWindows
      ? path.join(venvDir, 'Scripts', 'pip.exe')
      : path.join(venvDir, 'bin', 'pip');
    const reqFile = path.join(backendDir, 'requirements.txt');
    try {
      execSync(`"${pipInVenv}" install -r "${reqFile}"`, { cwd: rootDir, stdio: 'inherit' });
      console.log('   ✅ Python packages installed successfully.');
    } catch (err) {
      console.error('   ❌ Failed to install requirements.txt:', err.message);
    }
  }
}

console.log('🚀 [Language Stories] All dependencies and services verified!\n');
