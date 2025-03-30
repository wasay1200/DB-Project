const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const {sql, poolPromise} = require('./config/db.js');
const PORT = 5000;
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send(`Use path /api/{tablename} for query results for that table!`);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});