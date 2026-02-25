const {spawn} = require('child_process');

const jestBin = require.resolve('jest/bin/jest');
const args = process.argv.slice(2);

const normalizePath = value => {
  const text = String(value);
  if (text.startsWith('"') && text.endsWith('"')) {
    return text.slice(1, -1);
  }
  return text;
};

const exitWith = code => {
  process.exit(typeof code === 'number' ? code : 1);
};

if (process.platform === 'win32') {
  const psQuote = value =>
    `'${normalizePath(value).replace(/'/g, "''")}'`;
  const psArgs = args.map(psQuote).join(' ');
  const psCommand = `$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ` +
    `& ${psQuote(process.execPath)} ${psQuote(jestBin)}${psArgs ? ' ' + psArgs : ''}`;
  const child = spawn('powershell.exe', ['-NoProfile', '-Command', psCommand], {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('close', exitWith);
  child.on('error', () => exitWith(1));
} else {
  const child = spawn(process.execPath, [jestBin, ...args], {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('close', exitWith);
  child.on('error', () => exitWith(1));
}
