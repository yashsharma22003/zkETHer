const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle noble/hashes warnings
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
