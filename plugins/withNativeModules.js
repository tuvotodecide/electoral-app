const { withProjectBuildGradle, withAppBuildGradle, withGradleProperties, withAndroidManifest, withAndroidColors } = require('@expo/config-plugins');

/**
 * Config plugin to add native module dependencies
 */
function withNativeModules(config) {
  // Step -2: Add custom colors to colors.xml
  config = withAndroidColors(config, (config) => {
    // Define the colors to add/update
    const customColors = {
      bootsplash_background: '#ffffff',
      colorPrimary: '#2790b0',
      colorPrimaryDark: '#1976D2',
      colorAccent: '#2790b0',
      white: '#FFFFFF',
      black: '#000000',
      notification_color: '#2790b0',
    };

    // Add or update each color
    for (const [name, value] of Object.entries(customColors)) {
      const existingColor = config.modResults.resources.color?.find(
        (color) => color.$?.name === name
      );

      if (existingColor) {
        existingColor._ = value;
      } else {
        if (!config.modResults.resources.color) {
          config.modResults.resources.color = [];
        }
        config.modResults.resources.color.push({
          $: { name },
          _: value,
        });
      }
    }

    return config;
  });

  // Step -1: Add Firebase messaging meta-data to AndroidManifest
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];

    // Add meta-data for Firebase messaging default notification icon
    const iconMetaData = {
      $: {
        'android:name': 'com.google.firebase.messaging.default_notification_icon',
        'android:resource': '@mipmap/ic_launcher',
      },
    };

    // Add meta-data for Firebase messaging default notification color
    const colorMetaData = {
      $: {
        'android:name': 'com.google.firebase.messaging.default_notification_color',
        'android:resource': '@color/colorAccent',
        'tools:replace': 'android:resource',
      },
    };

    // Add tools namespace to manifest if not present
    if (!config.modResults.manifest.$['xmlns:tools']) {
      config.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Initialize meta-data array if it doesn't exist
    if (!mainApplication['meta-data']) {
      mainApplication['meta-data'] = [];
    }

    // Check if meta-data already exists before adding
    const hasIconMeta = mainApplication['meta-data'].some(
      (meta) => meta.$['android:name'] === 'com.google.firebase.messaging.default_notification_icon'
    );
    const hasColorMeta = mainApplication['meta-data'].some(
      (meta) => meta.$['android:name'] === 'com.google.firebase.messaging.default_notification_color'
    );

    if (!hasIconMeta) {
      mainApplication['meta-data'].push(iconMetaData);
    }
    if (!hasColorMeta) {
      mainApplication['meta-data'].push(colorMetaData);
    }

    return config;
  });
  // Step 0: Configure Gradle JVM args to avoid Java heap space errors
  config = withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'org.gradle.jvmargs')
    );
    config.modResults.push({
      type: 'property',
      key: 'org.gradle.jvmargs',
      value: '-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dkotlin.daemon.jvm.options=-Xmx1024m',
    });
    
    // Remove x86/x86_64 architectures - only keep ARM for production (reduces AAB size by ~100MB)
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'reactNativeArchitectures')
    );
    config.modResults.push({
      type: 'property',
      key: 'reactNativeArchitectures',
      value: 'armeabi-v7a,arm64-v8a',
    });
    
    return config;
  });

  // Step 1: Add repositories to project-level build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addRepositories(config.modResults.contents);
    }
    return config;
  });

  // Step 2: Add dependencies to app-level build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addDependencies(config.modResults.contents);
    }
    return config;
  });

  return config;
}

