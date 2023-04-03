const debug = require('debug');
const log = debug('tiket-service:services:');

const moment = require('moment');
const { 
    toUpper, 
    forEach, 
    toInteger, 
    isEmpty,
    sortBy 
} = require('lodash')

const {
    Tiket,
    Users,
    Pegawai,
    Rating,
    Feedback,
    Satker,
    Gambar,
    Kewenangan,
    Kategori,
    Level,
    Tracking,
    Komentar,
    Teknisi,
    sequelize
} = require('../models');
const { Op } = require('sequelize');
const sequelizeV2 = require('sequelize');
const { QueryTypes } = require('sequelize');

async function GetNotif(notifData) {
    const { pegawai_id, user_id } = notifData;
    log('[Report] GetNotif', notifData);
    try {
        let whereByUser;
        if (user_id !== '') {
            whereByUser = {
                reported_by: user_id
            };

            const checkUser = await Users.findOne({
                where: { id: user_id },
                raw: true
            });
            if (!checkUser) throw { error: 'User tidak tersedia.' };
        }

        let whereByPegawai;
        if (pegawai_id !== '') {
            whereByPegawai = {
                handled_by: pegawai_id
            };

            const checkPegawai = await Pegawai.findOne({
                where: { id: pegawai_id },
                raw: true
            });
            if (!checkPegawai) throw { error: 'Pegawai tidak tersedia.' };
        }

        const where = {
            ...whereByUser,
            ...whereByPegawai
        };

        const [
            notifOpen,
            notifApprove,
            notifAssignToAdmin,
            notifAssignToOperator,
            // notifAssignToStaff,
            notifAssignToTeknisi,
            notifSolved,
            notifClosed
        ] = await Promise.all([
            Tiket.count({
                where: { 
                    [Op.and]: [
                        { status: 0 }, // open tiket
                        where
                    ]
                } 
            }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        { status: 1 }, 
                        where
                    ]
                } // approve by operator
            }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        { status: 2 }, 
                        where
                    ]
                } // assign to admin
            }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        { status: 3 }, 
                        where
                    ]
                } // assign to operator
            }),
            // Tiket.count({
            //     where: { 
            //         [Op.and]: [
            //             { status: 4 }, 
            //             where
            //         ]
            //     } // assign to staff ahli
            // }),
            Tiket.count({
                where: {
                    [Op.and]: [
                        { status: 5 },
                        where
                    ]
                } // assign to teknisi
            }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        { status: 6 }, 
                        where
                    ]
                } // solved
            }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        { status: 7 },
                        where
                    ]
                } // closed
            })
        ]);

        return {
            notifOpen,
            notifApprove,
            notifAssignToAdmin,
            notifAssignToOperator,
            // notifAssignToStaff,
            notifAssignToTeknisi,
            notifSolved,
            notifClosed
        }
    } catch (error) {
        return error;
    }
}

