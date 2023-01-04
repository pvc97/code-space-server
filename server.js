const express = require('express');

const app = express();
app.use(express.json());

app.listen(3000, async () => {
  console.log('Server is running on port 3000');
});
