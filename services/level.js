const debug = require('debug');
const log = debug('tiket-service:services:');

const { isEmpty, toInteger } = require('lodash');

const { 
    Pegawai, 
    Level, 
    Users,
    Kewenangan,
    Logs 
} = require('../models');
const { Op } = require('sequelize');

async function CreateLevel (levelData, user) {
    const { 
        pegawai_id, 
        level 
    } = levelData;
    log('[Level] CreateLevel', { levelData, user });
    try {
        if (!pegawai_id || !level) throw { error: 'Pegawai dan level harus dilampirkan.' };

        const checkPegawai = await Pegawai.findOne({
            where: { id: pegawai_id },
            raw: true
        });
        if (!checkPegawai) throw { error: 'Pegawai tidak tersedia.' };

        if (checkPegawai.level !== null) throw { error: 'Pegawai sudah diberi level.' };

        const checkUser = await Users.findOne({
            where: { id: checkPegawai.user_id },
            raw: true
        });

        const checkLevel = await Level.findOne({
            where: { id: level },
            raw: true
        });
        if (!checkLevel) throw { error: 'Level tidak tersedia.' };

        await Pegawai.update({
            level: toInteger(level)
        },
        { where: { id: pegawai_id } }
        );

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Tambah) level pegawai atas nama ${checkUser.username}`,
            user_id: user.id
        });

        return { message: 'Level berhasil dibuat.' };
    } catch (error) {
        return error;
    }
}

async function Create (levelData, user) {
    const { level, deskripsi } = levelData;
    log('[Level] Create', { levelData, user });
    try {
        if (!level || !deskripsi) throw { error: 'Form harus diisi.' };

        if (isNaN(level)) throw { error: 'Level harus berupa numeric.' };

        const checkLevel = await Level.findOne({
            where: { level },
            raw: true
        });
        if (checkLevel) throw { error: 'Level sudah tersedia.' };

        const created = await Level.create({
            level,
            deskripsi
        });

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Tambah) level dengan level ${level}.`,
            user_id: user.id
        });

        return {
            message: 'Level berhasil dibuat.',
            data: await Level.findOne({
                where: { id: created.id },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function Update (levelId, levelData, user) {
    const { level, deskripsi } = levelData;
    log('[Level] Update', { levelId, levelData, user });
    try {
        const checkLevel = await Level.findOne({
            where: { id: levelId },
            raw: true
        });
        if (!checkLevel) throw { error: 'Level tidak tersedia.' };

        if (!level || !deskripsi) throw { error: 'Form harus diisi.' };

        if (isNaN(level)) throw { error: 'Level harus berupa numeric.' };

        await Kategori.update({
            level,
            deskripsi
            },
            { where: { id: levelId }}
        );

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Update) level dengan level ${level}.`,
            user_id: user.id
        });

        return {
            message: 'Level berhasil diubah.',
            data: await Level.findOne({
                where: { id: checkLevel.id },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function Delete (levelId, user) {
    log('[Level] Delete', { levelId, user });
    try {
        const checkLevel = await Level.findOne({
            where: { id: levelId },
            raw: true
        });
        if (!checkLevel) throw { error: 'Level tidak tersedia.' };
        
        await Level.destroy({ where: { id: levelId }});
       
        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Hapus) level dengan level ${checkLevel.kategori}.`,
            user_id: user.id
        });

        return {
            message: 'Level berhasil dihapus.'
        };
    } catch (error) {
        return error;
    }
}

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

async function GetByPegawai (pegawaiData) {
    const { pegawai_id } = pegawaiData;
    log('[Level] GetByPegawai', pegawaiData);
    try {
        let whereByPegawai;
        if (pegawai_id !== '') {
            whereByPegawai = { id: pegawai_id };

            const checkPegawai = await Pegawai.findOne({
                where: { id: pegawai_id },
                raw: true
            });
            if (!checkPegawai) throw { error: 'Pegawai tidak tersedia.' };
        }

        const where = {
            ...whereByPegawai
        };

        const checkPegawai = await Pegawai.findAll({
            attributes: ['id', 'level'],
            where: {
                [Op.and]: [
                    where,
                    { level: null },
                    { '$user.kewenangan_id$': { [Op.ne]: 1 } },
                    { '$user.kewenangan_id$': { [Op.ne]: 2 } },
                    { '$user.kewenangan_id$': { [Op.ne]: 5 } },
                    { '$user.kewenangan_id$': { [Op.ne]: 6 } },
                    { '$user.kewenangan_id$': { [Op.ne]: 7 } }
                ]
            },
            include: {
                model: Users,
                attributes: ['username', 'nama_lengkap', 'nip'],
                as: 'user',
                include: {
                    model: Kewenangan,
                    attributes: ['kewenangan'],
                    as: 'kewenangan'
                }
            },
            raw: true,
            nest: true
        });
        if (!checkPegawai) throw { error: 'Pegawai tidak tersedia.' };
        
        return checkPegawai;
    } catch (error) {
        return error;
    }
}

