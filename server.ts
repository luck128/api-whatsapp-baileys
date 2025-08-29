const express = require('express');
const cors = require('cors');
const { router } = require('./src/routes/routes');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: [
        'http://localhost:3306'
    ]
}))

app.use('/api/v1', router);

app.listen(3306, () => {
    console.log('Server is running on:', 3306);
})
