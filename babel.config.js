module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/hooks': './src/hooks',
            '@/utils': './src/utils',
            '@/types': './src/types',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