async function GetDashboard() {
    log('[Report] GetDashboard');
    try {
        let totalKategori = []
        const kategoriData = await Kategori.findAll({
            where: { id: { [Op.ne]: 20 } },
            attributes: ['id', 'kategori'],
            raw: true
        });
        let total;
        for (let kategori of kategoriData) {
            total = await Tiket.count({
                where: { 
                    [Op.and]: [
                        {
                            [Op.and]: [
                                { status: { [Op.ne]: 0 } },
                                { status: { [Op.ne]: 2 } }
                            ]
                        },
                        { kategori_id: kategori.id },
                        {
                            createdAt: {
                                [Op.gte]: moment()
                                    .startOf('year')
                                    .format()
                            }
                        },
                        { createdAt: { 
                                [Op.lte]: moment()
                                    .endOf('year')
                                    .format() 
                            } 
                        }
                    ]
                }
            })
            totalKategori.push({ 
                kategori: kategori.kategori,
                total
            });
        }

        const [
            totalUsers,
            totalAdmin,
            totalSuperadmin,
            totalSuperoperator,
            totalPegawai,
            totalTeknisi,
            totalOperator,
            // totalStaff,
            jumlahTiket,
            jumlahTiketSolved,
            jumlahTiketClosed,
            jumlahTiketReject,
            jumlahTiketProsesByAdmin,
            // jumlahTiketProsesByStaff,
            jumlahTiketProsesByTeknisi,
            jumlahTiketProsesByOperator,
            jumlahFeedback,
            jumlahFeedbackPositif,
            jumlahFeedbackNegatif,
        ] = await Promise.all([
            Users.count({
                where: { 
                    kewenangan_id: 6,
                    enabled: true 
                }
            }),
            Users.count({
                where: { 
                    kewenangan_id: 3,
                    enabled: true 
                }
            }),
            Users.count({
                where: { 
                    kewenangan_id: 1,
                    enabled: true 
                }
            }),
            Users.count({
                where: { 
                    kewenangan_id: 2,
                    enabled: true 
                }
            }),
            Pegawai.count({}),
            Teknisi.count({}),
            Users.count({
                where: { 
                    kewenangan_id: 5,
                    enabled: true 
                }
            }),
            // Users.count({
            //     where: { kewenangan_id: 3 }
            // }),
            Tiket.count({}),
            Tiket.count({
                where: { status: 6 }
            }),
            Tiket.count({
                where: { status: 7 }
            }),
            Tiket.count({
                where: { status: 2 }
            }),
            Tiket.count({
                where: { status: 3 }
            }),
            // Tiket.count({
            //     where: { status: 4 }
            // }),
            Tiket.count({
                where: { status: 5 }
            }),
            Tiket.count({
                where: { status: 1 }
            }),
            Feedback.count({}),
            Feedback.count({
                where: { feedback: 1 }
            }),
            Feedback.count({
                where: { feedback: 0 }
            }),
        ]);
        
        const tiketClosed = Math.ceil(jumlahTiketClosed / jumlahTiket * 100);
        const tiketSolved = Math.ceil(jumlahTiketSolved / jumlahTiket * 100);
        const tiketRejected = Math.ceil(jumlahTiketReject / jumlahTiket * 100);
        const tiketProsesByAdmin = Math.ceil(jumlahTiketProsesByAdmin / jumlahTiket * 100);
        // const tiketProsesByStaff = Math.ceil(jumlahTiketProsesByStaff / jumlahTiket * 100);
        const tiketProsesByTeknisi = Math.ceil(jumlahTiketProsesByTeknisi / jumlahTiket * 100);
        const tiketProsesByOperator = Math.ceil(jumlahTiketProsesByOperator / jumlahTiket * 100);

        const feedbackPositif = Math.ceil(jumlahFeedbackPositif / jumlahFeedback * 100);
        const feedbackNegetif = Math.ceil(jumlahFeedbackNegatif / jumlahFeedback * 100);

        return {
            totalKategori,
            totalUsers,
            totalAdmin,
            totalSuperadmin,
            totalSuperoperator,
            totalPegawai,
            totalTeknisi,
            totalOperator,
            // totalStaff,
            totalTiket: jumlahTiket,
            tiketSolved: !isNaN(tiketSolved) ? tiketSolved : 0,
            tiketClosed: !isNaN(tiketClosed) ? tiketClosed : 0,
            tiketProsesByOperator: !isNaN(tiketProsesByOperator) ? tiketProsesByOperator : 0,
            tiketRejected: !isNaN(tiketRejected) ? tiketRejected : 0,
            tiketProsesByAdmin: !isNaN(tiketProsesByAdmin) ? tiketProsesByAdmin : 0,
            // tiketProsesByStaff: !isNaN(tiketProsesByStaff) ? tiketProsesByStaff : 0,
            tiketProsesByTeknisi: !isNaN(tiketProsesByTeknisi) ? tiketProsesByTeknisi : 0,
            feedbackPositif: !isNaN(feedbackPositif) ? feedbackPositif : 0,
            feedbackNegetif: !isNaN(feedbackNegetif) ? feedbackNegetif : 0
        };
    } catch (error) {
        return error;
    }
}

async function GetHistoryData(historyData) {
    const {
        start_date = moment().startOf('day').format(),
        end_date = moment().endOf('day').format(),
        status,
        pegawai_id,
        kategori_id,
        type
    } = historyData;
    log('[Report] GetHistoryData', historyData);
    try {
        let whereByStatus;
        if (status !== '') {
            whereByStatus = {
                status
            };
        };

        let whereByPegawai;
        if (pegawai_id !== '') {
            whereByPegawai = {
                handled_by: pegawai_id
            }
        }

        let whereByDate;
        if (start_date !== '' || end_date !== '') {
            whereByDate = {
                [Op.and]: [
                    { createdAt: { [Op.gte]: moment(start_date).format() } },
                    { createdAt: { [Op.lte]: moment(end_date).format() } }
                ]
            };
        };

        let whereByKategori;
        if (kategori_id !== '') {
            whereByKategori = {
                kategori_id
            }
        }


        let whereByType;
        if (type !== '') {
            whereByType = {
                type
            };
        }

        const where = {
            ...whereByPegawai,
            ...whereByStatus,
            ...whereByDate,
            ...whereByKategori,
            ...whereByType
        };

        const historyData = await Tiket.findAll({
            attributes: [
                'id',
                'no_tiket',
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
                'alasan',
                'updatedAt'
            ],
            include: [
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
                            as: 'user'
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
                }
            ],
            where,
            order: [['createdAt', 'desc']],
            nest: true
        });

        return historyData;
    } catch (error) {
        return error;
    }
}

