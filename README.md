# Command to delete expired refresh tokens

node cron_job_scripts/delete_refresh_token.js

# create database
npx sequelize db:create

# NOTE: With mysql inside docker, table name is case sensitive

# Migrate order:

npx sequelize db:migrate

# Seed order:

npx sequelize db:seed:all
