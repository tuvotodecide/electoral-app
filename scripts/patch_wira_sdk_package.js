const fs = require('fs');
const path = require('path');

const pkgPath = path.join(process.cwd(), 'vendor', 'wira-sdk', 'package.json');

if (!fs.existsSync(pkgPath)) {
  console.error(`[patch_wira_sdk_package] Not found: ${pkgPath}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.scripts = pkg.scripts || {};

if (pkg.scripts.prepare) {
  delete pkg.scripts.prepare;
  console.log('[patch_wira_sdk_package] Removed wira-sdk prepare script');
} else {
  console.log('[patch_wira_sdk_package] No prepare script found');
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');