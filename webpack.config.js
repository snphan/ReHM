const path = require('path');

module.exports = {
  entry: {
    // Add src code here. This is just a test app. As we make more apps, add them here.
    'ReHM_dashboard/accounts/static/accounts/js/TestApp': './ReHM_dashboard/accounts/src/js/TestApp.jsx'
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
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};