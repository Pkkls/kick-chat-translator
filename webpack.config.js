const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: false,
  entry: {
    'content/index': './src/content/index.ts',
    'background/serviceWorker': './src/background/serviceWorker.ts',
    'popup/popup': './src/popup/popup.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // Force all non-ASCII chars to \uXXXX escapes -> pure ASCII output
          output: { ascii_only: true },
        },
      }),
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/popup/popup.html', to: 'popup/popup.html' },
        { from: 'src/popup/popup.css', to: 'popup/popup.css' },
        { from: 'public', to: '../public' },
        { from: 'manifest.json', to: '../manifest.json' },
      ],
    }),
  ],
  externals: {
    chrome: 'chrome',
  },
};
