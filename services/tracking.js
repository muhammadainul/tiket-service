const debug = require('debug');
const log = debug('tiket-service:services:');

const { isEmpty } = require('lodash');

const { 
    Tracking, 
    Tiket, 
    Logs,
    Users
 } = require('../models');
const { Op } = require('sequelize');

async function GetById (levelId) {
    log('[Level] GetById', levelId);
    try {
        const checkLevel = await Level.findOne({
            where: { id: levelId },
            raw: true
        });
        if (!checkLevel) throw { error: 'Level tidak tersedia.' };
        
        return {
            data: checkLevel
        };
    } catch (error) {
        return error;
    }
}

async function Get () {
    log('[Level] Get');
    try {
        const levelData = await Level.findAll({ raw: true });
        
        return { level: levelData };
    } catch (error) {
        return error;
    }
}

async function GetByTiket (tiketId) {
    log('[Tracking] GetByTiket', tiketId);
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };
    } catch (error) {
        return error;
    }
}

async function GetByUser (userId) {
    log('[Tracking] GetByUser', userId);
    try {

    } catch (error) {
        return error;
    }
}

module.exports = {
    GetById,
    Get,
    GetByTiket,
    GetByUser
}