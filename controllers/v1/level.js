const express = require('express');
const router = express.Router();
const debug = require('debug');
const log = debug('tiket-service:level:');

const LevelService = require('../../services/level');

const { isVerified } = require('../../middlewares/isVerified');
const { isSecured } = require('../../middlewares/isSecured');

router.post('/pegawai', [isSecured, isVerified], async (req, res) => {
    const levelData = req.body;
    const user = req.user;

    const result = await LevelService.CreateLevel(levelData, user);
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

router.get('/pegawai', [isSecured, isVerified], async (req, res) => {
    const pegawaiData = req.body;

    const result = await LevelService.GetByPegawai(pegawaiData);
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

router.get('/pegawai/get/:id', [isSecured, isVerified], async (req, res) => {
    const pegawai_id = req.params.id;

    const result = await LevelService.GetByPegawaiId(pegawai_id);
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

router.post('/datatables/pegawai', [isSecured, isVerified], async (req, res) => {
    const levelData = req.body;

    const result = await LevelService.GetDatatablesLevel(levelData);
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

router.post('/', [isSecured, isVerified], async (req, res) => {
    const levelData = req.body;
    const user = req.user;

    const result = await LevelService.Create(levelData, user);
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

router.get('/get', [isSecured, isVerified], async (req, res) => {
    const result = await LevelService.Get();
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

router.get('/get/:id', [isSecured, isVerified], async (req, res) => {
    const levelId = req.params.id;

    const result = await LevelService.GetById(levelId);
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

router.post('/datatables', [isSecured, isVerified], async (req, res) => {
    const levelData = req.body;

    const result = await LevelService.GetDatatables(levelData);
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
    const levelId = req.params.id;
    const levelData = req.body;
    const user = req.user;

    const result = await LevelService.Update(levelId, levelData, user);
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
    const levelId = req.params.id;
    const user = req.user;

    const result = await LevelService.Delete(levelId, user);
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