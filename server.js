require('dotenv').config();
const path = require('path');
const express = require('express');
const i18next = require('i18next');
const fs = require('fs');

const { rootRouter } = require('./routers');
const {
  handleInvalidJson,
} = require('./middlewares/error/handle_invalid_json');

const { cors } = require('./middlewares/cors/cors');
const injectLanguage = require('./middlewares/language/language_middleware');

i18next.init({
  lng: 'vi',
  resources: {
    en: {
      translation: JSON.parse(
        fs.readFileSync(`${__dirname}/locales/en.json`, 'utf8')
      ),
    },
    vi: {
      translation: JSON.parse(
        fs.readFileSync(`${__dirname}/locales/vi.json`, 'utf8')
      ),
    },
  },
});

const app = express();
// injectLanguage must use before express.json() because if express.json() has error
// error will jump to handleInvalidJson middleware (not go in to injectLanguage)
app.use(injectLanguage);
app.use(express.json());
app.use(handleInvalidJson);

// TODO: Remove cors middleware in production
// This only for development to make flutter web can access the api
app.use(cors);

// Static files
const publicPathDirectory = path.join(__dirname, './public');
app.use('/public', express.static(publicPathDirectory));

app.use('/api/v1', rootRouter);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
});
