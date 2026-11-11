const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(fileUpload());

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Optional: Set the directory for views (defaults to 'views' folder)
app.set('views', path.join(__dirname, 'views'));

const generalRouter = require('./routes/general');
app.use('/general', generalRouter);

const eventsRouter = require('./routes/events');
app.use('/events', eventsRouter);

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

const productsRouter = require('./routes/products');
app.use('/products', productsRouter);

const teamsRouter = require('./routes/teams');
app.use('/teams', teamsRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const PORT = process.env.PORT || process.env.API_PORT || 3000;

app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});

module.exports = app;
