const debug = require('debug');
const log = debug('tiket-service:services:');

const { isEmpty, isInteger } = require('lodash');

const moment = require('moment');

const {
    Tiket,
    Gambar,
    Reservasi,
    Users,
    Pegawai,
    Kategori,
    Teknisi,
    Level,
    Kewenangan,
    Logs
} = require('../models');
const { Op } = require('sequelize');

async function Create (reservasiData, user) {
    const { 
        tiket_id, 
        pegawai_id,
        tanggal, 
        tempat,
        tujuan,
        nama_petugas,
        telepon
    } = reservasiData;
    log('[Reservasi] Create', { reservasiData, user });
    try {
        if (!tiket_id) throw { error: 'Tiket harus dilampirkan.' };

        if (!pegawai_id) throw { error: 'Pegawai harus dilampirkan.' };

        if (!tanggal || !tempat) throw { error: 'Tanggal dan tempat harus diisi.' };

        if (!nama_petugas || !telepon) throw { error: 'Petugas dan nomor telepon harus diisi.' };

        // if (!isInteger(telepon)) throw { error: 'Nomor telepon harus berupa angka.' };

        const checkTiket = await Tiket.findOne({
            where: { id: tiket_id },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        const checkPegawai = await Pegawai.findOne({
            where: { id: pegawai_id },
            raw: true
        });
        if (!checkPegawai) throw { error: 'Pegawai tidak tersedia' };

        if (checkTiket.handled_by == null) 
            throw { error: 'Gagal membuat jadwal reservasi. Tiket belum di-assign.' };

        if (checkTiket.handled_by !== pegawai_id) 
            throw { error: 'Gagal membuat jadwal reservasi. Pegawai tidak bersangkutan dengan tiket.' };

        const created = await Reservasi.create({
            tiket_id,
            pegawai_id,
            tanggal,
            tempat,
            tujuan,
            nama_petugas,
            telepon
        });

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Tambah) jadwal reservasi untuk tiket ${checkTiket.no_tiket}.`,
            user_id: user.id
        });

        return {
            message: 'Reservasi berhasil dibuat.',
            data: await Reservasi.findOne({
                where: { id: created.id },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function Update (reservasi_id, reservasiData, user) {
    const {
        tiket_id, 
        pegawai_id,
        tanggal, 
        tempat,
        tujuan,
        keterangan,
        nama_petugas,
        telepon,
        done
    } = reservasiData;
    log('[Reservasi] Update', { reservasi_id, reservasiData, user });
    try {
        if (!tiket_id) throw { error: 'Tiket harus dilampirkan.' };

        if (!pegawai_id) throw { error: 'Pegawai harus dilampirkan.' };

        if (!tanggal || !tempat) throw { error: 'Tanggal dan tempat harus diisi.' };

        if (!nama_petugas || !telepon) throw { error: 'Petugas dan nomor telepon harus diisi.' };

        // if (!isInteger(telepon)) throw { error: 'Nomor telepon harus berupa angka.' };

        const checkReservasi = await Reservasi.findOne({
            where: { id: reservasi_id },
            raw: true
        });
        if (!checkReservasi) throw { error: 'Reservasi tidak tersedia.' };

        const checkTiket = await Tiket.findOne({
            where: { id: tiket_id },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        const checkPegawai = await Pegawai.findOne({
            where: { id: pegawai_id },
            raw: true
        });
        if (!checkPegawai) throw { error: 'Pegawai tidak tersedia' };

        if (!done) {
            await Reservasi.update({
                tiket_id,
                tanggal,
                tempat,
                tujuan,
                keterangan,
                nama_petugas,
                telepon
                },
                { where: { id: reservasi_id }}
            );
    
            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Update) reservasi untuk tiket ${checkTiket.no_tiket}.`,
                user_id: user.id
            });

            return {
                message: 'Reservasi berhasil diubah.',
                data: await Reservasi.findOne({
                    where: { id: checkReservasi.id },
                    raw: true
                })
            };
        } else {
            await Reservasi.update({
                tiket_id,
                tanggal,
                tempat,
                tujuan,
                keterangan,
                nama_petugas,
                telepon,
                status: true // selesai
                },
                { where: { id: reservasi_id }}
            );
    
            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Done) reservasi untuk tiket ${checkTiket.no_tiket}.`,
                user_id: user.id
            });

            return {
                message: 'Reservasi kunjungan berhasil diselesaikan.',
                data: await Reservasi.findOne({
                    where: { id: checkReservasi.id },
                    raw: true
                })
            };
        }
    } catch (error) {
        return error;
    }
}

async function Delete (reservasi_id, user) {
    log('[Reservasi] Delete', { reservasi_id, user });
    try {
        const checkReservasi = await Reservasi.findOne({
            where: { id: reservasi_id },
            raw: true
        });
        if (!checkReservasi) throw { error: 'Reservasi tidak tersedia.' };

        const checkTiket = await Tiket.findOne({
            where: { id: checkReservasi.tiket_id },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };
        
        await Reservasi.destroy({ where: { id: reservasi_id }});
       
        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Hapus) jadwal reservasi untuk tiket ${checkTiket.no_tiket}.`,
            user_id: user.id
        });

        return {
            message: 'Reservasi berhasil dihapus.'
        };
    } catch (error) {
        return error;
    }
}

