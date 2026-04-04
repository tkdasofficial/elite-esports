const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Merge workspace root into Expo's default watchFolders (do NOT replace them)
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Exclude directories that should not be watched by Metro
config.resolver.blockList = [
  new RegExp(`${workspaceRoot.replace(/\//g, '\\/')}\\/.local\\/.*`),
  /node_modules_pnpm_old\/.*/,
  /supabase\/.temp\/.*/,
];

// Production bundle optimisations: minify and tree-shake dead code
if (process.env.NODE_ENV === 'production') {
  config.transformer = {
    ...config.transformer,
    minifierConfig: {
      compress: {
        reduce_funcs: false,
        dead_code: true,
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: true,
    },
  };
}

module.exports = config;
