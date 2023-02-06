# Command to delete expired refresh tokens

node cron_job_scripts/delete_refresh_token.js

# Migrate order:

npx sequelize db:migrate

# Seed order:

npx sequelize db:seed:all
