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

// Stub out native-only modules on web to prevent bundling errors.
// These modules contain native components that cannot run in a browser.
const WEB_NATIVE_STUBS = new Set([
  'react-native-google-mobile-ads',
]);

const _defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_NATIVE_STUBS.has(moduleName)) {
    return { type: 'empty' };
  }
  if (_defaultResolveRequest) {
    return _defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
