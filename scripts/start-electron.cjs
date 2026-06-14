const { spawn } = require("node:child_process");
const electronPath = require("electron");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ["."], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
  shell: false
});

child.on("error", (error) => {
  console.error(`Failed to start Electron: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Electron exited after signal ${signal}.`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code || 0;
});
