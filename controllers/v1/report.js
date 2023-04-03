const express = require('express');
const router = express.Router();
const debug = require('debug');
const log = debug('tiket-service:report:');

const ReportService = require('../../services/report');

const { isVerified } = require('../../middlewares/isVerified');
const { isSecured } = require('../../middlewares/isSecured');

router.post('/all', [isSecured, isVerified], async (req, res) => {
    const reportData = req.body;

    const result = await ReportService.GetAllReport(reportData);
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

router.post('/notif', [isSecured, isVerified], async (req, res) => {
    const notifData = req.body;

    const result = await ReportService.GetNotif(notifData);
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

router.get('/dashboard', [isSecured, isVerified], async (req, res) => {
    const result = await ReportService.GetDashboard();
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

router.get('/dashboard/tiket/max', [isSecured, isVerified], async (req, res) => {
    const result = await ReportService.GetMaxData();
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

router.get('/dashboard/tiket/satker', async (req, res) => {
    const result = await ReportService.GetReportBySatker();
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

router.post('/dashboard/user', [isSecured, isVerified], async (req, res) => {
    const reportData = req.body;

    const result = await ReportService.GetDashboardUser(reportData);
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

router.post('/history', [isSecured, isVerified], async (req, res) => {
    const historyData = req.body;

    const result = await ReportService.GetHistoryData(historyData);
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

router.post('/history/user', [isSecured, isVerified], async (req, res) => {
    const historyData = req.body;

    const result = await ReportService.GetHistoryDataUser(historyData);
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

router.post('/statistic', [isSecured, isVerified], async (req, res) => {
    const historyData = req.body;

    const result = await ReportService.GetStatistic(historyData);
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

router.get('/test', [isSecured, isVerified], async (req, res) => {
    const result = await ReportService.Test();
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