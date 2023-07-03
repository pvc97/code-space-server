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

# Run local

https://sixth-bridge-ab6.notion.site/Setup-code-space-backend-local-995191a685fd401eb0f0937de19d0cf4

# Deploy to digital ocean

https://sixth-bridge-ab6.notion.site/Setup-backend-digital-ocean-a61047c8609341b1b022091c2321b7bc
