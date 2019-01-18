const mongoose = require('mongoose');

const setup = mongoUrl => new Promise((resolve, reject) => {
  mongoose.connect(mongoUrl);

  mongoose.connection.on('connected', (error) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
});

module.exports = setup;
