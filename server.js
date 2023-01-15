require('dotenv').config();
const express = require('express');

const { rootRouter } = require('./routers');
const {
  handleInvalidJson,
} = require('./middlewares/error/handle_invalid_json');

const { cors } = require('./middlewares/cors/cors');

const app = express();
app.use(express.json());
app.use(handleInvalidJson);

// TODO: Remove cors middleware in production
// This only for development to make flutter web can access the api
app.use(cors);

app.use('/api/v1', rootRouter);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
});
