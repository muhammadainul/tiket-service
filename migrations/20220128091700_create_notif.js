module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.createTable("Notifikasi", {
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
            user_id: { 
                type: Sequelize.UUID,
                allowNull: false,
                references: { 
                    model: 'Users',
                    key: 'id'
                }
            },
            pegawai_id: {
                type: Sequelize.UUID,
                allowNull: true,
                defaultValue: null,
                references: { 
                    model: 'Pegawai',
                    key: 'id'
                }
            },
            detail: {
                type: Sequelize.TEXT
            },
            read: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            title: Sequelize.STRING,
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }),
    down: async (queryInterface /* , Sequelize */) => await queryInterface.dropTable("Notifikasi"),
  }