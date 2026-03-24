const fs = require('fs');
const path = require('path');

// 1. Modificar el .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
let newEnvContent = '';
const addedVars = new Set();

for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    newEnvContent += line + '\n';
    continue;
  }
  const eqIdx = line.indexOf('=');
  if (eqIdx > -1) {
    let key = line.substring(0, eqIdx).trim();
    const val = line.substring(eqIdx + 1).trim();
    if (!key.startsWith('EXPO_PUBLIC_')) {
      newEnvContent += `EXPO_PUBLIC_${key}=${val}\n`;
      addedVars.add(key);
    } else {
      newEnvContent += `${key}=${val}\n`;
      addedVars.add(key.replace('EXPO_PUBLIC_', ''));
    }
  } else {
    newEnvContent += line + '\n';
  }
}
fs.writeFileSync(envPath, newEnvContent, 'utf8');

// 2. Modificar código fuente 
const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules') && !dirFile.includes('.git')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.js') || dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const allFiles = [...walkSync(path.join(__dirname, 'src')), ...walkSync(path.join(__dirname, '__tests__')), path.join(__dirname, 'ReactotronConfig.js')];

let filesModified = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Find imports like: import { A, B } from '@env';
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@env['"];?/g;

  content = content.replace(importRegex, (match, varsString) => {
    const vars = varsString.split(',').map(v => v.trim()).filter(v => v);
    let replacement = '';
    for (const v of vars) {
      if (v) {
        replacement += `const ${v} = process.env.EXPO_PUBLIC_${v};\n`;
      }
    }
    return replacement;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
  }
}

// 3. Modificar babel.config.js para remover react-native-dotenv
const babelPath = path.join(__dirname, 'babel.config.js');
if (fs.existsSync(babelPath)) {
  let babelContent = fs.readFileSync(babelPath, 'utf8');
  babelContent = babelContent.replace(/const dotenvPlugin = \['module:react-native-dotenv'.*;/g, '');
  babelContent = babelContent.replace(/const envPath = path\.resolve.*;/g, '');
  babelContent = babelContent.replace(/\.\.\.\(isTest \? \[\] : \[dotenvPlugin\]\),/g, '');
  fs.writeFileSync(babelPath, babelContent, 'utf8');
}

console.log(`Successfully migrated .env to EXPO_PUBLIC_`);
console.log(`Updated ${filesModified} files to use process.env.EXPO_PUBLIC_`);
