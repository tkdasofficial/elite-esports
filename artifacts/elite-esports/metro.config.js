const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Exclude directories that should not be watched by Metro
config.resolver.blockList = [
  // Ignore the .local directory (agent skills, temp files, state)
  new RegExp(`${workspaceRoot.replace(/\//g, '\\/')}\\/.local\\/.*`),
  // Ignore old pnpm node_modules directories
  /node_modules_pnpm_old\/.*/,
  // Ignore supabase temp files
  /supabase\/.temp\/.*/,
];

module.exports = config;
