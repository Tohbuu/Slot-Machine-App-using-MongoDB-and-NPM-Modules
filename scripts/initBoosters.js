require('dotenv').config();
const mongoose = require('mongoose');
const BoosterPack = require('../models/BoosterPack');

const mongoURI = process.env.MONGODB_URI;

(async () => {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await BoosterPack.initBoosters();
    console.log('Booster packs initialized with updated prices!');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing boosters:', err);
    process.exit(1);
  }
})();