const { withDangerousMod, withAppBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withAndroidKeystore(config, props = {}) {
  // First, copy the keystore file
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const keystoreDir = path.join(projectRoot, 'android', 'app', 'keystore');
      
      // Create the keystore directory if it doesn't exist
      if (!fs.existsSync(keystoreDir)) {
        fs.mkdirSync(keystoreDir, { recursive: true });
      }

      // Copy keystore file from source to destination
      const sourcePath = props.keystorePath 
        ? path.join(projectRoot, props.keystorePath)
        : path.join(projectRoot, 'native-files', 'keystores', 'release.keystore');
      const destPath = path.join(keystoreDir, path.basename(sourcePath));

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied keystore to ${destPath}`);
      } else {
        console.warn(`Keystore not found at ${sourcePath}`);
      }

      return config;
    },
  ]);

  // Then, add the shared signing config to build.gradle
  config = withAppBuildGradle(config, (config) => {
    const keystoreFileName = props.keystorePath 
      ? path.basename(props.keystorePath)
      : 'release.keystore';
    
    const storePassword = process.env.KEYSTORE_PASSWORD;
    const keyAlias = process.env.KEY_ALIAS;
    const keyPassword = process.env.KEY_PASSWORD;

    if (!storePassword || !keyAlias || !keyPassword) {
      console.warn('Keystore credentials are not fully set in environment variables.');
      return config;
    }

    const sharedSigningConfig = `
        shared {
            storeFile file('keystore/${keystoreFileName}')
            storePassword '${storePassword}'
            keyAlias '${keyAlias}'
            keyPassword '${keyPassword}'
        }`;

    // Check if shared config already exists
    if (config.modResults.contents.includes('shared {')) {
      console.log('Shared signing config already exists in build.gradle');
    } else {
      // Add shared config after debug config in signingConfigs block
      config.modResults.contents = config.modResults.contents.replace(
        /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\})/,
        `$1${sharedSigningConfig}`
      );
      console.log('Added shared signing config to build.gradle');
    }

    // Update release buildType to use signingConfigs.shared instead of signingConfigs.debug
    if (config.modResults.contents.includes('release {') && 
        !config.modResults.contents.match(/release\s*\{[\s\S]*?signingConfig\s+signingConfigs\.shared/)) {
      config.modResults.contents = config.modResults.contents.replace(
        /(release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
        '$1signingConfig signingConfigs.shared'
      );
      console.log('Updated release build to use shared signing config');
    }

    return config;
  });

  return config;
}

module.exports = withAndroidKeystore;