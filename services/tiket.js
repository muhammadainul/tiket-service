const debug = require('debug');
const log = debug('tiket-service:services:');

const { 
    isBoolean, 
    isEmpty, 
    toUpper, 
    toInteger 
} = require('lodash');

const moment = require('moment');
const qr = require('qrcode');
const nodemailer = require('nodemailer');
const fs = require('fs');

const {
    Tiket,
    Gambar,
    Tracking,
    Users,
    Kewenangan,
    Teknisi, 
    Pegawai,
    Kategori,
    Komentar,
    Level,
    Rating,
    Feedback,
    Reservasi,
    Notifikasi,
    Satker,
    // Layanan,
    // Email_config,
    Logs
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const { Upload } = require('../helpers/upload');

const Queue = require('../queues/bull-queue')({ name: 'closed-tiket-process' });
const qTiket = require('../queues/tiket')({ name: 'create-tiket-process' });

Queue.process('closed-tiket', 1, ClosedTiketJob);
Queue.process('create-tiket', 1, CreateTiket)

async function Create (tiketData, user, tiketFiles) {
    const {
        kategori_id = 20,
        user_id, // untuk insert log
        judul = null,
        detail = null,
        telepon = null,
        nama_pelapor,
        email,
        type = 'apps'
    } = tiketData;
    log('[Tiket] Create', { tiketData, user, tiketFiles });
    try {
        const data = [];

        if (!email) throw { error: 'Email harus diisi.' };

        if (!kategori_id) throw { error: 'Kategori harus dipilih.' };

        const checkKategori = await Kategori.findOne({
            where: { id: kategori_id },
            raw: true
        });
        if (!checkKategori) throw { error: 'Kategori tidak tersedia.' };

        let checkUser;
        if (type == 'email') {
            checkUser = await Users.findOne({
                where: {
                    [Op.and]: [
                        { email },
                        { kewenangan_id: 6 },
                        { enabled: true }
                    ]
                },
                raw: true
            });
            if (!checkUser) throw { error: 'User tidak tersedia.' };

            const checkSatker = await Satker.findOne({
                where: { id: checkUser.satker_id },
                raw: true
            });
            if (!checkSatker) throw { error: 'Satker tidak tersedia.' };

            const tiket = {
                no_tiket: '-',
                created_by: checkUser.id,
                reported_by: checkUser.id,
                nama_pelapor,
                kategori_id,
                judul,
                detail, 
                telepon,
                email,
                status: 0, // menunggu persetujuan dari operator
                type,
                user,
                checkUser,
                user_id: checkUser.id
            }

            // create queue tiket / backup script lama (menggunakan queue)
            const jobQueue = Queue.add('create-tiket', tiket);
            if (!jobQueue) throw { error: 'Tiket gagal dibuat.' };

            // await CreateTiket(tiket);

            data.push({
                no_tiket: '-',
                created_tiket: true
            });
            const qrCode = await GenerateQR(data);
    
            const mailNotes = {
                nama_lengkap: checkUser.nama_lengkap,
                no_tiket: '-',
                detail,
                tanggal_tiket: moment().format(),
                email,
                qrCode
            };
            qTiket.add('send-mail', mailNotes);
        } else {
            const checkUser = await Users.findOne({
                where: { id: user_id },
                raw: true
            });
            if (!checkUser) throw { error: 'User tidak tersedia.' };

            const checkSatker = await Satker.findOne({
                where: { id: checkUser.satker_id },
                raw: true
            });
            if (!checkSatker) throw { error: 'Satker tidak tersedia.' };

            (!checkKategori.akronim) 
                ? `${checkSatker.kode_satker}/${moment().format('DD/MM/YYYY')}/`
                : `${checkSatker.kode_satker}/${checkKategori.akronim}/${moment().format('DD/MM/YYYY')}/`;

            const start = `${checkSatker.kode_satker}/${checkKategori.akronim}/${moment().format('DD/MM/YYYY')}/`;
            const end = Math.random().toString(36).slice(6);
            const no_tiket = toUpper(start + end);
            
            let tiket;
            if (!isEmpty(tiketFiles)) {
                const destination = config.myConfig.destination_image;
                const path = config.myConfig.path_image;
                var createImage = await Gambar.create({
                    originalname: tiketFiles.originalname,
                    encoding: tiketFiles.encoding,
                    mimetype: tiketFiles.mimetype,
                    destination,
                    filename: tiketFiles.filename,
                    path,
                    size: tiketFiles.size
                });
    
                await Upload(tiketFiles);

                tiket = {
                    no_tiket,
                    created_by: user_id,
                    reported_by: user_id,
                    nama_pelapor,
                    kategori_id,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status: 0, // menunggu persetujuan dari operator
                    type,
                    gambar_id: createImage.id,
                    user,
                    checkUser,
                    user_id
                }
            } else {
                tiket = {
                    no_tiket,
                    created_by: user_id,
                    reported_by: user_id,
                    nama_pelapor,
                    kategori_id,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status: 0, // menunggu persetujuan dari operator
                    type,
                    user,
                    checkUser,
                    user_id
                }
            }    

            // create queue tiket
            const jobQueue = Queue.add('create-tiket', tiket);
            if (!jobQueue) throw { error: 'Tiket gagal dibuat.' };

            data.push({
                no_tiket,
                created_tiket: true
            });
            const qrCode = await GenerateQR(data);
    
            const mailNotes = {
                nama_lengkap: checkUser.nama_lengkap,
                no_tiket,
                detail,
                tanggal_tiket: moment().format(),
                email,
                qrCode
            };

            // send mail queue
            qTiket.add('send-mail', mailNotes);
        }

        return { message: 'Tiket berhasil dibuat.' };
    } catch (error) {
        return error;
    }
}

async function ApprovedIn (tiketId, tiketData, user) {
    const { 
        level_id, 
        approved,
        user_id // untuk insert log
    } = tiketData;
    log('[Tiket] Approved', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!approved || !level_id || !user_id) 
            throw { error: 'Approved / level_id / user_id harus dilampirkan.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        const checkLevel = await Level.findOne({
            where: { id: level_id },
            raw: true
        });
        if (!checkLevel) throw { error: 'Level tidak tersedia.' };

        if (approved == true) {
            await Tiket.update({
                status: 1, // tiket disetujui operator
                level_id
            }, 
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: 'Tiket disetujui'
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Approved) tiket disetujui.`,
                user_id: user.id
            });
            
            const newNotif = await Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                title: 'Tiket disetujui!',
                detail: `Tiket dengan nomor ${checkTiket.no_tiket} telah di-approve.`
            })
            socket.emit('approve-tiket', { 
                data: newNotif, 
                user_id: checkTiket.reported_by,
                pegawai_id: '', 
                role: 'ADMIN',
                user: 'USER' 
            });

            return {
                message: 'Tiket berhasil di-approve.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        }
    } catch (error) {
        return error;
    }
}

async function Assign (tiketId, tiketData, user) {
    const { 
        assign = true, 
        handled_by,
        user_id 
    } = tiketData;
    log('[Tiket] Assign', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!assign || !handled_by || !user_id) 
            throw { error: 'Assign / handled_by / user_id harus dilampirkan.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        const checkPegawai = await Pegawai.findOne({
            where: { id: handled_by },
            raw: true
        });
        if (!checkPegawai) throw { error: 'Pegawai tidak tersedia' };

        const checkUserPegawai = await Users.findOne({
            where: { id: checkPegawai.user_id },
            raw: true
        });

        const checkKewenangan = await Kewenangan.findOne({
            where: { id: checkUserPegawai.kewenangan_id },
            raw: true
        });
        if (!checkKewenangan) throw { error: 'Kewenangan tidak tersedia.' };

        const checkLevel = await Level.findOne({
            where: { id: checkPegawai.level },
            raw: true
        });

        if (checkUserPegawai.kewenangan_id == 3) {
            await Tiket.update({
                status: 3, // tiket diberikan kepada admin,
                handled_by: checkPegawai.id,
                tanggal_proses: sequelize.fn('now')
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: `Tiket dialihkan kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap} (Level ${checkLevel.level})`
            });

            await Rating.update({
                pegawai_id: checkPegawai.id,
            },
            { where: { tiket_id: tiketId } }
            );

            const newNotif = await Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkPegawai.id,
                title: 'Tiket di-assign!',
                detail: `
                    Tiket dengan nomor ${checkTiket.no_tiket}
                    dialihkan kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap} (Level ${checkLevel.level})
                    `
            });
            socket.emit('assign-tiket', { 
                data: newNotif, 
                user_id: checkTiket.reported_by, 
                pegawai_id: checkPegawai.id
            });
        // } else if (checkUserPegawai.kewenangan_id == 3) {
        //     await Tiket.update({
        //         status: 4, // tiket assign staff,
        //         handled_by: checkPegawai.id,
        //         tanggal_proses: sequelize.fn('now')
        //     },
        //     { where: { id: tiketId } }
        //     );

        //     await Tracking.create({
        //         tiket_id: tiketId,
        //         user_id: user.id,
        //         status: `Tiket dialihkan kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap} (Level ${checkLevel.level})`
        //     });

        //     await Rating.update({
        //         pegawai_id: checkPegawai.id,
        //     },
        //     { where: { tiket_id: tiketId } }
        //     );
            
        //     const newNotif = await Notifikasi.create({
        //         tiket_id: checkTiket.id,
        //         user_id: checkTiket.reported_by,
        //         pegawai_id: checkPegawai.id,
        //         title: 'Tiket di-assign!',
        //         detail: `
        //             Tiket dengan nomor ${checkTiket.no_tiket}
        //             dialihkan kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap} (Level ${checkLevel.level})
        //             `
        //     });
        //     socket.emit('assign-tiket', { 
        //         data: newNotif, 
        //         user_id: checkTiket.reported_by, 
        //         pegawai_id: checkPegawai.id
        //     });
        } else if (checkUserPegawai.kewenangan_id == 4) {
            await Tiket.update({
                status: 5, // tiket diberikan tim teknis,
                handled_by: checkPegawai.id,
                tanggal_proses: sequelize.fn('now')
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: `Tiket dialihkan kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap} (Level ${checkLevel.level})`,
            });

            await Rating.update({
                pegawai_id: checkPegawai.id,
            },
            { where: { tiket_id: tiketId } }
            );

            const newNotif = await Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkPegawai.id,
                title: 'Tiket di-assign!',
                detail: `
                    Tiket dengan nomor ${checkTiket.no_tiket}
                    dialihkan kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap} (Level ${checkLevel.level})
                    `
            });
            socket.emit('assign-tiket', { 
                data: newNotif, 
                user_id: checkTiket.reported_by, 
                pegawai_id: checkPegawai.id
            });
        } else {
            return { message: 'Tiket gagal di-assign' };
        }

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Assign) tiket`,
            user_id: user.id
        });

        return {
            message: 'Tiket berhasil di-assign.',
            data: await Tiket.findOne({
                where: { id: tiketId },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function Approved (tiketId, tiketData, user) {
    const { 
        approved = true, 
        alasan = null,
        kategori_id,
        user_id  // untuk insert log
    } = tiketData;
    log('[Tiket] Approved by Operator', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!user_id) throw { error: 'User_id harus dilampirkan.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        const checkSatker = await Satker.findOne({
            where: { id: checkUser.satker_id },
            raw: true
        });
        if (!checkSatker) throw { error: 'Satker tidak tersedia.' };

        const checkPegawai = await Pegawai.findOne({
            where: { id: checkTiket.handled_by },
            include: {
                model: Users,
                attributes: ['nama_lengkap'],
                as: 'user'
            },
            raw: true,
            nest: true
        });

        let checkKategori;
        if (kategori_id) {
            checkKategori = await Kategori.findOne({
                where: { id: kategori_id },
                raw: true
            });
            if (!checkKategori) throw { error: 'Kategori tidak tersedia.' };
        }

        if (approved == true) {
            if (checkTiket.kategori_id == 20 || checkTiket.type == 'email') {
                if (!kategori_id) throw { error: 'Kategori harus dipilih.' };

                (!checkKategori.akronim) 
                    ? `${checkSatker.kode_satker}/${moment().format('DD/MM/YYYY')}/`
                    : `${checkSatker.kode_satker}/${checkKategori.akronim}/${moment().format('DD/MM/YYYY')}/`;

                const start = `${checkSatker.kode_satker}/${checkKategori.akronim}/${moment().format('DD/MM/YYYY')}/`;
                const end = Math.random().toString(36).slice(6);
                const no_tiket = toUpper(start + end);

                const checkKategoriPegawai = await Pegawai.findOne({
                    where: { kategori_id },
                    include: {
                        model: Users,
                        attributes: ['nama_lengkap', 'username'],
                        as: 'user'
                    },
                    raw: true,
                    nest: true
                });
                
                await Tiket.update({
                    no_tiket,
                    status: 1, // tiket disetujui oleh operator,
                    kategori_id,
                    handled_by: checkKategoriPegawai.id,
                    tanggal_proses: sequelize.fn('now')
                }, 
                { where: { id: tiketId } }
                );

                await Tracking.create({
                    tiket_id: tiketId,
                    user_id: user.id,
                    status: `Tiket di-approve & diproses oleh ${checkKategoriPegawai.user.nama_lengkap}`
                });
    
                await Logs.create({
                    ip_address: user.ip_address,
                    browser: user.browser,
                    browser_version: user.browser_version,
                    os: user.os,
                    logdetail: `(Approved) proses tiket.`,
                    user_id: user.id
                });
    
                const newNotif = await Notifikasi.create({
                    tiket_id: checkTiket.id,
                    user_id: checkTiket.reported_by,
                    pegawai_id: checkKategoriPegawai.id,
                    title: 'Tiket disetujui!',
                    detail: `Tiket dengan nomor ${no_tiket} disetujui & diproses oleh operator ${checkKategoriPegawai.user.nama_lengkap}.`
                });
                socket.emit('approve-tiket', { 
                    data: newNotif, 
                    user_id: checkTiket.reported_by,
                    pegawai_id: checkKategoriPegawai.id,
                });
            } else {
                await Tiket.update({
                    status: 1, // tiket disetujui oleh operator,
                    tanggal_proses: sequelize.fn('now')
                }, 
                { where: { id: tiketId } }
                );

                await Tracking.create({
                    tiket_id: tiketId,
                    user_id: user.id,
                    status: `Tiket di-approve & diproses oleh ${checkUser.nama_lengkap}`
                });
    
                await Logs.create({
                    ip_address: user.ip_address,
                    browser: user.browser,
                    browser_version: user.browser_version,
                    os: user.os,
                    logdetail: `(Approved) proses tiket.`,
                    user_id: user.id
                });
    
                const newNotif = await Notifikasi.create({
                    tiket_id: checkTiket.id,
                    user_id: checkTiket.reported_by,
                    pegawai_id: checkTiket.handled_by,
                    title: 'Tiket disetujui!',
                    detail: `Tiket dengan nomor ${checkTiket.no_tiket} disetujui & diproses oleh operator ${checkPegawai.user.nama_lengkap}.`
                });
                socket.emit('approve-tiket', { 
                    data: newNotif, 
                    user_id: checkTiket.reported_by,
                    pegawai_id: checkTiket.handled_by
                });    
            }
            
            return {
                message: 'Tiket berhasil di-approve.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        } else {
            // Tiket tidak di approve oleh operator
            if (!alasan) throw { error: 'Alasan harus diisi.' };

            await Tiket.update({
                status: 2, // tiket di-reject (user harus create tiket ulang)
                handled_by: null,
                tanggal_proses: null,
                alasan
            },
            { where: { id: tiketId } }
            );   

            await Rating.destroy({ where: { tiket_id: tiketId } });

            await Feedback.destroy({ where: { tiket_id: tiketId } });

            await Tracking.create({
                tiket_id: tiketId,
                user_id,
                status: `Tiket ditolak oleh ${checkUser.nama_lengkap}`
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Reject) tiket.`,
                user_id: user.id
            });

            const newNotif = await Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by,
                title: 'Tiket ditolak!',
                detail: `Tiket dengan nomor ${checkTiket.no_tiket} ditolak oleh operator ${checkPegawai.user.nama_lengkap}.
                    Silahkan membuat tiket kembali.`
            });
            socket.emit('reject-tiket', { 
                data: newNotif, 
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by
            });

            return {
                message: 'Tiket rejected.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        }
    } catch (error) {
        return error;
    }
}

