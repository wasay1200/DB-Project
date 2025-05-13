const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const {sql, poolPromise} = require('./config/db.js'); //set urs to./config/db.js
const PORT = 5000;
app.use(cors());
app.use(express.json());

//app.use(bodyParser.json());

const menuRoute = require('./routes/menuRoute'); // adjust path as needed
const reservationsRoute = require('./routes/reservationRoute');
const ordersRoute = require('./routes/orderRoute');
const dishReviewsRoute = require('./routes/dishreviewsRoute');
const staffRatingsRoute = require('./routes/staffratingsRoute');


app.use('/api/menu', menuRoute);
app.use('/api/reservations', reservationsRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/dish-reviews', dishReviewsRoute);
app.use('/api/staff-ratings', staffRatingsRoute);


app.get('/', (req, res) => {
    res.send(`Use path /api/{tablename} for query results for that table!`);
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});