async function GetById (reservasi_id) {
    log('[Reservasi] GetById', reservasi_id);
    try {
        const checkReservasi = await Reservasi.findOne({
            include: {
                model: Tiket,
                as: 'tiket',
                include: [
                    {
                        model: Gambar,
                        as: 'files',
                        attributes: ['filename', 'destination']
                    },
                    {
                        model: Users,
                        as: 'reported',
                        attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon']
                    },
                    {
                        model: Pegawai,
                        attributes: ['user_id', 'departemen', 'jabatan'],
                        as: 'handled',
                        include: [
                            {
                                model: Users,
                                attributes: [
                                    'nip', 
                                    'username', 
                                    'nama_lengkap', 
                                    'email', 
                                    'telepon', 
                                    'alamat'
                                ],
                                as: 'user',
                                include: {
                                    model: Kewenangan,
                                    attributes: ['kewenangan'],
                                    as: 'kewenangan'
                                }
                            },
                            { 
                                model: Teknisi,
                                attributes: ['id'],
                                as: 'teknisi',
                                include: {
                                    model: Kategori,
                                    as: 'kategori',
                                    attributes: ['kategori']
                                }
                            }
                        ]
                    },
                    {
                        model: Level,
                        as: 'level',
                        attributes: ['level', 'deskripsi']
                    },
                    {
                        model: Kategori,
                        as: 'kategori',
                        attributes: ['kategori']
                    }
                ]
            },  
            where: { id: reservasi_id },
            nest: true
        });
        if (!checkReservasi) throw { error: 'Reservasi tidak tersedia.' };
        
        return checkReservasi;
    } catch (error) {
        return error;
    }
}

async function GetDatatables (reservasiData) {
    const { 
        draw, 
        order, 
        start, 
        length, 
        search,
        urutan,
        start_date,
        end_date,
        tempat,
        no_tiket,
        pegawai_id,
        user_id
    } = reservasiData;
    log('[Reservasi] GetDatatables', reservasiData);
    try {
        let whereByDate;
        if (!isEmpty(start_date) || !isEmpty(end_date)) {
            whereByDate = {
                [Op.and]: [
                    { tanggal: { [Op.gte]: moment(start_date).format() } },
                    { tanggal: { [Op.lte]: moment(end_date).format() } }
                ]
            };
        }

        let whereByNoTiket;
        if (no_tiket !== '') {
            whereByNoTiket = {
                '$tiket.no_tiket$': { [Op.iLike]: `%${no_tiket}%` }   
            }
        }

        let whereByTempat;
        if (tempat !== '') {
            whereByTempat = {
                tempat: { [Op.iLike]: `%${tempat}%` }
            };
        }

        let whereByPegawai;
        if (pegawai_id !== '') {
            whereByPegawai = {
                pegawai_id
            };
        }

        let whereByUser;
        if (user_id !== '') {
            whereByUser = {
                '$tiket.reported.id$': user_id
            }
        }

        const where = {
            ...whereByDate,
            ...whereByNoTiket,
            ...whereByTempat,
            ...whereByPegawai,
            ...whereByUser
        };

        let searchOrder;
        if (urutan) {
            searchOrder = [['tanggal', urutan]];
        };

        const [recordsTotal, recordsFiltered, data] = await Promise.all([
            Reservasi.count({}),
            Reservasi.count({ 
                include: {
                    model: Tiket,
                    as: 'tiket',
                    include: {
                        model: Users,
                        as: 'reported'
                    }
                },
                where 
            }),
            Reservasi.findAll({
                include: {
                    model: Tiket,
                    as: 'tiket',
                    include: [
                        {
                            model: Gambar,
                            as: 'files',
                            attributes: ['filename', 'destination']
                        },
                        {
                            model: Users,
                            as: 'reported',
                            attributes: ['id', 'username', 'nama_lengkap', 'nip', 'email', 'telepon']
                        },
                        {
                            model: Pegawai,
                            attributes: ['user_id', 'departemen', 'jabatan'],
                            as: 'handled',
                            include: [
                                {
                                    model: Users,
                                    attributes: [
                                        'nip', 
                                        'username', 
                                        'nama_lengkap', 
                                        'email', 
                                        'telepon', 
                                        'alamat'
                                    ],
                                    as: 'user',
                                    include: {
                                        model: Kewenangan,
                                        attributes: ['kewenangan'],
                                        as: 'kewenangan'
                                    }
                                },
                                { 
                                    model: Teknisi,
                                    attributes: ['id'],
                                    as: 'teknisi',
                                    include: {
                                        model: Kategori,
                                        as: 'kategori',
                                        attributes: ['kategori']
                                    }
                                }
                            ]
                        },
                        {
                            model: Level,
                            as: 'level',
                            attributes: ['level', 'deskripsi']
                        },
                        {
                            model: Kategori,
                            as: 'kategori',
                            attributes: ['kategori']
                        }
                    ]
                },  
                where,
                order: searchOrder,
                offset: start,
                limit: length,
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
    Create,
    Update,
    Delete,
    GetById,
    GetDatatables
}