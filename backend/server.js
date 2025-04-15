const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const {sql, poolPromise} = require('./db.js');
const PORT = 5000;
app.use(cors());
//app.use(bodyParser.json());

const menuRoute = require('./routes/menuRoute'); // adjust path as needed
app.use('/api/menu', menuRoute);


app.get('/', (req, res) => {
    res.send(`Use path /api/{tablename} for query results for that table!`);
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});