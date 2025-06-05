const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(express.json());
app.use(cors());

const generalRouter = require('./routes/general');
app.use('/general', generalRouter);

const eventsRouter = require('./routes/events');
app.use('/events', eventsRouter);

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(process.env.API_PORT, () => {
    console.log(`API listening on port ${process.env.API_PORT}`);
});
