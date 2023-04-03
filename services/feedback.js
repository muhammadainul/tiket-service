const debug = require('debug');
const log = debug('tiket-service:services:');

const { 
    Feedback, 
    Tiket,
    Users,
    Tracking,
    Logs 
} = require('../models');

async function Create (feedbackData, user) {
    const { tiket_id, user_id, feedback } = feedbackData;
    log('[Feedback] Create', { feedbackData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiket_id },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        const checkFeedback = await Feedback.findOne({
            where: { tiket_id },
            raw: true
        });
        if (!checkFeedback) throw { error: 'Feedback tidak tersedia.' };
 
        // if (checkUser.kewenangan_id !== 5) 
        //     throw { error: 'Gagal memberikan feedback. Role anda bukan user.'};

        // if (checkTiket.reported_by !== user_id) 
        //     throw { error: 'Gagal memberikan feedback. Tiket bukan milik anda.' };

        if (checkTiket.status !== 6) 
            throw { error: 'Gagal memberikan feedback. Tiket anda belum selesai.' };

        await Feedback.update({
            feedback,
            status: true
        },
        { where: { id: checkFeedback.id } }
        );

        if (feedback == 0) {
            await Tracking.create({
                tiket_id,
                user_id,
                status: `Memberikan feedback negatif`
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Tambah) feedback negatif`,
                user_id: user.id
            });
        } else {
            await Tracking.create({
                tiket_id,
                user_id,
                status: `Memberikan feedback positif`
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Tambah) feedback positif`,
                user_id: user.id
            });
        }

        return {
            message: 'Feedback berhasil dibuat.',
            data: await Feedback.findOne({
                where: { id: checkFeedback.id },
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
