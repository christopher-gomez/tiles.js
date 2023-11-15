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
    filename: 'tiles.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules\/(?!three)/,
        use: 'babel-loader',
      },
      {
        test: /\.md$/,
        use: 'raw-loader'
      },
      {
        test: /\.(glb|gltf|fbx)$/,
        use:
          [
            {
              loader: 'file-loader',
              options:
              {
                outputPath: 'assets/'
              }
            }
          ]
      },
    ],
  },
  externals: {
    "react": "React",
    "react-dom": "ReactDOM",
    "three": "THREE"
  }
};