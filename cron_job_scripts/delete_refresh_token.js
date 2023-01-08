const CronJob = require('cron').CronJob;
const { RefreshToken, Sequelize } = require('../models');

// Run every day at 11:30 PM
const job = new CronJob('00 30 23 * * 0-6', async () => {
  const now = new Date();

  console.log(`Cron job running at: ${now.toISOString()}`);

  await RefreshToken.destroy({
    where: {
      expiresAt: { [Sequelize.Op.lte]: now },
    },
  });
});

job.start();
