const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');

console.log('\n🔍 [Language Stories] Verificando requisitos e dependências...');

// 1. Verificar arquivo .env
const rootEnv = path.join(rootDir, '.env');
const backendEnv = path.join(backendDir, '.env');
const envExample = path.join(backendDir, '.env.example');

if (!fs.existsSync(rootEnv) && !fs.existsSync(backendEnv)) {
  if (fs.existsSync(envExample)) {
    console.log('📝 Criando arquivo .env a partir de backend/.env.example...');
    fs.copyFileSync(envExample, rootEnv);
    console.log('   ✅ Arquivo .env criado na raiz do projeto.');
  }
}

// 2. Verificar dependências do frontend
const frontendNodeModules = path.join(frontendDir, 'node_modules');
if (!fs.existsSync(frontendNodeModules)) {
  console.log('📦 Dependências do Frontend não encontradas. Baixando automaticamente (npm install)...');
  try {
    execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
    console.log('   ✅ Dependências do Frontend instaladas com sucesso.');
  } catch (err) {
    console.error('   ❌ Falha ao instalar dependências do Frontend:', err.message);
  }
}

// 3. Verificar ambiente virtual Python (.venv)
const isWindows = process.platform === 'win32';
const venvDir = path.join(rootDir, '.venv');
const pythonInVenv = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');

if (!fs.existsSync(pythonInVenv)) {
  console.log('🐍 Ambiente virtual Python (.venv) não encontrado. Criando automaticamente...');
  let venvCreated = false;
  try {
    execSync('python -m venv .venv', { cwd: rootDir, stdio: 'inherit' });
    venvCreated = true;
  } catch (e1) {
    try {
      execSync('python3 -m venv .venv', { cwd: rootDir, stdio: 'inherit' });
      venvCreated = true;
    } catch (e2) {
      console.warn('   ⚠️ Não foi possível criar .venv automaticamente. Verifique se o Python está no PATH.');
    }
  }

  if (venvCreated && fs.existsSync(pythonInVenv)) {
    console.log('📦 Instalando bibliotecas Python do backend (requirements.txt)...');
    const pipInVenv = isWindows
      ? path.join(venvDir, 'Scripts', 'pip.exe')
      : path.join(venvDir, 'bin', 'pip');
    const reqFile = path.join(backendDir, 'requirements.txt');
    try {
      execSync(`"${pipInVenv}" install -r "${reqFile}"`, { cwd: rootDir, stdio: 'inherit' });
      console.log('   ✅ Bibliotecas Python instaladas com sucesso.');
    } catch (err) {
      console.error('   ❌ Falha ao instalar requirements.txt:', err.message);
    }
  }
}

console.log('🚀 [Language Stories] Requisitos verificados com sucesso!\n');
