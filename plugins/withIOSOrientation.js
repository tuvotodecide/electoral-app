const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withIOSOrientation(config) {
  return withDangerousMod(config, ["ios", async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosDir = path.join(projectRoot, "ios");

    if (!fs.existsSync(iosDir)) {
      console.warn(
        "[withIOSOrientation] ios/ directory not found – skipping iOS orientation patch",
      );
      return config;
    }

    patchBridgingHeaders(iosDir);
    patchAppDelegates(iosDir);

    return config;
  }]);
}

function patchBridgingHeaders(iosDir) {
  const bridgingHeaders = fs
    .readdirSync(iosDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      path.join(iosDir, entry.name, `${entry.name}-Bridging-Header.h`),
    )
    .filter((filePath) => fs.existsSync(filePath));

  if (bridgingHeaders.length === 0) {
    console.warn(
      "[withIOSOrientation] No *-Bridging-Header.h file found – skipping bridging header patch",
    );
    return;
  }

  const importLine = '#import "Orientation.h"';

  for (const headerPath of bridgingHeaders) {
    const contents = fs.readFileSync(headerPath, "utf-8");
    if (contents.includes(importLine)) {
      continue;
    }

    const lineEnding = contents.includes("\r\n") ? "\r\n" : "\n";
    const trimmed = contents.replace(/\s+$/g, "");
    const nextContents = `${trimmed}${lineEnding}${importLine}${lineEnding}`;

    fs.writeFileSync(headerPath, nextContents, "utf-8");
    console.log(`[withIOSOrientation] Added ${importLine} to ${headerPath}`);
  }
}

function patchAppDelegates(iosDir) {
  const appDelegates = fs
    .readdirSync(iosDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(iosDir, entry.name, "AppDelegate.swift"))
    .filter((filePath) => fs.existsSync(filePath));

  if (appDelegates.length === 0) {
    console.warn(
      "[withIOSOrientation] No AppDelegate.swift file found – skipping orientation method patch",
    );
    return;
  }

  const signature =
    "public override func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask";
  const returnLine = "return Orientation.getOrientation()";

  const methodBlock = [
    "  public override func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {",
    "    return Orientation.getOrientation()",
    "  }",
  ].join("\n");

  for (const appDelegatePath of appDelegates) {
    let contents = fs.readFileSync(appDelegatePath, "utf-8");

    if (contents.includes(signature) && contents.includes(returnLine)) {
      continue;
    }

    const generatedSectionPattern = /(\n\s*\/\/ Linking API[\s\S]*?\n\s*\/\/ Universal Links)/;
    const classEndPattern = /(\n\}\n\nclass\s+ReactNativeDelegate:)/;

    if (generatedSectionPattern.test(contents)) {
      contents = contents.replace(generatedSectionPattern, `\n${methodBlock}$1`);
    } else if (classEndPattern.test(contents)) {
      contents = contents.replace(classEndPattern, `\n${methodBlock}$1`);
    } else {
      console.warn(
        `[withIOSOrientation] Could not find insertion point in ${appDelegatePath} – skipping`,
      );
      continue;
    }

    fs.writeFileSync(appDelegatePath, contents, "utf-8");
    console.log(
      `[withIOSOrientation] Added orientation override method to ${appDelegatePath}`,
    );
  }
}

module.exports = withIOSOrientation;
