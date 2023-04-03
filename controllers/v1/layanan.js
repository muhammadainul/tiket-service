const express = require('express');
const router = express.Router();
const debug = require('debug');
const log = debug('tiket-service:layanan:');

const LayananService = require('../../services/layanan');

const { isVerified } = require('../../middlewares/isVerified');
const { isSecured } = require('../../middlewares/isSecured');

router.post('/', [isSecured, isVerified], async (req, res) => {
    const layananData = req.body;
    const user = req.user;

    const result = await LayananService.Create(layananData, user);
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

router.put('/:id', [isSecured, isVerified], async (req, res) => {
    const layanan_id = req.params.id;
    const layananData = req.body;
    const user = req.user;

    const result = await LayananService.Update(layanan_id, layananData, user);
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

router.delete('/:id', [isSecured, isVerified], async (req, res) => {
    const layanan_id = req.params.id;
    const user = req.user;

    const result = await LayananService.Delete(layanan_id, user);
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

router.get('/', [isSecured, isVerified], async (req, res) => {
    const result = await LayananService.Get();
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

router.get('/kategori/:id', [isSecured, isVerified], async (req, res) => {
    const kategori_id = req.params.id;

    const result = await LayananService.GetByKategori(kategori_id);
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