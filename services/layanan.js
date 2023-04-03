const debug = require('debug');
const log = debug('tiket-service:services:');

const { 
    Kategori, 
    Layanan,
    Logs
 } = require('../models');

async function Create (layananData, user) {
    const { nama_layanan, kategori_id } = layananData;
    log('[Layanan] Create', { layananData, user });
    try {
        if (!kategori_id) throw { error: 'Kategori harus dilampirkan.' };

        const checkKategori = await Kategori.findOne({ 
            where: { id: kategori_id },
            raw: true
        })
        if (!checkKategori) throw { error: 'Kategori tidak tersedia.' };

        const created = await Layanan.create({ nama_layanan, kategori_id });

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Tambah) layanan dengan nama ${nama_layanan}.`,
            user_id: user.id
        });

        return {
            message: 'Layanan berhasil dibuat.',
            data: await Layanan.findOne({
                where: { id: created.id },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function Update (layanan_id, layananData, user) {
    const { nama_layanan, kategori_id } = layananData;
    log('[Layanan] Update', { layanan_id, layananData, user });
    try {
        if (!kategori_id) throw { error: 'Kategori harus dilampirkan.' };

        const checkKategori = await Kategori.findOne({ 
            where: { id: kategori_id },
            raw: true
        })
        if (!checkKategori) throw { error: 'Kategori tidak tersedia.' };

        const checkLayanan = await Layanan.findOne({
            where: { id: layanan_id },
            raw: true
        });
        if (!checkLayanan) throw { error: 'Layanan tidak tersedia.' };

        await Layanan.update({
            nama_layanan,
            kategori_id
            },
            { where: { id: layanan_id } }
        );

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Update) layanan dengan nama ${nama_layanan}.`,
            user_id: user.id
        });

        return {
            message: 'Layanan berhasil diubah.',
            data: await Layanan.findOne({
                where: { id: checkLayanan.id },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function Delete (layanan_id, user) {
    log('[Layanan] Delete', { layanan_id, user });
    try {
        const checkLayanan = await Layanan.findOne({
            where: { id: layanan_id },
            raw: true
        });
        if (!checkLayanan) throw { error: 'Layanan tidak tersedia.' };
        
        await Layanan.destroy({ where: { id: layanan_id } });
       
        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Hapus) layanan dengan nama ${checkLayanan.nama_layanan}.`,
            user_id: user.id
        });

        return {
            message: 'Layanan berhasil dihapus.'
        };
    } catch (error) {
        return error;
    }
}

async function GetByKategori (kategori_id) {
    log('[Layanan] GetByKategori', kategori_id);
    try {
        const checkKategori = await Kategori.findOne({ 
            where: { id: kategori_id },
            raw: true
        })
        if (!checkKategori) throw { error: 'Kategori tidak tersedia.' };
        
        const layananData = await Kategori.findAll({
            where: { id: kategori_id },
            raw: true
        });

        return layananData;
    } catch (error) {
        return error;
    }
}

async function Get () {
    log('[Layanan] Get');
    try {
        const layananData = await Layanan.findAll({ raw: true });
        
        return layananData;
    } catch (error) {
        return error;
    }
}

module.exports = {
    Create,
    Update,
    Delete,
    GetByKategori,
    Get
}