const debug = require('debug');
const log = debug('tiket-service:services:queue:')

const Queue = require('bull');

const { 
    Users, 
    Pegawai, 
    Temporary,
    Tiket,
    Tracking,
    Logs,
    Feedback,
    Rating,
    Email_config,
    Notifikasi,
    sequelize
} = require('../models');
const { Op } = require('sequelize');
const { QueryTypes } = require('sequelize');

const moment = require('moment');
const { isEmpty } = require('lodash');
const nodemailer = require('nodemailer');
const fs = require('fs');

const { Upload } = require('../helpers/upload');
// const { delay } = require('bullmq');

let createTiket = job => {
    new Promise(async (resolve, reject) => {
        const {
            no_tiket,
            created_by,
            reported_by,
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
        log('[Tiket] Queue Create Tiket', job);
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
            // const operatorData = await Pegawai.findAll({
            //     where: { '$user.kewenangan_id$': 5 },
            //     include: {
            //         model: Users,
            //         attributes: [
            //             'username', 
            //             'nama_lengkap', 
            //             'nip', 
            //             'kewenangan_id'
            //         ],
            //         as: 'user'
            //     },
            //     order: [['order', 'asc']],
            //     raw: true,
            //     nest: true 
            // });

            // let created;
            // let checkTmp;            
            // for (let i = 0; i < operatorData.length; i++) {
            //     const pegawai_id = operatorData[i].id;

            //     checkTmp = await Temporary.findAll({
            //         attributes: ['pegawai_id','total'],
            //         where: {
            //             createdAt: { [Op.gte]: moment().startOf('days') },
            //             createdAt: { [Op.lte]: moment().endOf('days') }
            //         },
            //         group: ['pegawai_id', 'total'],
            //         raw: true
            //     });

            //     if (isEmpty(checkTmp)) {
            //         await Temporary.create({
            //             pegawai_id,
            //             assign: true,
            //             total: 1
            //         });

            //         created = await Tiket.create({
            //             no_tiket,
            //             created_by,
            //             reported_by,
            //             kategori_id,
            //             handled_by: pegawai_id,
            //             judul,
            //             detail, 
            //             telepon,
            //             email,
            //             status,
            //             type,
            //             gambar_id
            //         });

            //         await Promise.all([
            //             sequelize.query(`UPDATE "public"."Pegawai" SET next = null`, { type: QueryTypes.UPDATE }),
            //             Pegawai.update({
            //                 next: true 
            //             },
            //             { where: { id: pegawai_id } }
            //             )
            //         ]);

            //         await Tracking.create({
            //             tiket_id: created.id,
            //             user_id: user_id ? user_id : checkUser.id,
            //             status: 'Tiket dibuat'
            //         });
                    
            //         await Feedback.create({
            //             tiket_id: created.id,
            //             reported_by: user_id ? user_id : checkUser.id,
            //             feedback: null
            //         });

            //         await Rating.create({
            //             tiket_id: created.id,
            //             reported_by: user_id ? user_id : checkUser.id,
            //             pegawai_id,
            //             status: false,
            //             rating: null
            //         });

            //         await Logs.create({
            //             ip_address: user.ip_address,
            //             browser: user.browser,
            //             browser_version: user.browser_version,
            //             os: user.os,
            //             logdetail: `(Open) tiket dengan judul ${judul}.`,
            //             user_id: user.id ? user.id : checkUser.id
            //         });
    
            //         const checkPegawai = await Pegawai.findOne({
            //             where: { id: created.handled_by },
            //             include: {
            //                 model: Users,
            //                 attributes: ['nama_lengkap'],
            //                 as: 'user'
            //             },
            //             raw: true, 
            //             nest: true
            //         });
    
            //         const newNotif = await Notifikasi.create({
            //             tiket_id: created.id,
            //             user_id: checkUser.id,
            //             pegawai_id: created.handled_by,
            //             title: 'Menunggu persetujuan tiket!',
            //             detail: `
            //                 Tiket baru dengan nomor tiket ${created.no_tiket} diberikan kepada operator ${checkPegawai.user.nama_lengkap}
            //                 & menunggu persetujuan
            //             `
            //         });
            //         socket.emit('open-tiket', { 
            //             data: newNotif, 
            //             user_id: checkUser.id,
            //             pegawai_id: created.handled_by
            //         });

            //         return true;
            //     } else {
            //         const checkPegawaiTrue = await Pegawai.findAll({
            //             attributes: ['id', 'order'],
            //             where: {
            //                 [Op.and]: [
            //                     { next: true },
            //                     { '$user.kewenangan_id$': 5 }
            //                 ] 
            //             },
            //             include: {
            //                 model: Users,
            //                 attributes: ['kewenangan_id'],
            //                 as: 'user'
            //             },
            //             raw: true
            //         });

            //         if (!isEmpty(checkPegawaiTrue)) {
            //             var pegawaiCheck = await Pegawai.findAll({
            //                 attributes: ['id', 'order'],
            //                 where: { 
            //                     [Op.and]: [
            //                         // { next: { [Op.ne]: true } },
            //                         { order: { [Op.gt]: checkPegawaiTrue[0].order } },
            //                         { '$user.kewenangan_id$': 5 }
            //                     ]
            //                 },
            //                 include: {
            //                     model: Users,
            //                     attributes: ['kewenangan_id'],
            //                     as: 'user'
            //                 },
            //                 order: [['order', 'asc']],
            //                 raw: true
            //             });
            //         }
                    
            //         if (!isEmpty(pegawaiCheck)) {
            //             await Temporary.create({
            //                 pegawai_id: pegawaiCheck[0].id,
            //                 assign: true,
            //                 total: 1
            //             });
    
            //             created = await Tiket.create({
            //                 no_tiket,
            //                 created_by,
            //                 reported_by,
            //                 kategori_id,
            //                 handled_by: pegawaiCheck[0].id,
            //                 judul,
            //                 detail, 
            //                 telepon,
            //                 email,
            //                 status,
            //                 type,
            //                 gambar_id
            //             });
    
            //             await Promise.all([
            //                 sequelize.query(`UPDATE "public"."Pegawai" SET next = null`, { type: QueryTypes.UPDATE }),
            //                 Pegawai.update({
            //                     next: true 
            //                 },
            //                 { where: { id: pegawaiCheck[0].id } }
            //                 )
            //             ]);
    
            //             await Tracking.create({
            //                 tiket_id: created.id,
            //                 user_id: user_id ? user_id : checkUser.id,
            //                 status: 'Tiket dibuat'
            //             });
                        
            //             await Feedback.create({
            //                 tiket_id: created.id,
            //                 reported_by: user_id ? user_id : checkUser.id,
            //                 feedback: null
            //             });
    
            //             await Rating.create({
            //                 tiket_id: created.id,
            //                 reported_by: user_id ? user_id : checkUser.id,
            //                 pegawai_id: pegawaiCheck[0].id,
            //                 status: false,
            //                 rating: null
            //             });
            //         } else {
            //             const pegawaiFalse = await Pegawai.findAll({
            //                 attributes: ['id'],
            //                 where: { '$user.kewenangan_id$': 5 },
            //                 include: {
            //                     model: Users,
            //                     attributes: ['kewenangan_id'],
            //                     as: 'user'
            //                 },
            //                 order: [['order', 'asc']],
            //                 raw: true
            //             });
    
            //             await Temporary.create({
            //                 pegawai_id: pegawaiFalse[0].id,
            //                 assign: true,
            //                 total: 1
            //             });
    
            //             created = await Tiket.create({
            //                 no_tiket,
            //                 created_by,
            //                 reported_by,
            //                 kategori_id,
            //                 handled_by: pegawaiFalse[0].id,
            //                 judul,
            //                 detail, 
            //                 telepon,
            //                 email,
            //                 status,
            //                 type,
            //                 gambar_id
            //             });
    
            //             await Promise.all([
            //                 sequelize.query(`UPDATE "public"."Pegawai" SET next = null`, { type: QueryTypes.UPDATE }),
            //                 Pegawai.update({
            //                     next: true 
            //                 },
            //                 { where: { id: pegawaiFalse[0].id } }
            //                 )
            //             ]);
    
            //             await Tracking.create({
            //                 tiket_id: created.id,
            //                 user_id: user_id ? user_id : checkUser.id,
            //                 status: 'Tiket dibuat'
            //             });
                        
            //             await Feedback.create({
            //                 tiket_id: created.id,
            //                 reported_by: user_id ? user_id : checkUser.id,
            //                 feedback: null
            //             });
    
            //             await Rating.create({
            //                 tiket_id: created.id,
            //                 reported_by: user_id ? user_id : checkUser.id,
            //                 pegawai_id: pegawaiFalse[0].id,
            //                 status: false,
            //                 rating: null
            //             });
            //         }

            //         await Logs.create({
            //             ip_address: user.ip_address,
            //             browser: user.browser,
            //             browser_version: user.browser_version,
            //             os: user.os,
            //             logdetail: `(Open) tiket dengan judul ${judul}.`,
            //             user_id: user.id ? user.id : checkUser.id
            //         });
    
            //         const checkPegawai = await Pegawai.findOne({
            //             where: { id: created.handled_by },
            //             include: {
            //                 model: Users,
            //                 attributes: ['nama_lengkap'],
            //                 as: 'user'
            //             },
            //             raw: true, 
            //             nest: true
            //         });
    
            //         const newNotif = await Notifikasi.create({
            //             tiket_id: created.id,
            //             user_id: checkUser.id,
            //             pegawai_id: created.handled_by,
            //             title: 'Menunggu persetujuan tiket!',
            //             detail: `
            //                 Tiket baru dengan nomor tiket ${created.no_tiket} diberikan kepada operator ${checkPegawai.user.nama_lengkap}
            //                 & menunggu persetujuan
            //             `
            //         });
            //         socket.emit('open-tiket', { 
            //             data: newNotif, 
            //             user_id: checkUser.id,
            //             pegawai_id: created.handled_by
            //         });

            //         return true;
            //     }
            // }
        } catch (error) {
            reject(error);
        }
    });
}

