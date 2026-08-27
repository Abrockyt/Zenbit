module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // react-native-reanimated v4 splits its Babel transform into the
    // separate react-native-worklets package (this replaces the old
    // 'react-native-reanimated/plugin' entry from v3). Must stay last.
    plugins: ["react-native-worklets/plugin"],
  };
};
