const express = require('express');
const router = express.Router();
const debug = require('debug');
const log = debug('tiket-service:reservasi:');

const ReservasiService = require('../../services/reservasi');

const { isVerified } = require('../../middlewares/isVerified');
const { isSecured } = require('../../middlewares/isSecured');

router.post('/', [isSecured, isVerified], async (req, res) => {
    const reservasiData = req.body;
    const user = req.user;

    const result = await ReservasiService.Create(reservasiData, user);
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

// router.get('/', [isSecured, isVerified], async (req, res) => {
//     const result = await ReservasiService.Get();
//     log('result', result);

//     if (result.error) {
//         return res.status(400).json({ 
//             status: 400, 
//             error: result.error 
//         });
//     } else {
//         return res.status(200).json({
//             status: 200, 
//             data: result
//         });
//     }
// });

router.get('/:id', [isSecured, isVerified], async (req, res) => {
    const reservasi_id = req.params.id;

    const result = await ReservasiService.GetById(reservasi_id);
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
    const reservasiData = req.body;

    const result = await ReservasiService.GetDatatables(reservasiData);
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
    const reservasi_id = req.params.id;
    const reservasiData = req.body;
    const user = req.user;

    const result = await ReservasiService.Update(reservasi_id, reservasiData, user);
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
    const reservasi_id = req.params.id;
    const user = req.user;

    const result = await ReservasiService.Delete(reservasi_id, user);
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