const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/lib/tm.ts',
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
    ],
  },
  externals: {
    "react": "React",
    "react-dom": "ReactDOM",
    "three": "THREE"
  }
};