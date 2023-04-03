const express = require('express');
const app = express();

const cookieParser = require('cookie-parser');
const passport = require('passport');
const multer = require('multer');
const moment = require('moment');
const path = require('path');

require('dotenv').config();

global.config = require('./config/config')[process.env.NODE_ENV];

const io = require('socket.io-client');
global.socket = io(process.env.NOTIF_SERVICE, 
    { 
        transports : ['websocket'],
        secure: true,
        rejectUnauthorized: false 
    });

const multerMiddleware = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null,  "./uploads/images")
        },
        filename: (req, file, cb) => {
            cb(null, moment(Date.now()).format('YYYY-MM-DD hh:mm:ss') + '-helpdesk' + path.extname(file.originalname))
        }
    }),
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

app.use(
    multerMiddleware.single('files')
)

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(cookieParser());

require("./config/passport")(passport);
app.use(passport.initialize());

app.use(async (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, simandesk_token'
    );
    if (req.method === 'OPTIONS') {
        res.header(
            'Access-Control-Allow-Methods',
            'PUT, POST, PATCH, DELETE, GET'
        );
        return res.status(200).json({});
    }
    next();
});

app.use('/v1', require('./controllers/v1/tiket'));
app.use('/v1/kategori', require('./controllers/v1/kategori'));
app.use('/v1/level', require('./controllers/v1/level'));
app.use('/v1/tracking', require('./controllers/v1/tracking'));
app.use('/v1/report', require('./controllers/v1/report'));
app.use('/v1/rating', require('./controllers/v1/rating'));
app.use('/v1/feedback', require('./controllers/v1/feedback'));
app.use('/v1/reservasi', require('./controllers/v1/reservasi'));
app.use('/v1/layanan', require('./controllers/v1/layanan'));

module.exports = app;