async function GetHistoryDataUser(historyData) {
    const {
        start_date = moment().startOf('day').format(),
        end_date = moment().endOf('day').format(),
        status,
        user_id,
    } = historyData;
    log('[Report] GetHistoryDataUser', historyData);
    try {
        let whereByStatus;
        if (status !== '') {
            whereByStatus = {
                status
            };
        };

        let whereByUser;
        if (user_id !== '') {
            whereByUser = {
                reported_by: user_id
            }
        }

        let whereByDate;
        if (start_date !== '' || end_date !== '') {
            whereByDate = {
                [Op.and]: [
                    { updatedAt: { [Op.gte]: moment(start_date).format() } },
                    { updatedAt: { [Op.lte]: moment(end_date).format() } }
                ]
            };
        };

        const where = {
            ...whereByUser,
            ...whereByStatus,
            ...whereByDate
        };

        const historyData = await Tiket.findAll({
            attributes: [
                'id',
                'no_tiket',
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
                'alasan',
                'updatedAt'
            ],
            include: [
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
                            as: 'user'
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
                }
            ],
            where,
            order: [['updatedAt', 'desc']],
            nest: true
        });

        return historyData;
    } catch (error) {
        return error;
    }
}

async function GetDashboardUser (reportData) {
    const { user_id, pegawai_id = ''} = reportData;
    log('[Report] GetDashboardUser', reportData);
    try {
        // if (!user_id) throw { error: 'User ID harus dilampirkan.' };

        let whereByUser;
        if (user_id !== '') {
            whereByUser = {
                reported_by: user_id
            };

            const checkUser = await Users.findOne({
                where: { id: user_id },
                raw: true
            });
            if (!checkUser) throw { error: 'User tidak tersedia.' };
        }

        let whereByPegawai;
        if (pegawai_id !== '') {
            whereByPegawai = {
                handled_by: pegawai_id
            };

            const checkPegawai = await Pegawai.findOne({
                where: { id: pegawai_id },
                raw: true
            });
            if (!checkPegawai) throw { error: 'Pegawai tidak tersedia.' };
        }

        const where = {
            ...whereByUser,
            ...whereByPegawai
        };

        let totalKategori = []
        const kategoriData = await Kategori.findAll({
            attributes: ['id', 'kategori'],
            raw: true
        });
        let total;
        for (let kategori of kategoriData) {
            total = await Tiket.count({
                where: { 
                    [Op.and]: [
                        { kategori_id: kategori.id },
                        where,
                        // {
                        //     createdAt: {
                        //         [Op.gte]: moment()
                        //             .subtract(days, 'd')
                        //             .startOf('day')
                        //             .format()
                        //     }
                        // },
                        // { createdAt: { [Op.lte]: moment().format() } }
                    ]
                }
            })
            totalKategori.push({ 
                kategori: kategori.kategori,
                total
            });
        }

        const [
            totalPegawai,
            totalUsers,
            totalAdmin,
            totalSuperadmin,
            totalSuperoperator,
            totalTeknisi,
            totalOperator,
            // totalStaff,
            jumlahTiket, 
            jumlahTiketOpen,
            jumlahTiketSelesai,
            jumlahTiketClosed, 
            jumlahTiketRejected,
            jumlahTiketProsesByAdmin,
            // jumlahTiketProsesByStaff,
            jumlahTiketProsesByTeknisi,
            jumlahTiketProsesByOperator,
            historyData
        ] = await Promise.all([
            Pegawai.count({}),
            Users.count({
                where: { 
                    kewenangan_id: 6,
                    enabled: true 
                }
            }),
            Users.count({
                where: { 
                    kewenangan_id: 3,
                    enabled: true 
                }
            }),
            Users.count({
                where: { 
                    kewenangan_id: 1,
                    enabled: true 
                }
            }),
            Users.count({
                where: { 
                    kewenangan_id: 2,
                    enabled: true 
                }
            }),
            Teknisi.count({}),
            Users.count({
                where: { 
                    kewenangan_id: 5,
                    enabled: true 
                }
            }),
            // Users.count({
            //     where: { kewenangan_id: 3 }
            // }),
            Tiket.count({ where }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        where,
                        { status: 0 }
                    ]
                }
            }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        where,
                        { status: 6 }
                    ]
                }
            }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        where,
                        { status: 7 }
                    ]
                }
            }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        where,
                        { status: 2 }
                    ]
                }
            }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        where,
                        { status: 3 }
                    ]
                }
            }),
            // Tiket.count({
            //     where: {
            //         [Op.and]: [
            //             where,
            //             { status: 4 }
            //         ]
            //     }
            // }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        where,
                        { status: 5 }
                    ]
                }
            }),
            Tiket.count({
                where: { 
                    [Op.and]: [
                        where,
                        { status: 1 }
                    ]
                }
            }),
            Tiket.findAll({
                attributes: [
                    'id',
                    'no_tiket',
                    'judul',
                    'detail',
                    'status',
                    ['createdAt', 'tanggal_tiket'],
                    'tanggal_proses',
                    'tanggal_selesai',
                ],
                include: {
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
                        }
                    ]
                },
                where: {
                    [Op.and]: [
                        {
                            [Op.or]: [
                                { status: 0 },
                                { status: 1 },
                                { status: 2 },
                                // { status: 4 },
                                { status: 5 },
                                { status: 6 },
                                { status: 7 }
                            ]
                        },
                        where
                    ]
                },
                order: [['createdAt', 'desc']],
                raw: true,
                nest: true
            })
        ]);

        return {
            totalPegawai,
            totalUsers,
            totalAdmin,
            totalSuperadmin,
            totalSuperoperator,
            totalTeknisi,
            totalOperator,
            // totalStaff,
            jumlahTiket,
            jumlahTiketOpen,
            jumlahTiketClosed,
            jumlahTiketSelesai,
            jumlahTiketRejected,
            jumlahTiketProsesByAdmin,
            // jumlahTiketProsesByStaff,
            jumlahTiketProsesByTeknisi,
            jumlahTiketProsesByOperator,
            historyData,
            totalKategori
        }
    } catch (error) {
        return error;
    }
}

