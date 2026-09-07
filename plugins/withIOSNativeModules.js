const {
  withDangerousMod,
  withInfoPlist,
  withEntitlementsPlist,
  withXcodeProject,
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
 *   4. Sets STRIP_STYLE = non-global on the Runner target's Release config so
 *      the polygonid_flutter_sdk native module's Go-exported PLGN* symbols
 *      (only resolved at runtime via Dart FFI's dlsym/DynamicLibrary.process())
 *      survive the archive/App Store strip pass – otherwise they're stripped
 *      as "unused" (nothing in Obj-C/Swift/C references them directly) and
 *      registerer.createVC() fails in TestFlight/App Store builds with
 *      "Failed to lookup symbol 'PLGNBabyJubJubPrivate2Public'" even though
 *      it works fine when run from Xcode (Debug builds aren't stripped).
 */

function withIOSNativeModules(config) {
  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Step 1: Configure Info.plist \u2013 background modes
  //         and notification settings (mirrors the
  //         Android Firebase-messaging meta-data)
  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

    // FirebaseAppDelegateProxyEnabled \u2013 let Firebase swizzle methods automatically
    if (infoPlist.FirebaseAppDelegateProxyEnabled === undefined) {
      infoPlist.FirebaseAppDelegateProxyEnabled = true;
    }

    console.log(
      "[withIOSNativeModules] Configured Info.plist background modes & Firebase settings",
    );
    return config;
  });

  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Step 2: Add APS (push notifications) entitlement
  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  config = withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;

    // 'development' for debug, 'production' for release \u2013 Xcode auto-resolves via build config
    if (!entitlements["aps-environment"]) {
      entitlements["aps-environment"] = "production";
    }

    console.log(
      "[withIOSNativeModules] Configured push-notification entitlements",
    );
    return config;
  });

  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Step 3: Patch Podfile post_install block with
  //         build settings.
  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, "ios", "Podfile");

      if (!fs.existsSync(podfilePath)) {
        console.warn(
          "[withIOSNativeModules] Podfile not found \u2013 skipping Podfile patching",
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
    # \u2500\u2500\u2500 Added by withIOSNativeModules plugin (build settings) \u2500\u2500\u2500
    flutter_post_install(installer) if defined?(flutter_post_install)
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        # rapidsnark x86_64 static lib has missing ARM64 assembly symbols; force arm64 simulator via Rosetta
        build_config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'x86_64'
        # Minimum deployment target
        build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0' if build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 16.0
      end
    end
    # \u2500\u2500\u2500 End withIOSNativeModules (build settings) \u2500\u2500\u2500`;

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
          // No existing post_install \u2013 add one before the final `end`
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

  // ───────────────────────────────────────────────────────────────
  // Step 4: Set STRIP_STYLE = non-global for Release builds.
  //
  //         Go-exported symbols (PLGN*) from the polygonid_flutter_sdk
  //         native module are looked up at runtime via Dart FFI's
  //         DynamicLibrary.process() → dlsym(RTLD_DEFAULT, ...). Nothing
  //         in Obj-C/Swift/C calls them directly, so Xcode's default
  //         "All Symbols" strip style (applied on Archive/Release builds
  //         but not Debug runs from Xcode) removes them from the symbol
  //         table, causing dlsym to fail once the app is archived and
  //         distributed via App Store Connect / TestFlight.
  // ───────────────────────────────────────────────────────────────
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const xcBuildConfiguration = project.pbxXCBuildConfigurationSection();

    for (const key in xcBuildConfiguration) {
      const buildConfig = xcBuildConfiguration[key];

      if (typeof buildConfig !== "string" && buildConfig.name === "Release") {
        buildConfig.buildSettings.STRIP_STYLE = "non-global";
      }
    }

    console.log(
      "[withIOSNativeModules] Set STRIP_STYLE=non-global on Release build configurations",
    );

    return config;
  });

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
