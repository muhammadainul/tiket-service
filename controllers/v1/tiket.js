const express = require('express');
const router = express.Router();
const debug = require('debug');
const log = debug('tiket-service:tiket:');

const TiketService = require('../../services/tiket');

const { isVerified } = require('../../middlewares/isVerified');
const { isSecured } = require('../../middlewares/isSecured');

router.post('/', [isSecured, isVerified], async (req, res) => {
    const tiketData = req.body;
    const tiketFiles = req.file;
    const user = req.user;

    const result = await TiketService.Create(tiketData, user, tiketFiles);
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

router.get('/:id', [isSecured, isVerified], async (req, res) => {
    const tiketId = req.params.id;

    const result = await TiketService.GetById(tiketId);
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

router.post('/no_tiket', async (req, res) => {
    const tiketData = req.body;

    const result = await TiketService.GetByTiket(tiketData);
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

router.post('/no_tiket/qrcode', async (req, res) => {
    const tiketData = req.body;

    const result = await TiketService.GetByTiketQr(tiketData);
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

router.get('/pegawai/:id', [isSecured, isVerified], async (req, res) => {
    const pegawai_id = req.params.id;

    const result = await TiketService.GetByEmployee(pegawai_id);
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
    const user_id = req.params.id;

    const result = await TiketService.GetByUser(user_id);
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

router.get('/pegawai/get/performance', [isSecured, isVerified], async (req, res) => {
    const result = await TiketService.GetPerformance();
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

router.post('/get/status', [isSecured, isVerified], async (req, res) => {
    const tiketData = req.body;

    const result = await TiketService.GetByStatus(tiketData);
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

router.post('/datatables', async (req, res) => {
    const tiketData = req.body;

    const result = await TiketService.GetDatatables(tiketData);
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

router.post('/datatables/status', [isSecured, isVerified], async (req, res) => {
    const tiketData = req.body;

    const result = await TiketService.GetDatatablesNotOpen(tiketData);
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
    const tiketId = req.params.id;
    const tiketData = req.body;
    const user = req.user;

    const result = await TiketService.Update(tiketId, tiketData, user);
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

router.put('/approved_in/:id', [isSecured, isVerified], async (req, res) => {
    const tiketId = req.params.id;
    const tiketData = req.body;
    const user = req.user;

    const result = await TiketService.ApprovedIn(tiketId, tiketData, user);
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

router.put('/approved/:id', [isSecured, isVerified], async (req, res) => {
    const tiketId = req.params.id;
    const tiketData = req.body;
    const user = req.user;

    const result = await TiketService.Approved(tiketId, tiketData, user);
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

router.put('/assign/:id', [isSecured, isVerified], async (req, res) => {
    const tiketId = req.params.id;
    const tiketData = req.body;
    const user = req.user;

    const result = await TiketService.Assign(tiketId, tiketData, user);
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

router.put('/solved/:id', [isSecured, isVerified], async (req, res) => {
    const tiketId = req.params.id;
    const tiketData = req.body;
    const user = req.user;

    const result = await TiketService.Solved(tiketId, tiketData, user);
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

router.put('/closed/:id', [isSecured, isVerified], async (req, res) => {
    const tiketId = req.params.id;
    const tiketData = req.body;
    const user = req.user;

    const result = await TiketService.Closed(tiketId, tiketData, user);
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

router.put('/pending/:id', [isSecured, isVerified], async (req, res) => {
    const tiketId = req.params.id;
    const tiketData = req.body;
    const user = req.user;

    const result = await TiketService.Pending(tiketId, tiketData, user);
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

router.put('/forward/:id', [isSecured, isVerified], async (req, res) => {
    const tiketId = req.params.id;
    const tiketData = req.body;
    const user = req.user;

    const result = await TiketService.ForwardTo(tiketId, tiketData, user);
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

router.get('/type/email', [isSecured, isVerified], async (req, res) => {
    const result = await TiketService.GetByEmail();
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

// Queue
router.get('/queue/get', async (req, res) => {
    const result = await TiketService.GetJob();
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