async function GetMaxData () {
    log('[Report] GetMaxData');
    try {
        const total_data = await Tiket.findAll({
            attributes: [[sequelizeV2.fn('COUNT', '*'), 'total']],
            include: {
                model: Kategori,
                attributes: ['kategori'],
                as: 'kategori'
            },
            where: { 
                [Op.and]: [
                    {
                        [Op.and]: [
                            { status: { [Op.ne]: 0 } },
                            { status: { [Op.ne]: 2 } }
                        ]
                    },
                    {
                        createdAt: {
                            [Op.gte]: moment()
                                .startOf('year')
                                .format()
                        }
                    },
                    { 
                        createdAt: { 
                            [Op.lte]: moment()
                                .endOf('year')
                                .format() 
                        } 
                    }
                ]
            },
            group: ['kategori.kategori'],
            order: [[sequelizeV2.literal('total'), 'desc']],
            limit: 5,
            raw: true,
            nest: true
        });
        
        let total = [];
        for (let i of total_data) {
            total.push({
                total: toInteger(i.total),
                kategori: i.kategori.kategori
            });
        }

        return total;
    } catch (error) {
        return error;
    }
}

async function GetReportBySatker () {
    log('[Report] GetReportBySatker');
    try {
        const total_data = await Tiket.findAll({
            attributes: [[sequelizeV2.fn('COUNT', '*'), 'total']],
            include: {
                model: Users,
                attributes: ['satker_id'],
                as: 'reported',
                include: {
                    model: Satker,
                    attributes: ['id', 'nama_satker'],
                    as: 'satker'
                }
            },
            where: { 
                [Op.and]: [
                    {
                        [Op.and]: [
                            { status: { [Op.ne]: 0 } },
                            { status: { [Op.ne]: 2 } }
                        ]
                    },
                    {
                        createdAt: {
                            [Op.gte]: moment()
                                .startOf('year')
                                .format()
                        }
                    },
                    { 
                        createdAt: { 
                            [Op.lte]: moment()
                                .endOf('year')
                                .format() 
                        } 
                    }
                ]
            },
            group: ['reported.satker_id', 'reported.satker.id', 'reported.satker.nama_satker'],
            order: [[sequelizeV2.literal('total'), 'desc']],
            limit: 5,
            raw: true,
            nest: true
        });
        
        let total = [];
        for (let i of total_data) {
            total.push({
                total: toInteger(i.total),
                satker: i.reported.satker.nama_satker
            });
        }

        return total;
    } catch (error) {
        return error;
    }
}

