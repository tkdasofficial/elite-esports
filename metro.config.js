const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  new RegExp(path.join(__dirname, "src/lib/db").replace(/\\/g, "/") + "/.*"),
  new RegExp(path.join(__dirname, "src/lib/api-zod").replace(/\\/g, "/") + "/.*"),
  new RegExp(path.join(__dirname, "src/lib/api-spec").replace(/\\/g, "/") + "/.*"),
  new RegExp(path.join(__dirname, "backend").replace(/\\/g, "/") + "/.*"),
];

module.exports = config;
