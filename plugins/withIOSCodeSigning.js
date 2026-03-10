const { withDangerousMod, withXcodeProject } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * iOS equivalent of withAndroidKeystore.
 *
 * Configures code-signing for the Release scheme by:
 *   1. Optionally copying a provisioning profile into the iOS project.
 *   2. Setting CODE_SIGN_IDENTITY, DEVELOPMENT_TEAM, PROVISIONING_PROFILE_SPECIFIER
 *      and CODE_SIGN_STYLE from environment variables on the Release build configuration.
 *
 * Environment variables consumed:
 *   IOS_CODE_SIGN_IDENTITY   – e.g. "Apple Distribution"  (default: "Apple Distribution")
 *   IOS_DEVELOPMENT_TEAM     – 10-char Apple Team ID       (required)
 *   IOS_PROVISIONING_PROFILE – profile specifier name       (optional, enables manual signing)
 *
 * Props (passed from app.json):
 *   provisioningProfilePath  – workspace-relative path to a .mobileprovision file to copy
 */
function withIOSCodeSigning(config, props = {}) {
  // Step 1: Copy provisioning profile into the iOS project (if provided)
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const profileSource = props.provisioningProfilePath
        ? path.join(projectRoot, props.provisioningProfilePath)
        : null;

      if (profileSource && fs.existsSync(profileSource)) {
        // Standard location that Xcode searches for embedded profiles
        const iosDir = path.join(projectRoot, "ios");
        const destPath = path.join(iosDir, path.basename(profileSource));
        fs.copyFileSync(profileSource, destPath);
        console.log(
          `[withIOSCodeSigning] Copied provisioning profile to ${destPath}`,
        );
      } else if (profileSource) {
        console.warn(
          `[withIOSCodeSigning] Provisioning profile not found at ${profileSource}`,
        );
      }

      return config;
    },
  ]);

  // Step 2: Configure code-signing build settings in the Xcode project
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;

    const codeSignIdentity =
      process.env.IOS_CODE_SIGN_IDENTITY || "Apple Distribution";
    const developmentTeam = process.env.IOS_DEVELOPMENT_TEAM;
    const provisioningProfile = process.env.IOS_PROVISIONING_PROFILE;

    if (!developmentTeam) {
      console.warn(
        "[withIOSCodeSigning] IOS_DEVELOPMENT_TEAM env variable is not set – skipping code-sign configuration.",
      );
      return config;
    }

    const xcBuildConfiguration = project.pbxXCBuildConfigurationSection();

    for (const key in xcBuildConfiguration) {
      const buildConfig = xcBuildConfiguration[key];

      // Only modify Release build configurations
      if (typeof buildConfig !== "string" && buildConfig.name === "Release") {
        const buildSettings = buildConfig.buildSettings;

        buildSettings.CODE_SIGN_IDENTITY = `"${codeSignIdentity}"`;
        buildSettings.DEVELOPMENT_TEAM = developmentTeam;

        if (provisioningProfile) {
          buildSettings.CODE_SIGN_STYLE = "Manual";
          buildSettings.PROVISIONING_PROFILE_SPECIFIER = `"${provisioningProfile}"`;
          console.log(
            "[withIOSCodeSigning] Configured manual code-signing for Release with profile:",
            provisioningProfile,
          );
        } else {
          buildSettings.CODE_SIGN_STYLE = "Automatic";
          console.log(
            "[withIOSCodeSigning] Configured automatic code-signing for Release with team:",
            developmentTeam,
          );
        }
      }
    }

    return config;
  });

  return config;
}

module.exports = withIOSCodeSigning;
