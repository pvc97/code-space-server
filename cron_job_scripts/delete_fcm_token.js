const CronJob = require('cron').CronJob;

const { FCMToken, Sequelize } = require('../models');

// Run every day at 10:30 PM
const job = new CronJob('00 30 22 * * 0-6', async () => {
  const now = new Date();

  console.log(`Delete expired FCM token at: ${now.toISOString()}`);

  await FCMToken.destroy({
    where: {
      expiresAt: { [Sequelize.Op.lte]: now },
    },
  });
});

job.start();
