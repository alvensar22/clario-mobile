const appJson = require('./app.json');
module.exports = {
  ...appJson,
  extra: {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  },
};
