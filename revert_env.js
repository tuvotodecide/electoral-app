const fs = require('fs');
const path = require('path');

// 1. Modificar el .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
let newEnvContent = '';

for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    newEnvContent += line + '\n';
    continue;
  }
  const eqIdx = line.indexOf('=');
  if (eqIdx > -1) {
    let key = line.substring(0, eqIdx).trim();
    let val = line.substring(eqIdx + 1).trim();
    
    // Si era una de las variables que tenían comillas originalmente, agregar comillas
    if (key === 'EXPO_PUBLIC_BACKEND' || key === 'EXPO_PUBLIC_BACKEND_RESULT' || key === 'EXPO_PUBLIC_BACKEND_BLOCKCHAIN') {
       if (!val.startsWith("'")) {
          val = `'${val}'`;
       }
    }

    if (key.startsWith('EXPO_PUBLIC_')) {
      newEnvContent += `${key.replace('EXPO_PUBLIC_', '')}=${val}\n`;
    } else {
      newEnvContent += line + '\n';
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

  // Find const declarations like: const A = process.env.EXPO_PUBLIC_A;
  const processEnvRegex = /const\s+([A-Za-z0-9_]+)\s*=\s*process\.env\.EXPO_PUBLIC_[A-Za-z0-9_]+;(\r?\n)?/g;
  
  let match;
  let importedVars = [];
  
  // We cannot use matchAll cleanly while replacing, so we collect first.
  const regexClone = new RegExp(processEnvRegex);
  while ((match = regexClone.exec(content)) !== null) {
      importedVars.push(match[1]);
  }
  
  if (importedVars.length > 0) {
      // Remove all lines with 'const ... process.env...'
      content = content.replace(processEnvRegex, '');
      
      // Inject the import at the top
      const importStatement = `import { ${importedVars.join(', ')} } from '@env';\n`;
      
      const firstImportMatch = /^import\s/m.exec(content);
      if (firstImportMatch) {
          content = content.slice(0, firstImportMatch.index) + importStatement + content.slice(firstImportMatch.index);
      } else {
          content = importStatement + content;
      }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
  }
}

// 3. Modificar babel.config.js para volver a agregar react-native-dotenv
const babelPath = path.join(__dirname, 'babel.config.js');
if (fs.existsSync(babelPath)) {
  let babelContent = fs.readFileSync(babelPath, 'utf8');
  if (!babelContent.includes('react-native-dotenv')) {
      babelContent = babelContent.replace(
        "const isTest = api.env('test');", 
        "const isTest = api.env('test');\n  const envPath = path.resolve(__dirname, '.env');\n  const dotenvPlugin = ['module:react-native-dotenv', { moduleName: '@env', path: envPath }];"
      );
      
      babelContent = babelContent.replace(
        "require('./babel/plugins/transformImportMetaToObject'),",
        "require('./babel/plugins/transformImportMetaToObject'),\n      ...(isTest ? [] : [dotenvPlugin]),"
      );
      fs.writeFileSync(babelPath, babelContent, 'utf8');
  }
}

console.log(`Successfully reverted .env`);
console.log(`Reverted ${filesModified} files to use @env`);
