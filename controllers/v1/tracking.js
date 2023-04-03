const express = require('express');
const router = express.Router();
const debug = require('debug');
const log = debug('tiket-service:tracking:');

const TrackService = require('../../services/tracking');

const { isVerified } = require('../../middlewares/isVerified');
const { isSecured } = require('../../middlewares/isSecured');

router.get('/', [isSecured, isVerified], async (req, res) => {
    const result = await TrackService.Get();
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

router.get('/tiket/:id', [isSecured, isVerified], async (req, res) => {
    const tiketId = req.params.id;

    const result = await TrackService.GetByTiket(tiketId);
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

router.get('/user/:id', [isSecured, isVerified], async (req, res) => {
    const userId = req.params.id;

    const result = await TrackService.GetByUser(userId);
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