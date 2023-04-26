# CronJob Commands

`node cron_job_scripts/delete_refresh_token.js`
`node cron_job_scripts/delete_fcm_token.js`

# Create database

npx sequelize db:create

# NOTE: With mysql inside docker, table name is case sensitive

# Migrate database:

npx sequelize db:migrate

# Seed database:

npx sequelize db:seed:all
