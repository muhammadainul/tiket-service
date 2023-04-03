module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.createTable("Reservasi", {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            tiket_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { 
                    model: 'Tiket',
                    key: 'id'
                }
            },
            pegawai_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { 
                    model: 'Pegawai',
                    key: 'id'
                }
            },
            status: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            tanggal: { 
                type: Sequelize.DATE,
                allowNull: false
            },
            tempat: Sequelize.STRING,
            tujuan: Sequelize.STRING,
            keterangan: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            nama_petugas: Sequelize.STRING,
            telepon: Sequelize.STRING,
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }),
    down: async (queryInterface /* , Sequelize */) => await queryInterface.dropTable("Reservasi"),
  }