require('dotenv').config();
const express = require('express');

const { rootRouter } = require('./routers');

const app = express();
app.use(express.json());

app.use('/api/v1', rootRouter);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
});
