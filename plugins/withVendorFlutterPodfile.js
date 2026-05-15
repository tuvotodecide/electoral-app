const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const FLUTTER_APPLICATION_PATH = "../vendor/wira-sdk-flutter-component";
const PODHELPER_RELATIVE_PATH = path.join(
  "vendor",
  "wira-sdk-flutter-component",
  ".ios",
  "Flutter",
  "podhelper.rb",
);
const DESIRED_PATH_LINE = `flutter_application_path = '${FLUTTER_APPLICATION_PATH}'`;
const DESIRED_PODHELPER_BLOCK = `podhelper = File.join(flutter_application_path, '.ios', 'Flutter', 'podhelper.rb')
unless File.exist?(podhelper)
  raise "[withVendorFlutterPodfile] Missing #{podhelper}"
end
load podhelper`;

function withVendorFlutterPodfile(config) {
  return withDangerousMod(config, [
    "ios",
    async currentConfig => {
      const projectRoot = currentConfig.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, "ios", "Podfile");
      const podhelperPath = path.join(projectRoot, PODHELPER_RELATIVE_PATH);

      if (!fs.existsSync(podfilePath)) {
        throw new Error(
          `[withVendorFlutterPodfile] Podfile not found at ${podfilePath}. Run Expo prebuild before applying this plugin.`,
        );
      }

      if (!fs.existsSync(podhelperPath)) {
        throw new Error(
          `[withVendorFlutterPodfile] Missing ${podhelperPath}. The vendor ZIP must contain vendor/wira-sdk-flutter-component/.ios/Flutter/podhelper.rb.`,
        );
      }

      let podfileContents = fs.readFileSync(podfilePath, "utf8");

      if (
        podfileContents.includes(DESIRED_PATH_LINE) &&
        podfileContents.includes(DESIRED_PODHELPER_BLOCK)
      ) {
        return currentConfig;
      }

      const combinedLegacyBlockPattern =
        /flutter_application_path\s*=\s*['"][^'"]*wira-sdk-flutter-component['"]\s*\n(?:podhelper\s*=\s*File\.join\(flutter_application_path,\s*['"]\.ios['"],\s*['"]Flutter['"],\s*['"]podhelper\.rb['"]\)\s*\n(?:unless File\.exist\?\(podhelper\)\s*\n.*\nend\s*\n)?load podhelper|load File\.join\(flutter_application_path,\s*['"]\.ios['"],\s*['"]Flutter['"],\s*['"]podhelper\.rb['"]\))\s*\n?/g;
      const legacyLoadOnlyPattern =
        /load File\.join\(flutter_application_path,\s*['"]\.ios['"],\s*['"]Flutter['"],\s*['"]podhelper\.rb['"]\)\s*\n?/g;

      podfileContents = podfileContents.replace(combinedLegacyBlockPattern, "");
      podfileContents = podfileContents.replace(legacyLoadOnlyPattern, "");

      const platformPattern = /(platform\s+:ios[^\n]*\n)/;
      if (!platformPattern.test(podfileContents)) {
        throw new Error(
          "[withVendorFlutterPodfile] Could not find the iOS platform declaration in Podfile.",
        );
      }

      podfileContents = podfileContents.replace(
        platformPattern,
        `$1${DESIRED_PATH_LINE}\n${DESIRED_PODHELPER_BLOCK}\n`,
      );

      fs.writeFileSync(podfilePath, podfileContents, "utf8");

      return currentConfig;
    },
  ]);
}

module.exports = withVendorFlutterPodfile;
