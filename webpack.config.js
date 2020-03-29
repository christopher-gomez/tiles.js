/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/lib/Engine.ts',
  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",

  resolve: { extensions: ['.js', '.jsx', '.tsx', '.ts', '.json'] },
  output: {
    path: path.resolve('dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /(node_modules)/,
        use: 'babel-loader',
      },
      {
        test: /\.md$/,
        use: 'raw-loader'
      }
    ],
  },
  externals: {
    "react": "React",
    "react-dom": "ReactDOM",
    "three": "THREE"
  }
};