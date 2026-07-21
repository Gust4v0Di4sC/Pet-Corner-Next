/* eslint-disable @typescript-eslint/no-require-imports */
const Module = require("module");

const originalLoad = Module._load;
const userlandPunycode = require("punycode/");

Module._load = function loadWithUserlandPunycode(request) {
  if (request === "punycode" || request === "node:punycode") {
    return userlandPunycode;
  }

  return originalLoad.apply(this, arguments);
};
