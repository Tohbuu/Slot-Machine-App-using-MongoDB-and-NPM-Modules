require('dotenv').config();
const mongoose = require('mongoose');
const Reward = require('../models/Reward');
const BoosterPack = require('../models/BoosterPack');

const mongoURI = process.env.MONGODB_URI;

// Calculate reward amounts based on level
function calculateRewards(level) {
  const baseCredits = 1000;
  const multiplier = Math.floor(level / 5) + 1; // Increases every 5 levels
  const credits = baseCredits * multiplier * (level <= 10 ? 1 : Math.floor(level / 10));
  
  return {
    credits: Math.floor(credits),
    shouldGetBooster: level % 10 === 0, // Every 10 levels
    shouldGetUnlock: level % 25 === 0,  // Every 25 levels
    isPremium: level % 50 === 0         // Every 50 levels
  };
}

async function initRewards() {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Get available boosters
    const boosters = await BoosterPack.find().sort({ levelRequired: 1 });
    
    // Clear existing rewards
    await Reward.deleteMany({});
    
    const rewards = [];
    
    for (let level = 1; level <= 100; level++) {
      const rewardData = calculateRewards(level);
      
      const reward = {
        level: level,
        rewards: {
          credits: rewardData.credits,
          boosterPacks: [],
          unlocks: []
        },
        isPremium: rewardData.isPremium
      };
      
      // Add booster packs every 10 levels
      if (rewardData.shouldGetBooster && boosters.length > 0) {
        const boosterIndex = Math.floor((level - 10) / 10) % boosters.length;
        const selectedBooster = boosters[boosterIndex];
        
        reward.rewards.boosterPacks.push({
          pack: selectedBooster._id,
          quantity: level >= 50 ? 2 : 1
        });
      }
      
      // Add unlocks every 25 levels
      if (rewardData.shouldGetUnlock) {
        const unlocks = ['golden_spinner', 'vip_badge', 'exclusive_theme', 'animated_avatar'];
        const unlockIndex = Math.floor((level - 25) / 25) % unlocks.length;
        reward.rewards.unlocks.push(unlocks[unlockIndex]);
      }
      
      // Special rewards for milestone levels
      if (level === 25) {
        reward.rewards.unlocks.push('bronze_frame');
      } else if (level === 50) {
        reward.rewards.unlocks.push('silver_frame');
        reward.rewards.credits *= 2; // Double credits
      } else if (level === 75) {
        reward.rewards.unlocks.push('gold_frame');
        reward.rewards.credits *= 2;
      } else if (level === 100) {
        reward.rewards.unlocks.push('legendary_frame');
        reward.rewards.credits *= 5; // 5x credits for max level
        // Add multiple boosters
        boosters.forEach(booster => {
          reward.rewards.boosterPacks.push({
            pack: booster._id,
            quantity: 3
          });
        });
      }
      
      rewards.push(reward);
    }
    
    await Reward.insertMany(rewards);
    console.log('Successfully created 100 levels of rewards!');
    
    // Show some examples
    console.log('\nSample rewards:');
    console.log('Level 1:', rewards[0]);
    console.log('Level 25:', rewards[24]);
    console.log('Level 50:', rewards[49]);
    console.log('Level 100:', rewards[99]);
    
    process.exit(0);
  } catch (err) {
    console.error('Error initializing rewards:', err);
    process.exit(1);
  }
}

initRewards();