async function Update (tiketId, tiketData, user) {
    const { 
        komentar,
        user_id // untuk insert log
    } = tiketData;
    log('[Tiket] Update', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!komentar || !user_id) 
            throw { error: 'Komentar / User ID harus dilampirkan.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        const komentarData = await Komentar.create({
            tiket_id: tiketId,
            user_id: user.id,
            komentar
        });

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Update) memberikan komentar ${komentar}.`,
            user_id: user.id
        });

        return {
            message: 'Komentar berhasil ditambah.',
            data: await Komentar.findOne({
                include: {
                    model: Users,
                    attributes: ['nama_lengkap'],
                    as: 'user',
                    include: [
                        {
                            model: Kewenangan,
                            attributes: ['kewenangan'],
                            as: 'kewenangan'
                        },
                        {
                            model: Gambar,
                            attributes: ['destination', 'filename'],
                            as: 'files'
                        }
                    ]
                },
                where: { id: komentarData.id },
                nest: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function Solved (tiketId, tiketData, user) {
    const { 
        solved = true, 
        user_id, 
        deskripsi 
    } = tiketData;
    log('[Tiket] Solved', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        const checkKewenangan = await Kewenangan.findOne({
            where: { id: checkUser.kewenangan_id },
            raw: true
        });

        const checkReservasi = await Reservasi.findOne({
            where: { tiket_id: tiketId },
            raw: true
        });
        if (!isEmpty(checkReservasi)) {
            if (checkReservasi.status == false) 
                throw { error: 'Reservasi kunjungan anda belum selesai.' };
        }

        if (solved == true) {
            await Tiket.update({
                status: 6,
                progress: 100,
                alasan: deskripsi,
                tanggal_selesai: sequelize.fn('now')    
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user_id,
                deskripsi,
                status: `Tiket solved`
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Solved) tiket.`,
                user_id: user.id
            });

            const newNotif = await Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by,
                title: 'Tiket solved!',
                detail: `
                    Tiket dengan nomor ${checkTiket.no_tiket} 
                    telah diselesaikan oleh ${checkKewenangan.kewenangan} 
                    ${checkUser.username}`
            });
            socket.emit('solve-tiket', { 
                data: newNotif, 
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by
            });

            const getDuration = await Tiket.findOne({
                attributes:[
                    [sequelize.fn('age', sequelize.col('createdAt'), sequelize.col('tanggal_selesai')), 'duration']
                ],
                where: { id: tiketId },
                raw: true
            });

            await Tiket.update({
                durasi: Math.abs(getDuration.duration.minutes)
            },
            { where: { id: tiketId } }
            );

            // Start queue auto closed tiket
            Queue.add(
                'closed-tiket',
                { 
                    tiket_id: tiketId,
                    reported_by: checkTiket.reported_by,
                    handled_by: checkTiket.handled_by
                },
                {
                    delay: 600000, // 24 * 60 * 1000,
                    jobId: `tiket:${tiketId}`,
                    removeOnComplete: true,
                    removeOnFail: true
                }
            )

            return {
                message: 'Tiket berhasil diselesaikan.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        } else {
            throw { error: 'Tiket gagal diselesaikan.' };
        }
    } catch (error) {
        return error;
    }
}

