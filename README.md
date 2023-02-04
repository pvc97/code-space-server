# Command to delete expired refresh tokens

node cron_job_scripts/delete_refresh_token.js

# Migrate order:

npx sequelize db:migrate --name create_role.js
npx sequelize db:migrate --name create_user.js
npx sequelize db:migrate --name create_refresh_token.js
npx sequelize db:migrate --name create_language.js
npx sequelize db:migrate --name create_course.js
npx sequelize db:migrate --name create_student_course.js
npx sequelize db:migrate --name create_problem.js

# Seed order:

npx sequelize db:seed --seed create_role.js
npx sequelize db:seed --seed create_user.js
npx sequelize db:seed --seed create_language.js
npx sequelize db:seed --seed create_course.js
npx sequelize db:seed --seed create_student_course.js
npx sequelize db:seed --seed create_problem.js
