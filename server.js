require('dotenv').config();
const express = require('express');

const { rootRouter } = require('./routers');

const app = express();
app.use(express.json());

app.use('/api/v1', rootRouter);

app.listen(3000, async () => {
  console.log('Server is running on port 3000');
});