let sendMail = job => 
    new Promise(async(resolve, reject) => {
        const {
            nama_lengkap,
            no_tiket,
            detail,
            tanggal_tiket,
            email,
            qrCode
        } = job.data;
        log('[Tiket] Queue Send Mail Tiket', job);
        try {
            const transporter = nodemailer.createTransport({
                host: config.smtp.host,
                port: config.smtp.port,
                secure: true,
                // service: config.smtp.service,
                auth: {
                    user: config.smtp.user,
                    pass: config.smtp.password
                },
                tls: {
                    ciphers: "SSLv3"
                }
            });

            const base64Image = qrCode.split(';base64').pop();
            fs.writeFileSync(`./uploads/images/${moment(tanggal_tiket).format('YYYY-MM-DD,HH:mm:ss')}.jpg`, base64Image, { encoding: 'base64' });
        
            const uploadQr = {
                filename: `${moment(tanggal_tiket).format('YYYY-MM-DD,HH:mm:ss')}.jpg`
            };
            await Upload(uploadQr);
            
            const mailConfig = await Email_config.findAll({ raw: true });
    
            const template = require('../config/email/template').Notification(job.data, uploadQr, mailConfig[0].template, mailConfig[0].template_footer);
            const mailOptions = {
                from: config.smtp.user,
                to: email,
                subject: "Tiket Berhasil",
                html: template.html
            } 
            const mail = await transporter.sendMail(mailOptions);
    
            resolve(mail);
        } catch (error) {
            log('Error', error);
            reject(error);
        }
    });

module.exports = ({
    name = 'default',
    options = {
        redis: {
            port: 6379,
            host: '127.0.0.1'
        },
        attempts: 3, // 3 try
        timeout: 60 * 1000 // 60 sec,
    }
}) => {
    try {
        const queue = new Queue(name, options);
        log('Queue:', name);

        queue.process('create-tiket', 1, createTiket);
        queue.process('send-mail', 1, sendMail);

        queue.on('progress', (job, progress) => {
            log(`Job with id ${job.id} has been updated.`, progress);
        });

        queue.on('completed', (job, result) => {
            log(`Job with id ${job.id} has been completed.`, result);
            job.remove();
        });

        queue.on('removed', (job) => {
            log(`Job with id ${job.id} has been removed.`);
        });    

        return queue;
    } catch (error) {
        throw error;
    }
}