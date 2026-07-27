/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require("child_process");
const path = require("path");

const appRoot = path.resolve(__dirname, "..");
const nextBin = require.resolve("next/dist/bin/next");
const registerPath = path
  .resolve(__dirname, "register-userland-punycode.cjs")
  .replace(/\\/g, "/");
const requireOption = `--require "${registerPath}"`;
const existingNodeOptions = process.env.NODE_OPTIONS || "";

const child = spawnSync(process.execPath, [nextBin, ...process.argv.slice(2)], {
  cwd: appRoot,
  env: {
    ...process.env,
    NODE_OPTIONS: existingNodeOptions.includes(registerPath)
      ? existingNodeOptions
      : [existingNodeOptions, requireOption].filter(Boolean).join(" "),
  },
  stdio: "inherit",
});

if (child.error) {
  throw child.error;
}

if (child.signal) {
  process.kill(process.pid, child.signal);
}

process.exit(child.status ?? 1);
