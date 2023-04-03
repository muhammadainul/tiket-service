const debug = require('debug');
const log = debug('tiket-service:services:');

const { isEmpty } = require('lodash');

const { Kategori, Logs } = require('../models');
const { Op } = require('sequelize');

async function Create (kategoriData, user) {
    const { kategori } = kategoriData;
    log('[Kategori] Create', { kategoriData, user });
    try {
        const created = await Kategori.create({ kategori });

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Tambah) kategori dengan nama ${kategori}.`,
            user_id: user.id
        });

        return {
            message: 'Kategori berhasil dibuat.',
            data: await Kategori.findOne({
                where: { id: created.id },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function Update (kategoriId, kategoriData, user) {
    const { kategori } = kategoriData;
    log('[Kategori] Update', { kategoriId, kategoriData, user });
    try {
        const checkKategori = await Kategori.findOne({ 
            where: { id: kategoriId },
            raw: true
        })
        if (!checkKategori) throw { error: 'Kategori tidak tersedia.' };

        await Kategori.update({
            kategori
            },
            { where: { id: kategoriId }}
        );

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Update) kategori dengan nama ${kategori}.`,
            user_id: user.id
        });

        return {
            message: 'Kategori berhasil diubah.',
            data: await Kategori.findOne({
                where: { id: checkKategori.id },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function Delete (kategoriId, user) {
    log('[Kategori] Delete', { kategoriId, user });
    try {
        const checkKategori = await Kategori.findOne({ 
            where: { id: kategoriId },
            raw: true
        })
        if (!checkKategori) throw { error: 'Kategori tidak tersedia.' };
        
        await Kategori.destroy({ where: { id: kategoriId }});
       
        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Hapus) kategori dengan nama ${checkKategori.kategori}.`,
            user_id: user.id
        });

        return {
            message: 'Kategori berhasil dihapus.'
        };
    } catch (error) {
        return error;
    }
}

async function GetById (kategoriId) {
    log('[Kategori] GetById', kategoriId);
    try {
        const checkKategori = await Kategori.findOne({ 
            where: { id: kategoriId },
            raw: true
        })
        if (!checkKategori) throw { error: 'Kategori tidak tersedia.' };
        
        return {
            data: checkKategori
        };
    } catch (error) {
        return error;
    }
}

async function Get () {
    log('[Kategori] Get');
    try {
        const kategoriData = await Kategori.findAll({ 
            // where: { id: { [Op.ne]: 20 } },
            raw: true 
        });
        
        return kategoriData;
    } catch (error) {
        return error;
    }
}

async function GetDatatables (kategoriData) {
    const { draw, order, start, length, search } = kategoriData;
    log('[Kategori] GetDatatables', kategoriData);
    try {
        let where;
        !isEmpty(search.value)
            ? (where = {
                kategori: { 
                    [Op.iLike]: `%${search.value}%`
                }
            })
            : (where = {});

        const [recordsTotal, recordsFiltered, data] = await Promise.all([
            Kategori.count({}),
            Kategori.count({ where }),
            Kategori.findAll({
                where,
                offset: start,
                limit: length,
                raw: true 
            })
        ]);

        return {
            draw,
            recordsTotal,
            recordsFiltered,
            data
        };
    } catch (error) {
        return error;
    }
}

module.exports = {
    Create,
    Update,
    Delete,
    GetById,
    Get,
    GetDatatables
}