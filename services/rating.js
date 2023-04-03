const debug = require('debug');
const log = debug('tiket-service:services:');

const { toInteger } = require('lodash');

const { 
    Rating, 
    Tiket,
    Users,
    Pegawai,
    Kewenangan,
    Notifikasi,
    Tracking,
    Logs 
} = require('../models');

async function Create (ratingData, user) {
    const { 
        tiket_id, 
        user_id, 
        rating 
    } = ratingData;
    log('[Rating] Create', { ratingData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiket_id },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        const checkPegawai = await Pegawai.findOne({
            where: { id: checkTiket.handled_by },
            raw: true
        });

        const checkUserPegawai = await Users.findOne({
            where: { id: checkPegawai.user_id },
            raw: true
        });

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        const checkKewenangan = await Kewenangan.findOne({
            where: { id: checkUserPegawai.kewenangan_id },
            raw: true
        });

        const checkRating = await Rating.findOne({
            where: { tiket_id },
            raw: true
        });
        if (!checkRating) throw { error: 'Rating tidak tersedia.' };

        if (!rating) throw { error: 'Anda harus memberikan rating.' };

        if (toInteger(rating) !== 1 && toInteger(rating) !== 2 && toInteger(rating) !== 3 
            && toInteger(rating) !== 4 && toInteger(rating) !== 5)
            throw { error: 'Gagal memberikan rating. Rating harus 1-5' };

        if (checkRating.status == true && checkRating.rating !== null) 
            throw { error: 'Anda sudah memberikan rating.' };

        // if (checkUser.kewenangan_id !== 5) 
        //     throw { error: 'Gagal memberikan rating. Role anda bukan user.'};

        // if (checkTiket.reported_by !== user_id) 
        //     throw { error: 'Gagal memberikan rating. Tiket bukan milik anda.' };

        if (checkTiket.status !== 6) 
            throw { error: 'Gagal memberikan rating. Tiket anda belum selesai.' };

        await Rating.update({ 
            rating,
            status: true
        },
        { where: { id: checkRating.id } }
        );

        if (rating == 1) {
            await Tracking.create({
                tiket_id,
                user_id,
                status: `Memberikan rating tidak baik`
            });

            const newNotif = await Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by,
                title: 'Rating',
                detail: `
                    ${checkUser.username} memberikan rating ${1} 
                    kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap}`
            });
            socket.emit('rating', { 
                data: newNotif, 
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Tambah) rating tidak baik`,
                user_id: user.id
            });
        } else if (rating == 2) {
            await Tracking.create({
                tiket_id,
                user_id,
                status: `Memberikan rating kurang baik`
            });

            const newNotif = await Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by,
                title: 'Rating',
                detail: `
                    ${checkUser.username} memberikan rating ${2} 
                    kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap}`
            });
            socket.emit('rating', { 
                data: newNotif, 
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Tambah) rating kurang baik`,
                user_id: user.id
            });
        } else if (rating == 3) {
            await Tracking.create({
                tiket_id,
                user_id,
                status: `Memberikan rating standar`
            });

            const newNotif = await Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by,
                title: 'Rating',
                detail: `
                    ${checkUser.username} memberikan rating ${3} 
                    kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap}`
            });
            socket.emit('rating', { 
                data: newNotif, 
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Tambah) rating standar`,
                user_id: user.id
            });
        } else if (rating == 4) {
            await Tracking.create({
                tiket_id,
                user_id,
                status: `Memberikan rating baik`
            });

            const newNotif = await Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by,
                title: 'Rating',
                detail: `
                    ${checkUser.username} memberikan rating ${4} 
                    kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap}`
            });
            socket.emit('rating', { 
                data: newNotif, 
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Tambah) rating baik`,
                user_id: user.id
            });
        } else if (rating == 5) {
            await Tracking.create({
                tiket_id,
                user_id,
                status: `Memberikan rating sangat baik`
            });
            
            const newNotif = await Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by,
                title: 'Rating',
                detail: `
                    ${checkUser.username} memberikan rating ${5} 
                    kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap}`
            });
            socket.emit('rating', { 
                data: newNotif, 
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Tambah) rating sangat baik`,
                user_id: user.id
            });
        } else {
            throw { error: 'Gagal memberikan rating.' };
        }

        return {
            message: 'Terima kasih telah memberikan rating :).',
            data: await Rating.findOne({
                where: { id: checkRating.id },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

module.exports = {
    Create
}