function addRepositories(contents) {
  // Check if already added
  if (contents.includes('wira_flutter_module')) {
    return contents;
  }

  // Add Sentry gradle plugin classpath to buildscript dependencies
  if (!contents.includes('sentry-android-gradle-plugin')) {
    const sentryClasspath = `classpath('io.sentry:sentry-android-gradle-plugin:4.14.1')`;
    const buildscriptDepsPattern = /(buildscript\s*\{[\s\S]*?dependencies\s*\{[\s\S]*?)([\s]*\}[\s]*\})/;
    contents = contents.replace(
      buildscriptDepsPattern,
      `$1\n    ${sentryClasspath}$2`
    );
  }

  const storageUrlDef = `def storageUrl = System.env.FLUTTER_STORAGE_BASE_URL ?: "https://storage.googleapis.com"`;

  // Replace the entire repositories block with the new content
  const newRepositories = `
    // Native module repositories
    maven {url file('C:/apps/sdk-flutter-example/build/host/outputs/repo') }
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
    maven { url "$storageUrl/download.flutter.io" }
    maven {
      url "$rootDir/../node_modules/@notifee/react-native/android/libs"
    }`;

  // Add storageUrl definition before allprojects block if not present
  if (!contents.includes('FLUTTER_STORAGE_BASE_URL')) {
    contents = contents.replace(
      /allprojects\s*\{/,
      `${storageUrlDef}\n\nallprojects {`
    );
  }

  // Replace the repositories block
  const repositoriesPattern = /allprojects\s*\{\s*repositories\s*\{[\s\S]*?\}/;
  contents = contents.replace(
    repositoriesPattern,
    `allprojects {\n  repositories {${newRepositories}`
  );

  // Dependency resolution strategy to map legacy package_info_plus coordinates
  const resolutionStrategy = `
// Map the legacy package_info_plus coordinates to the actual published group in the local Flutter repo.
// This is needed because polygonid_flutter_sdk transitively depends on package_info_plus with old coordinates.
subprojects {
  configurations.all { config ->
    config.resolutionStrategy.eachDependency { details ->
      if (details.requested.group == 'io.flutter.plugins.packageinfo' &&
          details.requested.name == 'package_info_plus_release') {
        details.useTarget('dev.fluttercommunity.plus.packageinfo:package_info_plus_release:1.0')
      }
    }
  }
}`;

  // Add resolution strategy after the apply plugin lines at the end
  if (!contents.includes('resolutionStrategy.eachDependency')) {
    const applyPluginPattern = /(apply plugin: "com\.facebook\.react\.rootproject")/;
    if (applyPluginPattern.test(contents)) {
      contents = contents.replace(
        applyPluginPattern,
        `$1\n${resolutionStrategy}`
      );
    }
  }

  return contents;
}

function addDependencies(contents) {
  // Check if already added
  if (contents.includes('wira_flutter_module')) {
    return contents;
  }

  const flutterDeps = `
    // Flutter module dependencies for wira-sdk
    releaseImplementation 'com.example.wira_flutter_module:flutter_release:1.0'

    // Sentry dependencies
    implementation platform("io.sentry:sentry-bom:8.31.0")
    implementation "io.sentry:sentry-android"
    implementation "io.sentry:sentry-okhttp"
`;

  // Find the dependencies block and add the Flutter dependencies
  const dependenciesPattern = /(dependencies\s*\{)/;
  
  if (dependenciesPattern.test(contents)) {
    contents = contents.replace(
      dependenciesPattern,
      `$1${flutterDeps}`
    );
  }

  // Add pickFirst rules to handle duplicate native libraries from Flutter module
  if (!contents.includes('librapidsnark.so')) {
    const packagingPattern = /(packagingOptions\s*\{\s*\n\s*jniLibs\s*\{[^}]*useLegacyPackaging[^}]*\})/;
    
    if (packagingPattern.test(contents)) {
      contents = contents.replace(
        packagingPattern,
        `packagingOptions {
        jniLibs {
            def enableLegacyPackaging = findProperty('expo.useLegacyPackaging') ?: 'false'
            useLegacyPackaging enableLegacyPackaging.toBoolean()
            // Handle duplicate native libraries from Flutter module dependencies
            pickFirsts += ['**/librapidsnark.so', '**/libgmp.so', '**/libcircom_witnesscalc.so']
        }`
      );
    }
  }

  return contents;
}

module.exports = withNativeModules;
