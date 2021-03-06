const path = require('path');

module.exports = {
  entry: {
    // Add src code here. This is just a test app. As we make more apps, add them here.
    '/dashboard/static/dashboard/js/Dashboard': './dashboard/src/main.tsx'
  },
  output: {
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, './')
  },
  module: {
    // This is so that css can be compiled into the react app.
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: { presets: ["@babel/preset-env", "@babel/preset-react"] }
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        loader: "ts-loader",
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [{
          loader: "style-loader",
        }, {
          loader: "css-loader",
        }, {
          loader: "sass-loader"
        }]
      }
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
};