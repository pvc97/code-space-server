const ACCESS_TOKEN_DURATION = 3000; // 5 minutes
const REFRESH_TOKEN_DURATION = 36000; // 60 minutes
const MAX_PROBLEM_FILE_SIZE = 10485760; // 1024 * 1024 * 10 = 10 MB
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;
const PASSWORD_SALT_LENGTH = 10;

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  PASSWORD_SALT_LENGTH,
  MAX_PROBLEM_FILE_SIZE,
  ACCESS_TOKEN_DURATION,
  REFRESH_TOKEN_DURATION,
};
