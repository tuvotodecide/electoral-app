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
 *   3. Patches the Podfile post_install block with build-setting tweaks.
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
  // Step 3: Patch Podfile post_install block with
  //         build settings.
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

      // ---- Ensure Flutter podhelper lines are present ----
      const flutterPathLine =
        "flutter_application_path = '../../wira-sdk-flutter-component'";
      const flutterLoadLine =
        "load File.join(flutter_application_path, '.ios', 'Flutter', 'podhelper.rb')";

      if (!podfileContents.includes(flutterPathLine)) {
        const platformPattern = /(platform\s+:ios[^\n]*\n)/;
        if (platformPattern.test(podfileContents)) {
          podfileContents = podfileContents.replace(
            platformPattern,
            `$1\n${flutterPathLine}\n${flutterLoadLine}\n`,
          );
        }
      } else if (!podfileContents.includes(flutterLoadLine)) {
        const flutterPathPattern = /(flutter_application_path\s*=\s*['"][^'"]+['"]\n)/;
        if (flutterPathPattern.test(podfileContents)) {
          podfileContents = podfileContents.replace(
            flutterPathPattern,
            `$1${flutterLoadLine}\n`,
          );
        }
      }

      // ---- Ensure Flutter pods are installed in app target ----
      const installFlutterPodsLine =
        "  install_all_flutter_pods(flutter_application_path)";

      if (!podfileContents.includes(installFlutterPodsLine.trim())) {
        const targetBlockPattern = /(target\s+['"][^'"]+['"]\s+do\s*\n)/;
        if (targetBlockPattern.test(podfileContents)) {
          podfileContents = podfileContents.replace(
            targetBlockPattern,
            `$1${installFlutterPodsLine}\n\n`,
          );
        }
      }

      // ---- Post-install build-setting tweaks ----
      const postInstallTweaks = `
    # ─── Added by withIOSNativeModules plugin (build settings) ───
    flutter_post_install(installer) if defined?(flutter_post_install)
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        # rapidsnark x86_64 static lib has missing ARM64 assembly symbols; force arm64 simulator via Rosetta
        build_config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'x86_64'
        # Minimum deployment target
        build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0' if build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 16.0
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
        "[withIOSNativeModules] Patched Podfile post_install build settings",
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
