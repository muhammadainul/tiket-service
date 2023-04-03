module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.createTable("Tiket", {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            no_tiket: Sequelize.STRING,
            created_by: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { 
                    model: 'Users',
                    key: 'id'
                }
            },
            reported_by: { 
                type: Sequelize.UUID,
                allowNull: false,
                references: { 
                    model: 'Users',
                    key: 'id'
                }
            },
            kategori_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Kategori',
                    key: 'id'
                }
            },
            level_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: null,
                references: {
                    model: 'Level',
                    key: 'id'
                }
            },
            judul: { 
                type: Sequelize.STRING
            },
            detail: { 
                type: Sequelize.TEXT
            },
            handled_by: { 
                type: Sequelize.UUID,
                allowNull: true,
                defaultValue: null,
                references: { 
                    model: 'Pegawai',
                    key: 'id'
                }
            },
            gambar_id: {
                type: Sequelize.UUID,
                allowNull: true,
                defaultValue: null,
                references: { 
                    model: 'Gambar',
                    key: 'id'
                }
            },  
            status: { 
                type: Sequelize.INTEGER,
                allowNull: false
            },
            progress: { 
                type: Sequelize.DECIMAL(10, 0),
                defaultValue: 0
            },
            telepon: Sequelize.STRING,
            email: Sequelize.STRING,
            tanggal_proses: { 
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null
            },
            tanggal_selesai: { 
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null
            },
            alasan: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            type: Sequelize.STRING,
            durasi: Sequelize.INTEGER,
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }),
    down: async (queryInterface /* , Sequelize */) => await queryInterface.dropTable("Tiket"),
  }