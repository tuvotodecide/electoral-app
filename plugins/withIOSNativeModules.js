const {
  withDangerousMod,
  withInfoPlist,
  withEntitlementsPlist,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * iOS equivalent of withNativeModules (Android).
 *
 * GoogleService-Info.plist and permissions/entitlements are now handled
 * declaratively in app.json (ios.googleServicesFile, ios.infoPlist,
 * ios.entitlements).  This plugin only handles:
 *
 *   1. Configures Info.plist for Firebase Cloud Messaging (background modes,
 *      notification settings).
 *   2. Adds push-notification and remote-notification entitlements.
 *   3. Copies Flutter module frameworks from the external build directory
 *      into ios/Flutter/ and generates a local podspec so CocoaPods can
 *      link & embed them automatically.
 *   4. Patches the Podfile to include additional pod dependencies
 *      (Flutter module podspec, Sentry) and build-setting tweaks.
 */

/** Relative path (from project root) to the Flutter module framework output */
const FLUTTER_FRAMEWORK_SOURCE = path.join(
  "..",
  "wira-sdk-flutter-component",
  "build",
  "ios",
  "framework",
);
function withIOSNativeModules(config) {
  // ──────────────────────────────────────────────
  // Step 1: Configure Info.plist – background modes
  //         and notification settings (mirrors the
  //         Android Firebase-messaging meta-data)
  // ──────────────────────────────────────────────
  config = withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;

    // Enable remote-notification background mode (required for silent pushes)
    const bgModes = infoPlist.UIBackgroundModes || [];
    if (!bgModes.includes("remote-notification")) {
      bgModes.push("remote-notification");
    }
    if (!bgModes.includes("fetch")) {
      bgModes.push("fetch");
    }
    infoPlist.UIBackgroundModes = bgModes;

    // FirebaseAppDelegateProxyEnabled – let Firebase swizzle methods automatically
    if (infoPlist.FirebaseAppDelegateProxyEnabled === undefined) {
      infoPlist.FirebaseAppDelegateProxyEnabled = true;
    }

    console.log(
      "[withIOSNativeModules] Configured Info.plist background modes & Firebase settings",
    );
    return config;
  });

  // ──────────────────────────────────────────────
  // Step 2: Add APS (push notifications) entitlement
  // ──────────────────────────────────────────────
  config = withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;

    // 'development' for debug, 'production' for release – Xcode auto-resolves via build config
    if (!entitlements["aps-environment"]) {
      entitlements["aps-environment"] = "production";
    }

    console.log(
      "[withIOSNativeModules] Configured push-notification entitlements",
    );
    return config;
  });

  // ──────────────────────────────────────────────
  // Step 3: Copy Flutter module frameworks &
  //         generate a local podspec for them
  // ──────────────────────────────────────────────
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const frameworkSrc = path.resolve(projectRoot, FLUTTER_FRAMEWORK_SOURCE);
      const iosDir = path.join(projectRoot, "ios");
      const frameworkDest = path.join(iosDir, "Flutter");

      if (!fs.existsSync(frameworkSrc)) {
        console.warn(
          `[withIOSNativeModules] Flutter framework source not found at ${frameworkSrc} – ` +
            "skipping framework copy. Build the Flutter module first.",
        );
        return config;
      }

      // The Flutter build outputs three configuration folders:
      //   Debug/   – for development builds
      //   Profile/ – for profiling builds
      //   Release/ – for App Store / production builds
      const buildModes = ["Debug", "Profile", "Release"];
      const frameworksByMode = {};

      for (const mode of buildModes) {
        const modeSrc = path.join(frameworkSrc, mode);
        const modeDest = path.join(frameworkDest, mode);

        if (!fs.existsSync(modeSrc)) {
          console.warn(
            `[withIOSNativeModules] ${mode}/ folder not found in ${frameworkSrc}`,
          );
          continue;
        }

        if (!fs.existsSync(modeDest)) {
          fs.mkdirSync(modeDest, { recursive: true });
        }

        const entries = fs.readdirSync(modeSrc);
        const fwEntries = entries.filter(
          (e) => e.endsWith(".framework") || e.endsWith(".xcframework"),
        );

        if (fwEntries.length === 0) {
          console.warn(
            `[withIOSNativeModules] No .framework/.xcframework found in ${modeSrc}`,
          );
          continue;
        }

        for (const entry of fwEntries) {
          copyDirSync(path.join(modeSrc, entry), path.join(modeDest, entry));
        }

        frameworksByMode[mode] = fwEntries;
        console.log(
          `[withIOSNativeModules] Copied ${fwEntries.length} framework(s) from ${mode}/ → ios/Flutter/${mode}/`,
        );
      }

      // --- Generate local podspec that selects frameworks per build configuration ---
      // Use Release as the canonical list (must always be present).
      const referenceMode = frameworksByMode["Release"]
        ? "Release"
        : Object.keys(frameworksByMode)[0];

      if (!referenceMode) {
        console.warn(
          "[withIOSNativeModules] No frameworks found in any build mode – skipping podspec generation",
        );
        return config;
      }

      const referenceFrameworks = frameworksByMode[referenceMode];
      const vendoredLines = referenceFrameworks.map(
        (f) => `"Flutter/Release/${f}"`,
      );

      // Build the script phase that swaps frameworks based on CONFIGURATION
      const frameworkNames = referenceFrameworks.map((f) => `"${f}"`).join(" ");

      const podspecContent = `
Pod::Spec.new do |s|
  s.name         = 'WiraFlutterModule'
  s.version      = '1.0.0'
  s.summary      = 'Flutter module frameworks for wira-sdk'
  s.homepage     = 'https://github.com/user/wira-sdk'
  s.license      = { :type => 'Proprietary' }
  s.author       = 'wira-sdk'
  s.source       = { :path => '.' }
  s.ios.deployment_target = '15.1'
  s.static_framework = false

  # Default to Release frameworks (overridden at build time by the script phase below)
  s.vendored_frameworks = ${vendoredLines.join(",\n                          ")}

  # Preserve all three build-mode folders so they are available at build time
  s.preserve_paths = 'Flutter/Debug/**', 'Flutter/Profile/**', 'Flutter/Release/**'

  # Script phase: copy the correct configuration's frameworks before compilation
  s.script_phase = {
    :name => 'Select Flutter Framework Configuration',
    :script => %q(
      FLUTTER_ROOT="\${PODS_ROOT}/../Flutter"
      FRAMEWORKS=(${frameworkNames})

      # Map Xcode CONFIGURATION to the Flutter build mode folder
      if [ "\${CONFIGURATION}" = "Debug" ]; then
        MODE="Debug"
      elif [ "\${CONFIGURATION}" = "Profile" ]; then
        MODE="Profile"
      else
        MODE="Release"
      fi

      echo "[WiraFlutterModule] Using $MODE frameworks for configuration \${CONFIGURATION}"

      for FW in "\${FRAMEWORKS[@]}"; do
        SRC="\${FLUTTER_ROOT}/\${MODE}/\${FW}"
        DST="\${FLUTTER_ROOT}/Release/\${FW}"
        if [ -d "$SRC" ] && [ "$MODE" != "Release" ]; then
          rm -rf "$DST"
          cp -R "$SRC" "$DST"
        fi
      done
    ),
    :execution_position => :before_compile,
  }

  # Disable bitcode (Flutter does not support it)
  s.pod_target_xcconfig = {
    'ENABLE_BITCODE' => 'NO',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386 x86_64',
  }
  s.user_target_xcconfig = {
    'ENABLE_BITCODE' => 'NO',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
  }
end
`.trimStart();

      const podspecPath = path.join(iosDir, "WiraFlutterModule.podspec");
      fs.writeFileSync(podspecPath, podspecContent, "utf-8");
      console.log(`[withIOSNativeModules] Generated ${podspecPath}`);

      return config;
    },
  ]);

  // ──────────────────────────────────────────────
  // Step 4: Patch Podfile – add pod dependencies
  //         and build settings (equivalent to the
  //         Android Gradle dependency / repository
  //         modifications)
  // ──────────────────────────────────────────────
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, "ios", "Podfile");

      if (!fs.existsSync(podfilePath)) {
        console.warn(
          "[withIOSNativeModules] Podfile not found – skipping Podfile patching",
        );
        return config;
      }

      let podfileContents = fs.readFileSync(podfilePath, "utf-8");

      // ---- Additional pods (Sentry, Flutter module) ----
      const additionalPods = `
  # ─── Added by withIOSNativeModules plugin ───
  pod 'WiraFlutterModule', :path => '.'
  # ─── End withIOSNativeModules ───`;

      if (!podfileContents.includes("Added by withIOSNativeModules plugin")) {
        // Insert additional pods right after the first `use_expo_modules!` or
        // after the main target … do block.
        const targetBlockPattern = /(target\s+['"][^'"]+['"]\s+do\s*\n)/;
        if (targetBlockPattern.test(podfileContents)) {
          podfileContents = podfileContents.replace(
            targetBlockPattern,
            `$1${additionalPods}\n`,
          );
        }
      }

      // ---- Post-install build-setting tweaks ----
      const postInstallTweaks = `
    # ─── Added by withIOSNativeModules plugin (build settings) ───
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        # rapidsnark x86_64 static lib has missing ARM64 assembly symbols; force arm64 simulator via Rosetta
        build_config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'x86_64'
        # Minimum deployment target
        build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1' if build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.1
      end
    end

    # Convert binary plists to XML to prevent "invalid byte sequence in UTF-8" in react_native_post_install.
    # react_native_post_install runs find for all Info.plist files under the project directory;
    # binary plists inside vendored .framework bundles crash xcodeproj's UTF-8 regex.
    ios_dir = File.dirname(__FILE__)
    Dir.glob(File.join(ios_dir, '**', 'Info.plist')).each do |plist_path|
      next unless File.file?(plist_path)
      content = File.read(plist_path, encoding: 'ASCII-8BIT')
      if content.start_with?('bplist')
        system('plutil', '-convert', 'xml1', plist_path)
      end
    end
    # ─── End withIOSNativeModules (build settings) ───`;

      if (
        !podfileContents.includes(
          "Added by withIOSNativeModules plugin (build settings)",
        )
      ) {
        // Append inside the existing post_install block, or create a new one
        const postInstallPattern = /(post_install\s+do\s+\|installer\|)/;
        if (postInstallPattern.test(podfileContents)) {
          podfileContents = podfileContents.replace(
            postInstallPattern,
            `$1\n${postInstallTweaks}`,
          );
        } else {
          // No existing post_install – add one before the final `end`
          podfileContents = podfileContents.replace(
            /(\nend\s*$)/m,
            `\n  post_install do |installer|${postInstallTweaks}\n  end$1`,
          );
        }
      }

      fs.writeFileSync(podfilePath, podfileContents, "utf-8");
      console.log(
        "[withIOSNativeModules] Patched Podfile with additional pods and build settings",
      );

      return config;
    },
  ]);

  return config;
}

/**
 * Recursively copy a directory (handles .framework / .xcframework bundles).
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = withIOSNativeModules;
