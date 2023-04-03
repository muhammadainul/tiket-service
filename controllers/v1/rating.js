const express = require('express');
const router = express.Router();
const debug = require('debug');
const log = debug('tiket-service:rating:');

const RatingService = require('../../services/rating');

const { isVerified } = require('../../middlewares/isVerified');
const { isSecured } = require('../../middlewares/isSecured');

router.post('/', [isSecured, isVerified], async (req, res) => {
    const ratingData = req.body;
    const user = req.user;

    const result = await RatingService.Create(ratingData, user);
    log('result', result);

    if (result.error) {
        return res.status(400).json({ 
            status: 400, 
            error: result.error 
        });
    } else {
        return res.status(200).json({
            status: 200, 
            data: result
        });
    }
});

module.exports = router;