async function GetStatistic (reportData) {
    const { 
        kategori_id,
        tahun
    } = reportData;
    log('[Report] GetStatistic', reportData);
    try {
        if (!kategori_id || !tahun) throw { error: 'Kategori dan tahun harus diisi.' };

        const checkKategori = await Kategori.findOne({
            where: { id: kategori_id },
            raw: true
        });
        if (!checkKategori) throw { error: 'Kategori tidak tersedia.' };

        const [
            dataGraph,
            totalTiket,
            timeDuration,
            totalRating,
            ratingData,
            totalFeedbackNegatif,
            totalFeedbackPositif,
            totalFeedback
        ] = await Promise.all([
                sequelize.query(`select Months.m AS month, count("Tiket"."createdAt") AS total from 
                    (
                        select 1 as m 
                        union select 2 as m 
                        union select 3 as m 
                        union select 4 as m 
                        union select 5 as m 
                        union select 6 as m 
                        union select 7 as m 
                        union select 8 as m 
                        union select 9 as m 
                        union select 10 as m 
                        union select 11 as m 
                        union select 12 as m
                    ) as Months
                    left join "Tiket" on Months.m = extract(month from "Tiket"."createdAt") 
                    and "Tiket"."createdAt" >= '${moment(tahun).startOf('year').format()}' 
                    and "Tiket"."createdAt" <= '${moment(tahun).endOf('year').format()}'
                    and "Tiket"."status" != 0 and "Tiket"."status" != 2
                    and "Tiket"."kategori_id" = ${kategori_id}
                    group by Months.m
                    order by Months.m asc`,
                    { type: QueryTypes.SELECT }
                ),
                Tiket.count({
                    where: { 
                        [Op.and]: [
                            {
                                [Op.and]: [
                                    { status: { [Op.ne]: 0 } },
                                    { status: { [Op.ne]: 2 } }
                                ]
                            },
                            { kategori_id },
                            {
                                createdAt: {
                                    [Op.gte]: moment(tahun)
                                        .startOf('year')
                                        .format()
                                }
                            },
                            { 
                                createdAt: { 
                                    [Op.lte]: moment(tahun)
                                        .endOf('year')
                                        .format() 
                                } 
                            }
                        ]
                    },
                    raw: true
                }),
                Tiket.findAll({
                    attributes: [
                        [sequelizeV2.fn('avg', sequelizeV2.col('durasi')), 'durasi']
                    ],
                    where: { 
                        [Op.and]: [
                            { 
                                status: 6,
                                status: 7 
                            },
                            { kategori_id },
                            {
                                createdAt: {
                                    [Op.gte]: moment(tahun)
                                        .startOf('year')
                                        .format()
                                }
                            },
                            { 
                                createdAt: { 
                                    [Op.lte]: moment(tahun)
                                        .endOf('year')
                                        .format() 
                                } 
                            }
                        ]
                    },
                    raw: true
                }),
                Rating.count({
                    where: { 
                        [Op.and]: [
                            { '$tiket.status$': 7 },
                            { '$tiket.kategori_id$': kategori_id },
                            {
                                createdAt: {
                                    [Op.gte]: moment(tahun)
                                        .startOf('year')
                                        .format()
                                }
                            },
                            { 
                                createdAt: { 
                                    [Op.lte]: moment(tahun)
                                        .endOf('year')
                                        .format() 
                                } 
                            },
                            { status: true }
                        ]
                    },
                    include: {
                        model: Tiket,
                        as: 'tiket'
                    },
                    raw: true
                }),
                Rating.findAll({
                    attributes: [
                        [sequelizeV2.fn('sum', sequelizeV2.col('rating')), 'total_rating']
                    ],
                    where: { 
                        [Op.and]: [
                            { '$tiket.status$': 7 },
                            { '$tiket.kategori_id$': kategori_id },
                            {
                                createdAt: {
                                    [Op.gte]: moment(tahun)
                                        .startOf('year')
                                        .format()
                                }
                            },
                            { 
                                createdAt: { 
                                    [Op.lte]: moment(tahun)
                                        .endOf('year')
                                        .format() 
                                } 
                            },
                            { rating: { [Op.ne]: null } }
                        ]
                    },
                    include: {
                        model: Tiket,
                        as: 'tiket'
                    },
                    group: ['tiket.id' ],
                    raw: true,
                    nest: true
                }),
                Feedback.count({
                    where: { 
                        [Op.and]: [
                            { '$tiket.status$': 7 },
                            { '$tiket.kategori_id$': kategori_id },
                            {
                                createdAt: {
                                    [Op.gte]: moment(tahun)
                                        .startOf('year')
                                        .format()
                                }
                            },
                            { 
                                createdAt: { 
                                    [Op.lte]: moment(tahun)
                                        .endOf('year')
                                        .format() 
                                } 
                            },
                            { feedback: 0 }
                        ]
                    },
                    include: {
                        model: Tiket,
                        as: 'tiket'
                    },
                    raw: true
                }),
                Feedback.count({
                    where: { 
                        [Op.and]: [
                            { '$tiket.status$': 7 },
                            { '$tiket.kategori_id$': kategori_id },
                            {
                                createdAt: {
                                    [Op.gte]: moment(tahun)
                                        .startOf('year')
                                        .format()
                                }
                            },
                            { 
                                createdAt: { 
                                    [Op.lte]: moment(tahun)
                                        .endOf('year')
                                        .format() 
                                } 
                            },
                            { feedback: 1 }
                        ]
                    },
                    include: {
                        model: Tiket,
                        as: 'tiket'
                    },
                    raw: true
                }),
                Feedback.count({
                    where: { 
                        '$tiket.status$': 7,
                        '$tiket.kategori_id$': kategori_id 
                    },
                    include: {
                        model: Tiket,
                        as: 'tiket'
                    },
                    raw: true
                })
        ]);

        let labels = [];
        let data = [];
        let datas = [];

        forEach(dataGraph, (i) => {
            datas.push({ 
                month: moment(`${i.month}`).locale('id').format('MMMM'),
                total: toInteger(i.total) 
            });
            labels.push(moment(`${i.month}`).locale('id').format('MMMM'));
            data.push(toInteger(i.total));
        });

        const maxTotal = sortBy(datas, ['total']);
        const maxData = maxTotal[maxTotal.length - 1];

        let resultCount;
        if (!isEmpty(ratingData)) {
            resultCount = toInteger(ratingData[0].total_rating) / toInteger(totalRating);
        }

        const feedbackNegatif = Math.ceil(totalFeedbackNegatif / totalFeedback * 100);
        const feedbackPositif = Math.ceil(totalFeedbackPositif / totalFeedback * 100);

        return { 
            grafik: { labels, data, maxData },
            totalTiket,
            totalDurasi: !isNaN(timeDuration[0].durasi) ? Math.ceil(timeDuration[0].durasi) : 0,
            totalRating: !isNaN(resultCount) ? Math.ceil(resultCount) : 0,
            feedbackNegatif: !isNaN(feedbackNegatif) ? feedbackNegatif : 0,
            feedbackPositif: !isNaN(feedbackPositif) ? feedbackPositif : 0
        };
    } catch (error) {
        return error;
    }
}