async function Closed (tiketId, tiketData, user) {
    const { 
        closed = true,
        user_id
    } = tiketData;
    log('[Tiket] Closed', { tiketId, tiketData, user });
    try {
        if (!user_id) throw { error: 'User anda harus dilampirkan.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
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

        // if (checkTiket.reported_by !== user_id) 
        //     throw { error: 'Gagal menyelesaikan tiket. Tiket bukan milik anda.' };

        if (checkTiket.status == 7) throw { error: 'Tiket anda sudah selesai.' };

        if (checkTiket.status !== 6) 
            throw { error: `Gagal menyelesaikan tiket. Tiket anda belum diselesaikan oleh ${checkUserPegawai.username}` };

        const checkReservasi = await Reservasi.findOne({
            where: { tiket_id: tiketId },
            raw: true
        });
        if (checkReservasi) {
            if (checkReservasi.status == false) 
                throw { error: 'Gagal menyelesaikan tiket. Reservasi oleh pegawai belum selesai.' };
        }

        const checkRating = await Rating.findOne({
            where: { tiket_id: tiketId },
            raw: true
        });
        if (checkRating.status == false) throw { error: 'Anda belum memberikan rating.' };

        if (closed) {
            await Tiket.update({
                status: 7
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user_id,
                status: `Tiket closed`
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Closed) tiket.`,
                user_id: user.id
            });

            const newNotif = await Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by,
                title: 'Tiket closed!',
                detail: `
                    Tiket dengan nomor ${checkTiket.no_tiket} 
                    telah ditutup oleh ${checkUser.username}`
            });
            socket.emit('close-tiket', { 
                data: newNotif, 
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by
            });

            // remove queue closed tiket
            const job = await Queue.getJob(`tiket:${tiketId}`);
            job.remove();

            return {
                message: 'Tiket anda berhasil diselesaikan.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        } else {
            return {
                message: 'Tiket anda gagal diselesaikan.'
            };
        }
    } catch (error) {
        return error;
    }
}

async function Pending (tiketId, tiketData, user) {
    const { 
        pending, 
        reason, 
        user_id // untuk insert log
    } = tiketData;
    log('[Tiket] Pending', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!pending || !reason || !user_id) 
            throw { error: 'Pending / reason / user_id harus dilampirkan,'};
        
        if (!isBoolean(pending)) throw { error: 'Pending tidak sesuai.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        if (pending == true && reason !== '') {
            await Tiket.update({
                status: 4, // tiket dipending oleh teknisi
                alasan: reason
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: `Tiket ditunda oleh ${checkUser.nama_lengkap}`,
                deskripsi: reason
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Pending) tiket.`,
                user_id: user.id
            });

            return {
                message: 'Tiket berhasil di-pending.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        } else {
            return { message: 'Tiket gagal di-pending.' };
        }
    } catch (error) {
        return error;
    }
}

async function ForwardTo (tiketId, tiketData, user) {
    const { 
        forward_to, 
        reason, 
        user_id // untuk insert log
    } = tiketData;
    log('[Tiket] ForwardTo', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!forward_to || !reason || !user_id) 
            throw { error: 'Forward_to / reason / user_id harus dilampirkan.' };

        if (!isBoolean(forward_to)) throw { error: 'Forward_to tidak sesuai.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        if (forward_to == true) {
            await Tiket.update({
                status: 5, // tiket di forward / tiket dikembalikan kepada admin
                handled_by: null,
                tanggal_proses: null,
                alasan: reason
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: 'Tiket dikembalikan kepada admin',
                deskripsi: reason
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(forward) tiket.`,
                user_id: user.id
            });

            return {
                message: 'Tiket berhasil dikembalikan kepada admin.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        } else {
            return { message: 'Tiket gagal dikembalikan kepada admin.' };
        }
    } catch (error) {
        return error;
    }
}

async function GetById (tiketId) {
    log('[Tiket] GetById', tiketId);
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        const tiketData = await Tiket.findOne({
            attributes: [
                'id',
                'no_tiket',
                'judul',
                'nama_pelapor',
                'detail',
                'status',
                'progress',
                ['createdAt', 'tanggal_tiket'],
                'tanggal_proses',
                'tanggal_selesai',
                'kategori_id',
                'level_id',
                ['alasan', 'deskripsi'],
                'durasi'
            ],  
            include: [
                {
                    model: Gambar,
                    as: 'files',
                    attributes: ['filename', 'destination']
                },
                {
                    model: Users,
                    as: 'created',
                    attributes: ['username', 'nama_lengkap']
                },
                {
                    model: Users,
                    as: 'reported',
                    attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon']
                },
                {
                    model: Pegawai,
                    attributes: ['id', 'user_id', 'departemen', 'jabatan'],
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
                },
                {
                    model: Tracking,
                    as: 'tracking', 
                    attributes: ['id', 'tiket_id', 'status', 'deskripsi', 'createdAt'],
                    include: {
                        model: Users,
                        as: 'user',
                        attributes: ['username', 'nama_lengkap']
                    }
                },
                {
                    model: Komentar,
                    as: 'komentar',
                    attributes: ['tiket_id', 'user_id', 'komentar'],
                    include: {
                        model: Users,
                        attributes: ['nama_lengkap'],
                        as: 'user',
                        include: [
                            {
                                model: Kewenangan,
                                attributes: ['kewenangan'],
                                as: 'kewenangan'
                            },
                            {
                                model: Gambar,
                                attributes: ['destination', 'filename'],
                                as: 'files'
                            }
                        ]
                    }
                },
                {
                    model: Rating,
                    as: 'rating',
                    attributes: ['rating', 'status']
                },
                {
                    model: Feedback,
                    as: 'feedback',
                    attributes: ['feedback', 'status']
                }
            ],
            where: { id: tiketId },
            order: [['komentar', 'createdAt', 'desc']],
            nest: true
        });

        return {
            data: tiketData
        };
    } catch (error) {
        return error;
    }
}

async function GetByTiket (tiketData) {
    const { no_tiket } = tiketData;
    log('[Tiket] GetByTiket', tiketData);
    try {
        if (!no_tiket) throw { error: 'Nomor tiket harus dilampirkan.' };

        const checkTiket = await Tiket.findOne({
            where: { no_tiket },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        const tiketData = await Tiket.findOne({
            attributes: [
                'id',
                'no_tiket',
                'nama_pelapor',
                'judul',
                'detail',
                'status',
                'progress',
                ['createdAt', 'tanggal_tiket'],
                'tanggal_proses',
                'tanggal_selesai',
                'kategori_id',
                'level_id',
                ['alasan', 'deskripsi'],
                'durasi'
            ],  
            include: [
                {
                    model: Gambar,
                    as: 'files',
                    attributes: ['filename', 'destination']
                },
                {
                    model: Users,
                    as: 'created',
                    attributes: ['username', 'nama_lengkap']
                },
                {
                    model: Users,
                    as: 'reported',
                    attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon']
                },
                {
                    model: Pegawai,
                    attributes: ['id', 'user_id', 'departemen', 'jabatan'],
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
                },
                {
                    model: Tracking,
                    as: 'tracking', 
                    attributes: ['id', 'tiket_id', 'status', 'deskripsi', 'createdAt'],
                    include: {
                        model: Users,
                        as: 'user',
                        attributes: ['username', 'nama_lengkap']
                    }
                },
                {
                    model: Komentar,
                    as: 'komentar',
                    attributes: ['tiket_id', 'user_id', 'komentar'],
                    include: {
                        model: Users,
                        attributes: ['nama_lengkap'],
                        as: 'user',
                        include: [
                            {
                                model: Kewenangan,
                                attributes: ['kewenangan'],
                                as: 'kewenangan'
                            },
                            {
                                model: Gambar,
                                attributes: ['destination', 'filename'],
                                as: 'files'
                            }
                        ]
                    }
                },
                {
                    model: Rating,
                    as: 'rating',
                    attributes: ['rating', 'status']
                },
                {
                    model: Feedback,
                    as: 'feedback',
                    attributes: ['feedback', 'status']
                }
            ],
            where: { no_tiket },
            order: [['komentar', 'updatedAt', 'desc']],
            nest: true
        });

        return {
            data: tiketData
        };
    } catch (error) {
        return error;
    }
}

async function GetByTiketQr (tiketData) {
    const { no_tiket } = tiketData;
    log('[Tiket] GetByTiketQr', tiketData);
    try {
        const data = [];

        if (!no_tiket) throw { error: 'Nomor tiket harus dilampirkan.' };

        const checkTiket = await Tiket.findOne({
            where: { no_tiket },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        data.push({
            no_tiket: checkTiket.no_tiket,
            tanggal_tiket: moment(checkTiket.createdAt).format('YYYY-MM-DD HH:mm:ss'),
            judul: checkTiket.judul,
            deskripsi: checkTiket.detail,
            status: checkTiket.status,
            created_tiket: false
        });
        const qrCode = await GenerateQR(data);

        if (!qrCode) throw { error: 'QR code gagal dibuat.' };

        return qrCode;
    } catch (error) {
        return error;
    }
}

async function GetByEmployee (pegawai_id) {
    log('[Tiket] GetByEmployee', pegawai_id);
    try {
        const checkPegawai = await Pegawai.findOne({
            where: { id: pegawai_id },
            raw: true
        });
        if (!checkPegawai) throw { error: 'Pegawai tidak tersedia.' };

        const tiketData = await Tiket.findAll({
            attributes: ['id', 'no_tiket', 'nama_pelapor', 'judul', 'progress'],
            include: [
                {
                    model: Gambar,
                    as: 'files',
                    attributes: ['filename', 'destination']
                },
                {
                    model: Users,
                    as: 'created',
                    attributes: ['username', 'nama_lengkap'],
                    required: true,
                    duplicating: false
                },
                {
                    model: Users,
                    as: 'reported',
                    attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon'],
                    required: true,
                    duplicating: false
                },
                {
                    model: Pegawai,
                    attributes: ['id', 'user_id', 'departemen', 'jabatan'],
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
                            required: true,
                            duplicating: false,
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
                },
                {
                    model: Tracking,
                    as: 'tracking', 
                    attributes: ['id', 'tiket_id', 'status', 'deskripsi', 'createdAt'],
                    include: {
                        model: Users,
                        as: 'user',
                        attributes: ['username', 'nama_lengkap']
                    }
                },
                {
                    model: Komentar,
                    as: 'komentar',
                    attributes: ['tiket_id', 'user_id', 'komentar'],
                    include: {
                        model: Users,
                        attributes: ['nama_lengkap'],
                        as: 'user',
                        include: [
                            {
                                model: Kewenangan,
                                attributes: ['kewenangan'],
                                as: 'kewenangan'
                            },
                            {
                                model: Gambar,
                                attributes: ['destination', 'filename'],
                                as: 'files'
                            }
                        ]
                    }
                }
            ],
            where: { handled_by: pegawai_id },
            order: [['komentar', 'updatedAt', 'desc']],
            nest: true
        });

        return tiketData;
    } catch (error) {
        return error;
    }
}

async function GetByUser (user_id) {
    log('[Tiket] GetByUser', user_id);
    try {
        const checkUser = await Users.findAll({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        const tiketData = await Tiket.findAll({
            attributes: ['id', 'no_tiket', 'nama_pelapor', 'judul', 'progress'],
            include: [
                {
                    model: Gambar,
                    as: 'files',
                    attributes: ['filename', 'destination']
                },
                {
                    model: Users,
                    as: 'created',
                    attributes: ['username', 'nama_lengkap'],
                    required: true,
                    duplicating: false
                },
                {
                    model: Users,
                    as: 'reported',
                    attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon'],
                    required: true,
                    duplicating: false
                },
                {
                    model: Pegawai,
                    attributes: ['id', 'user_id', 'departemen', 'jabatan'],
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
                            required: true,
                            duplicating: false,
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
                },
                {
                    model: Tracking,
                    as: 'tracking', 
                    attributes: ['id', 'tiket_id', 'status', 'deskripsi', 'createdAt'],
                    include: {
                        model: Users,
                        as: 'user',
                        attributes: ['username', 'nama_lengkap']
                    }
                },
                {
                    model: Komentar,
                    as: 'komentar',
                    attributes: ['tiket_id', 'user_id', 'komentar'],
                    include: {
                        model: Users,
                        attributes: ['nama_lengkap'],
                        as: 'user',
                        include: [
                            {
                                model: Kewenangan,
                                attributes: ['kewenangan'],
                                as: 'kewenangan'
                            },
                            {
                                model: Gambar,
                                attributes: ['destination', 'filename'],
                                as: 'files'
                            }
                        ]
                    }
                }
            ],
            where: { reported_by: user_id },
            order: [['komentar', 'updatedAt', 'desc']],
            nest: true
        });

        return tiketData;
    } catch (error) {
        return error;
    }
}

async function GetDatatables (tiketData) {
    const { 
        draw, 
        order, 
        start, 
        length, 
        search,
        username, 
        nama_lengkap,
        no_tiket,
        judul,
        status,
        tempat,
        kategori_id,
        level_id,
        pegawai_id,
        user_id,
        startDate,
        endDate,
        type,
        urutan
    } = tiketData;
    log('[Tiket] GetDatatables', tiketData);
    try {
        let whereByNoTiket;
        if (no_tiket !== '') {
            whereByNoTiket = {
                no_tiket: { [Op.iLike]: `%${no_tiket}%` }   
            };
        };

        let whereByUsernameReported;
        if (username !== '') {
            whereByUsernameReported = {
                '$reported.username$': { [Op.iLike]: `%${username}%` }   
            }
        };

        let whereByNamaLengkapReported;
        if (nama_lengkap !== '') {
            whereByNamaLengkapReported = {
                '$reported.nama_lengkap$': { [Op.iLike]: `%${nama_lengkap}%` }   
            };
        };

        let whereByJudul;
        if (judul !== '') {
            whereByJudul = {
                judul: { [Op.iLike]: `%${judul}%` }   
            };
        };

        let whereByUserId;
        if (user_id !== '') {
            whereByUserId = {
                reported_by: user_id
            };
        };

        let whereByPegawai;
        if (pegawai_id !== '') {
            whereByPegawai = {
                handled_by: pegawai_id
            };
        };

        let whereByStatus;
        if (status !== '') {
            whereByStatus = {
                status
            };
        };

        let whereByKategori;
        if (kategori_id !== '') {
            whereByKategori = {
                kategori_id
            }
        }

        let whereByLevel;
        if (level_id !== '') {
            whereByLevel = {
                level_id
            }
        }

        let whereByDate;
        if (startDate !== '' || endDate !== '') {
            whereByDate = {
                [Op.and]: [
                    { createdAt: { [Op.gte]: moment(startDate).format() } },
                    { createdAt: { [Op.lte]: moment(endDate).format() } }
                ]
            };
        };

        let whereByTempat;
        if (tempat !== '') {
            whereByTempat = {
                '$reservasi.tempat$': { [Op.iLike]: `%${tempat}%` }   
            };
        };

        let whereByType;
        if (type !== '') {
            whereByType = {
                type
            };
        }

        // let whereByNamaPelapor;
        // if (nama_pelapor !== '') {
        //     whereByNamaPelapor = {
        //         nama_pelapor: { [Op.iLike]: `%${nama_pelapor}%` }
        //     };
        // }

        const where = {
            ...whereByType,
            ...whereByNoTiket,
            ...whereByUsernameReported,
            ...whereByNamaLengkapReported,
            ...whereByJudul,
            ...whereByUserId,
            ...whereByPegawai,
            ...whereByStatus,
            ...whereByKategori,
            ...whereByLevel,
            ...whereByDate,
            ...whereByTempat,
            // ...whereByNamaPelapor
        };

        let searchOrder;
        if (urutan) {
            searchOrder = [['createdAt', urutan]];
        };

        const [recordsTotal, recordsFiltered, data] = await Promise.all([
            Tiket.count({}),
            Tiket.count({ 
                include: [
                    {
                        model: Users,
                        as: 'created',
                        attributes: ['username', 'nama_lengkap'],
                        duplicating: false
                    },
                    {
                        model: Users,
                        as: 'reported',
                        attributes: ['username', 'nama_lengkap'],
                        duplicating: false
                    },
                    {
                        model: Reservasi,
                        as: 'reservasi',
                        attributes: [
                            'tiket_id', 
                            'tanggal', 
                            'tempat', 
                            'tujuan', 
                            'keterangan',
                            'status'
                        ]
                    }
                ],
                where 
            }),
            Tiket.findAll({
                attributes: [
                    'id',
                    'no_tiket',
                    'nama_pelapor',
                    'judul',
                    'detail',
                    'status',
                    'progress',
                    'created_by',
                    'reported_by',
                    'handled_by',
                    ['createdAt', 'tanggal_tiket'],
                    'tanggal_proses',
                    'tanggal_selesai',
                    'kategori_id',
                    'level_id',
                    ['alasan', 'deskripsi'],
                    'durasi',
                    'type',
                    'updatedAt'
                ],  
                include: [
                    {
                        model: Gambar,
                        as: 'files',
                        attributes: ['filename', 'destination']
                    },
                    {
                        model: Users,
                        as: 'created',
                        attributes: ['username', 'nama_lengkap'],
                        duplicating: false
                    },
                    {
                        model: Users,
                        as: 'reported',
                        attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon'],
                        required: true,
                        duplicating: false
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
                                duplicating: false
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
                    },
                    {
                        model: Tracking,
                        as: 'tracking', 
                        attributes: ['id', 'tiket_id', 'status', 'deskripsi', 'createdAt'],
                        include: {
                            model: Users,
                            as: 'user',
                            attributes: ['username', 'nama_lengkap']
                        }
                    },
                    {
                        model: Komentar,
                        as: 'komentar',
                        attributes: ['tiket_id', 'user_id', 'komentar'],
                        include: {
                            model: Users,
                            attributes: ['nama_lengkap'],
                            as: 'user',
                            include: [
                                {
                                    model: Kewenangan,
                                    attributes: ['kewenangan'],
                                    as: 'kewenangan'
                                },
                                {
                                    model: Gambar,
                                    attributes: ['destination', 'filename'],
                                    as: 'files'
                                }
                            ]
                        }
                    },
                    {
                        model: Rating,
                        as: 'rating',
                        attributes: ['rating', 'status']
                    },
                    {
                        model: Feedback,
                        as: 'feedback',
                        attributes: ['feedback', 'status']
                    },
                    {
                        model: Reservasi,
                        as: 'reservasi',
                        attributes: [
                            'tiket_id', 
                            'tanggal', 
                            'tempat', 
                            'tujuan', 
                            'keterangan',
                            'status'
                        ]
                    }
                ],
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

async function GetDatatablesNotOpen (tiketData) {
    const { 
        draw, 
        order, 
        start, 
        length, 
        search,
        username, 
        nama_lengkap,
        nama_pelapor,
        no_tiket,
        judul,
        kategori_id,
        level_id,
        pegawai_id,
        user_id,
        startDate,
        endDate,
        type,
        status,
        urutan
    } = tiketData;
    log('[Tiket] GetDatatablesNotOpen', tiketData);
    try {
        let whereByStatus;
        (status !== '') ? whereByStatus = { status } : whereByStatus = { status: { [Op.ne]: 0 } };
        
        let whereByNoTiket;
        if (no_tiket !== '') {
            whereByNoTiket = {
                no_tiket: { [Op.iLike]: `%${no_tiket}%` }   
            };
        };

        let whereByUsernameReported;
        if (username !== '') {
            whereByUsernameReported = {
                '$reported.username$': { [Op.iLike]: `%${username}%` }   
            }
        };

        let whereByNamaLengkapReported;
        if (nama_lengkap !== '') {
            whereByNamaLengkapReported = {
                '$reported.nama_lengkap$': { [Op.iLike]: `%${nama_lengkap}%` }   
            };
        };

        let whereByJudul;
        if (judul !== '') {
            whereByJudul = {
                judul: { [Op.iLike]: `%${judul}%` }   
            };
        };

        let whereByUserId;
        if (user_id !== '') {
            whereByUserId = {
                reported_by: user_id
            };
        };

        let whereByPegawai;
        if (pegawai_id !== '') {
            whereByPegawai = {
                handled_by: pegawai_id
            };
        };

        let whereByKategori;
        if (kategori_id !== '') {
            whereByKategori = {
                kategori_id
            }
        }

        let whereByLevel;
        if (level_id !== '') {
            whereByLevel = {
                level_id
            }
        }

        let whereByDate;
        if (startDate !== '' || endDate !== '') {
            whereByDate = {
                [Op.and]: [
                    { createdAt: { [Op.gte]: moment(startDate).format() } },
                    { createdAt: { [Op.lte]: moment(endDate).format() } }
                ]
            };
        };

        let whereByType;
        if (type !== '') {
            whereByType = {
                type
            };
        }

        let whereByNamaPelapor;
        if (nama_pelapor !== '') {
            whereByNamaPelapor = {
                nama_pelapor: { [Op.iLike]: `%${nama_pelapor}%` }
            };
        }

        const where = {
            ...whereByType,
            ...whereByNoTiket,
            ...whereByUsernameReported,
            ...whereByNamaLengkapReported,
            ...whereByJudul,
            ...whereByUserId,
            ...whereByPegawai,
            ...whereByStatus,
            ...whereByKategori,
            ...whereByLevel,
            ...whereByDate,
            ...whereByNamaPelapor
        };

        let searchOrder;
        if (urutan) {
            searchOrder = [['updatedAt', urutan]];
        };

        const [recordsTotal, recordsFiltered, data] = await Promise.all([
            Tiket.count({}),
            Tiket.count({ 
            include: [
                {
                    model: Users,
                    as: 'created',
                    attributes: ['username', 'nama_lengkap'],
                    duplicating: false
                },
                {
                    model: Users,
                    as: 'reported',
                    attributes: ['username', 'nama_lengkap'],
                    duplicating: false
                }
            ],
            where 
            }),
            Tiket.findAll({
                attributes: [
                    'id',
                    'no_tiket',
                    'judul',
                    'nama_pelapor',
                    'detail',
                    'status',
                    'progress',
                    'created_by',
                    'reported_by',
                    'handled_by',
                    ['createdAt', 'tanggal_tiket'],
                    'tanggal_proses',
                    'tanggal_selesai',
                    'kategori_id',
                    'level_id',
                    ['alasan', 'deskripsi'],
                    'durasi',
                    'type',
                    'updatedAt'
                ],  
                include: [
                    {
                        model: Gambar,
                        as: 'files',
                        attributes: ['filename', 'destination']
                    },
                    {
                        model: Users,
                        as: 'created',
                        attributes: ['username', 'nama_lengkap'],
                        duplicating: false
                    },
                    {
                        model: Users,
                        as: 'reported',
                        attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon'],
                        required: true,
                        duplicating: false
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
                                duplicating: false
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
                    },
                    {
                        model: Tracking,
                        as: 'tracking', 
                        attributes: ['id', 'tiket_id', 'status', 'deskripsi', 'createdAt'],
                        include: {
                            model: Users,
                            as: 'user',
                            attributes: ['username', 'nama_lengkap']
                        }
                    },
                    {
                        model: Komentar,
                        as: 'komentar',
                        attributes: ['tiket_id', 'user_id', 'komentar']
                    },
                    {
                        model: Rating,
                        as: 'rating',
                        attributes: ['rating', 'status']
                    },
                    {
                        model: Feedback,
                        as: 'feedback',
                        attributes: ['feedback', 'status']
                    }
                ],
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

async function GetByStatus (tiketData) {
    const { pegawai_id } = tiketData;
    log('[Tiket] GetByStatus', pegawai_id);
    try {
        let whereByPegawai;
        if (pegawai_id !== '') {
            const checkPegawai = await Pegawai.findOne({
                where: { id: pegawai_id },
                raw: true
            });
            if (!checkPegawai) throw { error: 'Pegawai tidak tersedia' };

            whereByPegawai = {
                handled_by: pegawai_id
            };
        }

        const where = {
            ...whereByPegawai
        }

        const tiketData = await Tiket.findAll({
            attributes: ['id', 'no_tiket', 'handled_by'],  
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { status: 1 },
                            { status: 3 },
                            { status: 4 },
                            { status: 5 },
                            { status: 6 }
                        ]
                    },
                    sequelize.literal(
                        `not exists (select * from "Reservasi" as r where "Tiket"."id" = "r"."tiket_id")`
                    ),
                    where
                ]
            },
            order: [['tanggal_proses', 'desc']],
            nest: true,
            raw: true
        });

        return tiketData;
    } catch (error) {
        return error;
    }
}

async function GetPerformance () {
    log('[Tiket] GetPerformance');
    try {
        let pegawai = [];
        const pegawaiData = await Pegawai.findAll({
            include: {
                model: Users,
                attributes: ['username', 'nama_lengkap', 'nip'],
                as: 'user',
                include: {
                    model: Gambar,
                    attributes: ['destination', 'filename'],
                    as: 'files'
                }
            },
            where: { 
                [Op.and]: [
                    { '$user.kewenangan_id$': 5 },
                    { '$user.enabled$': true },
                    { kategori_id: { [Op.ne]: 20 } }
                ]
            },
            order: [['createdAt', 'asc']],
            raw: true,
            nest: true
        });

        for (let data of pegawaiData) {
            const [totalRatingData, ratingData] = await Promise.all([
                Rating.count({
                    where: {
                        [Op.and]: [
                            { pegawai_id: data.id },
                            { status: true }
                        ]
                    }
                }),
                Rating.findAll({
                    attributes: [
                        [sequelize.fn('sum', sequelize.col('rating')), 'total_rating']
                    ],
                    where: {
                        [Op.and]: [
                            { pegawai_id: data.id },
                            { rating: { [Op.ne]: null } }
                        ]
                    },
                    raw: true
                })
            ]);

            const resultCount = toInteger(ratingData[0].total_rating) / toInteger(totalRatingData);
            pegawai.push({
                pegawai_id: data.id,
                username: data.user.username,
                nama_lengkap: data.user.nama_lengkap,
                destination_image: data.user.files.destination,
                filename_image: data.user.files.filename, 
                total_rating: !isNaN(resultCount) ? resultCount : 0
            });
        }
        
        return pegawai;
    } catch (error) {
        return error;
    }
}

async function GetByEmail () {
    log('[Tiket] GetByEmail');
    try {
        const tiketData = await Tiket.findAll({
            attributes: ['id', 'no_tiket'],
            where: { type: 'email' },
            raw: true
        });

        return tiketData;
    } catch (error) {
        return error;
    }
}

async function GetJob () {
    log('[Tiket] GetJob');
    try {
        const job = await Queue.getJobs(['active', 'completed']);
        log('job', job);

        return job;
    } catch (error) {
        return error;
    }
}

// Job queue
async function CreateTiket (job) {
    const {
        no_tiket,
        created_by,
        reported_by,
        nama_pelapor,
        kategori_id,
        judul,
        detail, 
        telepon,
        email,
        status,
        type,
        gambar_id = null,
        user,
        checkUser,
        user_id
    } = job.data;
    log('[Tiket][Queue] Create Tiket', job.data);
    try {
        if (type == 'email') {
            const operatorData = await Pegawai.findAll({
                where: {
                    [Op.and]: [
                        { '$user.kewenangan_id$': 5 },
                        { type: 'email' }
                    ]
                },
                include: {
                    model: Users,
                    attributes: [
                        'username', 
                        'nama_lengkap', 
                        'nip', 
                        'kewenangan_id'
                    ],
                    as: 'user'
                },
                order: [['order', 'asc']],
                raw: true,
                nest: true 
            });
    
            const created = await Tiket.create({
                no_tiket,
                created_by,
                reported_by,
                kategori_id,
                handled_by: operatorData[0].id,
                nama_pelapor,
                judul,
                detail, 
                telepon,
                email,
                status,
                type,
                gambar_id
            });
    
            await Tracking.create({
                tiket_id: created.id,
                user_id: user_id ? user_id : checkUser.id,
                status: 'Tiket dibuat'
            });
            
            await Feedback.create({
                tiket_id: created.id,
                reported_by: user_id ? user_id : checkUser.id,
                feedback: null
            });
    
            await Rating.create({
                tiket_id: created.id,
                reported_by: user_id ? user_id : checkUser.id,
                pegawai_id: operatorData[0].id,
                status: false,
                rating: null
            });
    
            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Open) tiket dengan judul ${judul}.`,
                user_id: user.id ? user.id : checkUser.id
            });
    
            const checkPegawai = await Pegawai.findOne({
                where: { id: created.handled_by },
                include: {
                    model: Users,
                    attributes: ['nama_lengkap'],
                    as: 'user'
                },
                raw: true, 
                nest: true
            });
    
            const newNotif = await Notifikasi.create({
                tiket_id: created.id,
                user_id: checkUser.id,
                pegawai_id: created.handled_by,
                title: 'Menunggu persetujuan tiket!',
                detail: `
                    Tiket baru dengan nomor tiket ${created.no_tiket} diberikan kepada operator ${checkPegawai.user.nama_lengkap}
                    & menunggu persetujuan
                `
            });
            socket.emit('open-tiket', { 
                data: newNotif, 
                user_id: checkUser.id,
                pegawai_id: created.handled_by
            });
    
            return Promise.resolve(created);
        } else {
            let created;
            if (kategori_id == 1) {
                const checkPegawai = await Pegawai.findOne({
                    include: {
                        model: Users,
                        as: 'user'
                    },
                    where: {
                        [Op.and]: [
                            { kategori_id: 1 },
                            { '$user.kewenangan_id$': 5 },
                            { '$user.enabled$': true }
                        ]
                    },
                    raw: true
                });

                created = await Tiket.create({
                    no_tiket,
                    created_by,
                    reported_by,
                    kategori_id,
                    handled_by: checkPegawai.id,
                    nama_pelapor,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status,
                    type,
                    gambar_id
                });
            } else if (kategori_id == 2) {
                const checkPegawai = await Pegawai.findOne({
                    include: {
                        model: Users,
                        as: 'user'
                    },
                    where: {
                        [Op.and]: [
                            { kategori_id: 2 },
                            { '$user.kewenangan_id$': 5 },
                            { '$user.enabled$': true }
                        ]
                    },
                    raw: true
                });

                created = await Tiket.create({
                    no_tiket,
                    created_by,
                    reported_by,
                    kategori_id,
                    handled_by: checkPegawai.id,
                    nama_pelapor,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status,
                    type,
                    gambar_id
                });
            } else if (kategori_id == 3) {
                const checkPegawai = await Pegawai.findOne({
                    include: {
                        model: Users,
                        as: 'user'
                    },
                    where: {
                        [Op.and]: [
                            { kategori_id: 3 },
                            { '$user.kewenangan_id$': 5 },
                            { '$user.enabled$': true }
                        ]
                    },
                    raw: true
                });

                created = await Tiket.create({
                    no_tiket,
                    created_by,
                    reported_by,
                    kategori_id,
                    handled_by: checkPegawai.id,
                    nama_pelapor,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status,
                    type,
                    gambar_id
                });
            } else if (kategori_id == 4) {
                const checkPegawai = await Pegawai.findOne({
                    include: {
                        model: Users,
                        as: 'user'
                    },
                    where: {
                        [Op.and]: [
                            { kategori_id: 4 },
                            { '$user.kewenangan_id$': 5 },
                            { '$user.enabled$': true }
                        ]
                    },
                    raw: true
                });

                created = await Tiket.create({
                    no_tiket,
                    created_by,
                    reported_by,
                    kategori_id,
                    handled_by: checkPegawai.id,
                    nama_pelapor,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status,
                    type,
                    gambar_id
                });
            } else if (kategori_id == 5) {
                const checkPegawai = await Pegawai.findOne({
                    include: {
                        model: Users,
                        as: 'user'
                    },
                    where: {
                        [Op.and]: [
                            { kategori_id: 5 },
                            { '$user.kewenangan_id$': 5 },
                            { '$user.enabled$': true }
                        ]
                    },
                    raw: true
                });

                created = await Tiket.create({
                    no_tiket,
                    created_by,
                    reported_by,
                    kategori_id,
                    handled_by: checkPegawai.id,
                    nama_pelapor,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status,
                    type,
                    gambar_id
                });
            } else if (kategori_id == 6) {
                const checkPegawai = await Pegawai.findOne({
                    include: {
                        model: Users,
                        as: 'user'
                    },
                    where: {
                        [Op.and]: [
                            { kategori_id: 6 },
                            { '$user.kewenangan_id$': 5 },
                            { '$user.enabled$': true }
                        ]
                    },
                    raw: true
                });

                created = await Tiket.create({
                    no_tiket,
                    created_by,
                    reported_by,
                    kategori_id,
                    handled_by: checkPegawai.id,
                    nama_pelapor,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status,
                    type,
                    gambar_id
                });
            } else if (kategori_id == 7) {
                const checkPegawai = await Pegawai.findOne({
                    include: {
                        model: Users,
                        as: 'user'
                    },
                    where: {
                        [Op.and]: [
                            { kategori_id: 7 },
                            { '$user.kewenangan_id$': 5 },
                            { '$user.enabled$': true }
                        ]
                    },
                    raw: true
                });

                created = await Tiket.create({
                    no_tiket,
                    created_by,
                    reported_by,
                    kategori_id,
                    handled_by: checkPegawai.id,
                    nama_pelapor,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status,
                    type,
                    gambar_id
                });
            } else if (kategori_id == 8) {
                const checkPegawai = await Pegawai.findOne({
                    include: {
                        model: Users,
                        as: 'user'
                    },
                    where: {
                        [Op.and]: [
                            { kategori_id: 8 },
                            { '$user.kewenangan_id$': 5 },
                            { '$user.enabled$': true }
                        ]
                    },
                    raw: true
                });

                created = await Tiket.create({
                    no_tiket,
                    created_by,
                    reported_by,
                    kategori_id,
                    handled_by: checkPegawai.id,
                    nama_pelapor,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status,
                    type,
                    gambar_id
                });
            } else if (kategori_id == 9) {
                const checkPegawai = await Pegawai.findOne({
                    include: {
                        model: Users,
                        as: 'user'
                    },
                    where: {
                        [Op.and]: [
                            { kategori_id: 9 },
                            { '$user.kewenangan_id$': 5 },
                            { '$user.enabled$': true }
                        ]
                    },
                    raw: true
                });

                created = await Tiket.create({
                    no_tiket,
                    created_by,
                    reported_by,
                    kategori_id,
                    handled_by: checkPegawai.id,
                    nama_pelapor,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status,
                    type,
                    gambar_id
                });
            } else if (kategori_id == 10) {
                const checkPegawai = await Pegawai.findOne({
                    include: {
                        model: Users,
                        as: 'user'
                    },
                    where: {
                        [Op.and]: [
                            { kategori_id: 10 },
                            { '$user.kewenangan_id$': 5 },
                            { '$user.enabled$': true }
                        ]
                    },
                    raw: true
                });

                created = await Tiket.create({
                    no_tiket,
                    created_by,
                    reported_by,
                    kategori_id,
                    handled_by: checkPegawai.id,
                    nama_pelapor,
                    judul,
                    detail, 
                    telepon,
                    email,
                    status,
                    type,
                    gambar_id
                });
            } else {
                throw { error: 'Kategori tidak tersedia.' };
            }

            await Tracking.create({
                tiket_id: created.id,
                user_id: user_id ? user_id : checkUser.id,
                status: 'Tiket dibuat'
            });
            
            await Feedback.create({
                tiket_id: created.id,
                reported_by: user_id ? user_id : checkUser.id,
                feedback: null
            });
    
            await Rating.create({
                tiket_id: created.id,
                reported_by: user_id ? user_id : checkUser.id,
                pegawai_id: created.handled_by,
                status: false,
                rating: null
            });
    
            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Open) tiket dengan judul ${judul}.`,
                user_id: user.id ? user.id : checkUser.id
            });
    
            const checkPegawai = await Pegawai.findOne({
                where: { id: created.handled_by },
                include: {
                    model: Users,
                    attributes: ['nama_lengkap'],
                    as: 'user'
                },
                raw: true, 
                nest: true
            });
    
            const newNotif = await Notifikasi.create({
                tiket_id: created.id,
                user_id: checkUser.id,
                pegawai_id: created.handled_by,
                title: 'Menunggu persetujuan tiket!',
                detail: `
                    Tiket baru dengan nomor tiket ${created.no_tiket} diberikan kepada operator ${checkPegawai.user.nama_lengkap}
                    & menunggu persetujuan
                `
            });
            socket.emit('open-tiket', { 
                data: newNotif, 
                user_id: checkUser.id,
                pegawai_id: created.handled_by
            });

            return Promise.resolve(created);
        }
    } catch (error) {
        return Promise.reject(error);
    }
}

async function ClosedTiketJob (job) {
    const {
        tiket_id,
        reported_by,
        handled_by
    } = job.data;
    log('[Tiket][Queue] Closed Tiket Job', job.data);
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiket_id },
            raw: true
        });

        const checkUser = await Users.findOne({
            where: { id: reported_by },
            raw: true
        });

        const checkPegawai = await Pegawai.findOne({
            where: { id: handled_by },
            raw: true
        });

        const checkUserPegawai = await Users.findOne({
            where: { id: checkPegawai.user_id },
            raw: true
        });  

        const checkKewenangan = await Kewenangan.findOne({
            where: { id: checkUserPegawai.kewenangan_id },
            raw: true
        });

        await Promise.all([
            Tiket.update({
                status: 7
            },
            { where: { id: tiket_id } }
            ),
            Rating.update({ 
                rating: 5,
                status: true
            },
            { where: { tiket_id } }),
            Feedback.update({
                feedback: 1,
                status: true
            },
            { where: { tiket_id } }),
            Tracking.create({
                tiket_id,
                user_id: reported_by,
                status: `Memberikan feedback positif`
            }),
            Tracking.create({
                tiket_id,
                user_id: reported_by,
                status: `Memberikan rating sangat baik`
            }),
            Tracking.create({
                tiket_id,
                user_id: reported_by,
                status: `Tiket closed`
            }),
            Logs.create({
                ip_address: '-',
                browser: '-',
                browser_version: '-',
                os: '-',
                logdetail: `(Closed) Tiket ditutup otomatis oleh sistem.`,
                user_id: null
            })
        ]);

        const [notifClosed, notifRating] = await Promise.all([
            Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by,
                title: 'Tiket closed!',
                detail: `
                    Tiket dengan nomor ${checkTiket.no_tiket} 
                    telah ditutup otomatis oleh sistem.`
            }),
            Notifikasi.create({
                tiket_id: checkTiket.id,
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by,
                title: 'Rating',
                detail: `
                    ${checkUser.username} memberikan rating ${5} 
                    kepada ${checkKewenangan.kewenangan} ${checkUserPegawai.nama_lengkap}`
            })
        ]);

        socket.emit(
            'close-tiket',
            { 
                data: notifClosed, 
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by
            }
        );
        socket.emit(
            'rating', 
            { 
                data: notifRating, 
                user_id: checkTiket.reported_by,
                pegawai_id: checkTiket.handled_by
            }
        );

        return Promise.resolve(true);
    } catch (error) {
        return Promise.reject(error);
    }
}

function GenerateQR (qrData) {
    log('[Tiket] GenerateQR', qrData);
    try {
        const options = {
            errorCorrectionLevel: 'H',
            type: 'image/jpeg',
            width: '300',
            quality: 0.3,
            margin: 1
        }

        let generateQR;
        (qrData[0].created_tiket == true) 
            ? generateQR = qr.toDataURL(qrData[0].no_tiket, options) 
            : generateQR = qr.toDataURL(JSON.stringify(qrData[0]), options);

        return generateQR;
    } catch (error) {
        return error;
    }
}

async function SendMail (mailData) {
    log('[Tiket] SendMail', mailData);
    try {
        const transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: true,
            // service: config.smtp.service,
            auth: {
                user: config.smtp.user,
                pass: config.smtp.password
            }
        });

        const base64Image = mailData.qrCode.split(';base64').pop();
        fs.writeFileSync(`./uploads/images/${mailData.no_tiket}.jpg`, base64Image, { encoding: 'base64' });
    
        const uploadQr = {
            filename: `${mailData.no_tiket}.jpg`
        }
        await Upload(uploadQr);
        
        const mailConfig = await Email_config.findAll({ raw: true });
        log('mailConfig', mailConfig);

        const template = require('../config/email/template').Notification(mailData);
        const mailOptions = {
            from: config.smtp.user,
            to: mailData.email,
            subject: "Tiket Berhasil",
            html: template.html
        } 
        const mail = await transporter.sendMail(mailOptions);

        return mail;
    } catch (error) {
        return error;
    }
}

module.exports = {
    Create,
    Update,
    ApprovedIn,
    Approved,
    Assign,
    Solved,
    Closed,
    Pending,
    ForwardTo,
    GetById,
    GetByTiket,
    GetByTiketQr,
    GetByUser,
    GetDatatables,
    GetDatatablesNotOpen,
    GetByEmployee,
    GetByStatus,
    GetPerformance,
    GetByEmail,
    GetJob
}