async function GetByPegawaiId (pegawai_id) {
    log('[Level] GetByPegawaiId', pegawai_id);
    try {
        const checkPegawai = await Pegawai.findAll({
            attributes: ['id', 'level'],
            where: { id: pegawai_id },
            include: {
                model: Users,
                attributes: ['username', 'nama_lengkap', 'nip'],
                as: 'user',
                include: {
                    model: Kewenangan,
                    attributes: ['kewenangan'],
                    as: 'kewenangan'
                }
            },
            raw: true,
            nest: true
        });
        if (!checkPegawai) throw { error: 'Pegawai tidak tersedia.' };
        
        return checkPegawai;
    } catch (error) {
        return error;
    }
}

async function Get () {
    log('[Level] Get');
    try {
        const levelData = await Level.findAll({ raw: true });
        
        return levelData;
    } catch (error) {
        return error;
    }
}

async function GetDatatables (levelData) {
    const { 
        draw, 
        order, 
        start, 
        length, 
        search,
        urutan,
        kategori_id 
    } = levelData;
    log('[Level] GetDatatables', levelData);
    try {
        // let where;
        // !isEmpty(search.value)
        //     ? (where = {
        //         kategori: { 
        //             [Op.iLike]: `%${search.value}%`
        //         }
        //     })
        //     : (where = {});
        let whereByKategori;
        if (kategori_id !== '') {
            whereByKategori = {
                kategori_id
            };
        };

        const where = { ...whereByKategori };

        let searchOrder;
        if (urutan) {
            searchOrder = [['createdAt', urutan]];
        };

        const [recordsTotal, recordsFiltered, data] = await Promise.all([
            Level.count({}),
            Level.count({ where }),
            Level.findAll({
                include: {
                    model: Kategori,
                    attributes: ['kategori'],
                    as: 'kategori'
                },
                where,
                order: searchOrder,
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

async function GetDatatablesLevel (levelData) {
    const { 
        draw, 
        // order, 
        start, 
        length, 
        // search,
        nip, 
        nama_lengkap,
        alamat,
        departemen,
        jabatan,
        urutan 
    } = levelData;
    log('[Level] GetDatatablesLevel', levelData);
    try {
        let whereByNip;
        if (nip !== '') {
            whereByNip = {
                '$user.nip$': { [Op.iLike]: `%${nip}%` }   
            };
        };

        let whereByNamaLengkap;
        if (nama_lengkap !== '') {
            whereByNamaLengkap = {
                '$user.nama_lengkap$': { [Op.iLike]: `%${nama_lengkap}%` }   
            };
        };

        let whereByAlamat;
        if (alamat !== '') {
            whereByAlamat = {
                '$user.alamat$': { [Op.iLike]: `%${alamat}%` }   
            };
        };

        let whereByDepartemen;
        if (departemen !== '') {
            whereByDepartemen = {
                departemen: { [Op.iLike]: `%${departemen}%` }
            };
        };

        let whereByJabatan;
        if (jabatan !== '') {
            whereByJabatan = {
                jabatan: { [Op.iLike]: `%${jabatan}%` }
            };
        };

        const where = {
            ...whereByNip,
            ...whereByNamaLengkap,
            ...whereByAlamat,
            ...whereByDepartemen,
            ...whereByJabatan
        };

        let searchOrder;
        if (urutan) {
            searchOrder = [['createdAt', urutan]];
        };

        const [recordsTotal, recordsFiltered, data] = await Promise.all([
            Pegawai.count({}),
            Pegawai.count({ 
                include: [
                    {
                        model: Users,
                        attributes: ['nama_lengkap', 'nip', 'alamat'],
                        as: 'user'
                    }
                ],
                where: {
                    [Op.and]: [
                        where,
                        { level: { [Op.ne]: null } },
                        { '$user.kewenangan_id$': { [Op.ne]: 2 } },
                        { '$user.kewenangan_id$': { [Op.ne]: 5 } },
                        { '$user.kewenangan_id$': { [Op.ne]: 6 } }
                    ]
                }, 
            }),
            Pegawai.findAll({
                include: [
                    {
                        model: Users,
                        attributes: ['nama_lengkap', 'nip', 'alamat'],
                        as: 'user',
                        include: {
                            model: Kewenangan,
                            attributes: ['kewenangan'],
                            as: 'kewenangan'
                        }
                    }
                ],
                where: {
                    [Op.and]: [
                        where,
                        { level: { [Op.ne]: null } },
                        { '$user.kewenangan_id$': { [Op.ne]: 2 } },
                        { '$user.kewenangan_id$': { [Op.ne]: 5 } },
                        { '$user.kewenangan_id$': { [Op.ne]: 6 } }
                    ]
                },
                order: searchOrder,
                offset: start,
                limit: length,
                raw: true,
                nest: true
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
    CreateLevel,
    Create,
    Update,
    Delete,
    GetById,
    GetByPegawai,
    GetByPegawaiId,
    Get,
    GetDatatables,
    GetDatatablesLevel
}