async function GetAllReport (reportData) {
    const { 
        draw, 
        // order, 
        start, 
        length, 
        // search,
        start_date,
        end_date
    } = reportData;
    log('[Report] GetAllReport', reportData);
    try {
        if (!start_date || !end_date) throw { error: 'Rentan tanggal harus dilampirkan.' };
        
        const [recordsTotal, recordsFiltered, data] = await Promise.all([
            sequelize.query(`SELECT COUNT(*)
                FROM
                (
                    (SELECT 'Log Operator' as jenis_laporan, '-' AS no_tiket, CONCAT("Logs".ip_address, '/', "Users".nama_lengkap) AS detail,
                    '-' AS pic, '-' AS bidang,
                    "Logs".logdetail AS keterangan, "Logs".logtime AS tanggal 
                    FROM "Logs"
                    LEFT JOIN "Users" on "Users".id = "Logs".user_id 
                    WHERE "Users".kewenangan_id = 5
                    ORDER BY "Logs".logtime desc)
                    UNION ALL
                    (SELECT 'Tiket' AS jenis_laporan, "Tiket".no_tiket AS no_tiket,  concat("Users".nama_lengkap, '/', "Tiket".telepon) AS detail,
                    "u".nama_lengkap AS pic, "Kategori".kategori AS bidang, '-' AS keterangan, "Tiket"."createdAt" AS tanggal
                    FROM "Tiket" LEFT JOIN "Users" on "Users".id = "Tiket".reported_by
                    LEFT JOIN "Pegawai" on "Pegawai".id  = "Tiket".handled_by
                    LEFT JOIN "Users" AS u on "u".id = "Pegawai".user_id 
                    LEFT JOIN "Kategori" on "Kategori".id = "Tiket".kategori_id
                    ORDER BY "Tiket"."createdAt" DESC) 
                    UNION ALL
                    (SELECT 'Voip' AS jenis_laporan, '-' AS no_tiket, concat("Pabx".dst, '/', "Pabx".dst) AS detail, "Pabx".dst AS pic,
                    '-' AS bidang, '-' AS keterangan, "Pabx".call_date AS tanggal FROM "Pabx"
                    WHERE "Pabx".duration_minute > 10 AND recording_file != NULL AND disposition = 'ANSWERED'
                    ORDER BY "Pabx".call_date DESC) 
                    UNION ALL
                    (SELECT 'Chat' AS jenis_laporan, "Chat".case_id AS no_tiket, concat("Chat".fullname, '/', "Chat".phone_number) AS detail,
                    "Chat".agent_name AS pic, '-' AS bidang, CASE when "Chat".is_closed = true then 'Selesai' else 'Proses' end AS keterangan, "Chat"."createdAt" AS tanggal
                    FROM "Chat" WHERE "type" = 'livechat'
                    ORDER BY "Chat"."createdAt" DESC)
                    UNION ALL
                    (SELECT 'Whatsapp' AS jenis_laporan, "Chat".case_id AS no_tiket, concat("Chat".fullname, '/', "Chat".phone_number) AS detail,
                    "Chat".agent_name AS pic, '-' AS bidang, CASE when "Chat".is_closed = true then 'Selesai' else 'Proses' end AS keterangan, "Chat"."createdAt" AS tanggal
                    FROM "Chat" WHERE "type" = 'whatsapp'
                    ORDER BY "Chat"."createdAt" DESC)
                ) AS recordsTotal`
            ),
            sequelize.query(`SELECT COUNT(*)
                FROM (
                    (SELECT 'Log Operator' as jenis_laporan, '-' AS no_tiket, CONCAT("Logs".ip_address, '/', "Users".nama_lengkap) AS detail,
                    '-' AS pic, '-' AS bidang,
                    "Logs".logdetail AS keterangan, "Logs".logtime AS tanggal 
                    FROM "Logs"
                    LEFT JOIN "Users" on "Users".id = "Logs".user_id 
                    WHERE "Users".kewenangan_id = 5 AND
                    "Logs".logtime >= '${moment(start_date).format()}' AND
                    "Logs".logtime <= '${moment(end_date).format()}'
                    ORDER BY "Logs".logtime desc)
                    UNION ALL
                    (SELECT 'Tiket' AS jenis_laporan, "Tiket".no_tiket AS no_tiket,  concat("Users".nama_lengkap, '/', "Tiket".telepon) AS detail,
                    "u".nama_lengkap AS pic, "Kategori".kategori AS bidang, '-' AS keterangan, "Tiket"."createdAt" AS tanggal
                    FROM "Tiket" LEFT JOIN "Users" on "Users".id = "Tiket".reported_by
                    LEFT JOIN "Pegawai" on "Pegawai".id  = "Tiket".handled_by
                    LEFT JOIN "Users" AS u on "u".id = "Pegawai".user_id 
                    LEFT JOIN "Kategori" on "Kategori".id = "Tiket".kategori_id
                    WHERE "Tiket"."createdAt" >= '${moment(start_date).format()}' AND
                    "Tiket"."createdAt" <= '${moment(end_date).format()}'
                    ORDER BY "Tiket"."createdAt" DESC) 
                    UNION ALL
                    (SELECT 'Voip' AS jenis_laporan, '-' AS no_tiket, concat("Pabx".dst, '/', "Pabx".dst) AS detail, "Pabx".dst AS pic,
                    '-' AS bidang, '-' AS keterangan, "Pabx".call_date AS tanggal FROM "Pabx"
                    WHERE "Pabx".duration_minute > 10 AND recording_file != NULL AND disposition = 'ANSWERED' AND
                    "Pabx".call_date >= '${moment(start_date).format()}' AND
                    "Pabx".call_date <= '${moment(end_date).format()}'
                    ORDER BY "Pabx".call_date DESC) 
                    UNION ALL
                    (SELECT 'Chat' AS jenis_laporan, "Chat".case_id AS no_tiket, concat("Chat".fullname, '/', "Chat".phone_number) AS detail,
                    "Chat".agent_name AS pic, '-' AS bidang, CASE when "Chat".is_closed = true then 'Selesai' else 'Proses' end AS keterangan, "Chat"."createdAt" AS tanggal
                    FROM "Chat" WHERE "type" = 'livechat' AND
                    "Chat"."createdAt" >= '${moment(start_date).format()}' AND
                    "Chat"."createdAt" <= '${moment(end_date).format()}'
                    ORDER BY "Chat"."createdAt" DESC)
                    UNION ALL
                    (SELECT 'Whatsapp' AS jenis_laporan, "Chat".case_id AS no_tiket, concat("Chat".fullname, '/', "Chat".phone_number) AS detail,
                    "Chat".agent_name AS pic, '-' AS bidang, CASE when "Chat".is_closed = true then 'Selesai' else 'Proses' end AS keterangan, "Chat"."createdAt" AS tanggal
                    FROM "Chat" WHERE "type" = 'whatsapp' AND
                    "Chat"."createdAt" >= '${moment(start_date).format()}' AND
                    "Chat"."createdAt" <= '${moment(end_date).format()}'
                    ORDER BY "Chat"."createdAt" DESC)
                ) AS recordsFiltered`
            ),
            sequelize.query(`(SELECT 'Log Operator' as jenis_laporan, '-' AS no_tiket, CONCAT("Logs".ip_address, '/', "Users".nama_lengkap) AS detail,
                '-' AS pic, '-' AS bidang,
                "Logs".logdetail AS keterangan, "Logs".logtime AS tanggal 
                FROM "Logs"
                LEFT JOIN "Users" on "Users".id = "Logs".user_id 
                WHERE "Users".kewenangan_id = 5 AND
                "Logs".logtime >= '${moment(start_date).format()}' AND
                "Logs".logtime <= '${moment(end_date).format()}'
                ORDER BY "Logs".logtime desc)
                UNION ALL
                (SELECT 'Tiket' AS jenis_laporan, "Tiket".no_tiket AS no_tiket,  concat("Users".nama_lengkap, '/', "Tiket".telepon) AS detail,
                "u".nama_lengkap AS pic, "Kategori".kategori AS bidang, 
                CASE 
                    WHEN "Tiket".status = 0 THEN 'Menunggu Persetujuan Operator'
                    WHEN "Tiket".status = 1 THEN 'Disetujui oleh Operator'
                    WHEN "Tiket".status = 2 THEN 'Direject oleh Operator'
                    WHEN "Tiket".status = 3 THEN 'Diproses oleh Admin'
                    WHEN "Tiket".status = 5 THEN 'Diproses oleh Tim Teknis'
                    WHEN "Tiket".status = 7 THEN 'Ditutup'
                END
                AS keterangan,
                "Tiket"."createdAt" AS tanggal
                FROM "Tiket" LEFT JOIN "Users" on "Users".id = "Tiket".reported_by
                LEFT JOIN "Pegawai" on "Pegawai".id  = "Tiket".handled_by
                LEFT JOIN "Users" AS u on "u".id = "Pegawai".user_id 
                LEFT JOIN "Kategori" on "Kategori".id = "Tiket".kategori_id
                WHERE "Tiket"."createdAt" >= '${moment(start_date).format()}' AND
                "Tiket"."createdAt" <= '${moment(end_date).format()}'
                ORDER BY "Tiket"."createdAt" DESC) 
                UNION ALL
                (SELECT 'Voip' AS jenis_laporan, '-' AS no_tiket, concat("Pabx".dst, '/', "Pabx".dst) AS detail, "Pabx".dst AS pic,
                '-' AS bidang, '-' AS keterangan, "Pabx".call_date AS tanggal FROM "Pabx"
                WHERE "Pabx".duration_minute > 10 AND recording_file != NULL AND disposition = 'ANSWERED' AND
                "Pabx".call_date >= '${moment(start_date).format()}' AND
                "Pabx".call_date <= '${moment(end_date).format()}'
                ORDER BY "Pabx".call_date DESC) 
                UNION ALL
                (SELECT 'Chat' AS jenis_laporan, "Chat".case_id AS no_tiket, concat("Chat".fullname, '/', "Chat".phone_number) AS detail,
                "Chat".agent_name AS pic, '-' AS bidang,
                CASE 
                    WHEN 
                        "Chat".agent_name = '' THEN 'Unassigned'
                    ELSE 
                        CASE 
                            WHEN 
                                "Chat".is_closed = true THEN 'Resolved' 
                            ELSE 
                                'Ongoing'
                        END
                END
                AS keterangan, 
                "Chat"."createdAt" AS tanggal
                FROM "Chat" WHERE "type" = 'livechat' AND
                "Chat"."createdAt" >= '${moment(start_date).format()}' AND
                "Chat"."createdAt" <= '${moment(end_date).format()}'
                ORDER BY "Chat"."createdAt" DESC)
                UNION ALL
                (SELECT 'Whatsapp' AS jenis_laporan, "Chat".case_id AS no_tiket, concat("Chat".fullname, '/', "Chat".phone_number) AS detail,
                "Chat".agent_name AS pic, '-' AS bidang, CASE when "Chat".is_closed = true then 'Selesai' else 'Proses' end AS keterangan, "Chat"."createdAt" AS tanggal
                FROM "Chat" WHERE "type" = 'whatsapp' AND
                "Chat"."createdAt" >= '${moment(start_date).format()}' AND
                "Chat"."createdAt" <= '${moment(end_date).format()}'
                ORDER BY "Chat"."createdAt" DESC)
                OFFSET ${start} LIMIT ${length}`
            )
        ]);
            
        return {
            draw,
            recordsTotal: toInteger(recordsTotal[0][0].count),
            recordsFiltered: toInteger(recordsFiltered[0][0].count),
            data: data[0]
        };
    } catch (error) {
        return error;
    }
}

async function Test () {
    log('[Report] Test');
    try {
        const awal = 'T-';
        const belakang = moment().format('YYYYMMDDD') + Math.random()
        .toString(36).slice(10);
        
        const no_tiket = toUpper(awal + belakang)
        log('no_tiket', no_tiket);

        return no_tiket;
    } catch (error) {
        return error;
    }
}

module.exports = {
    GetNotif,
    GetDashboard,
    GetHistoryData,
    GetHistoryDataUser,
    GetDashboardUser,
    GetMaxData,
    GetReportBySatker,
    GetStatistic,
    GetAllReport,
    Test
}