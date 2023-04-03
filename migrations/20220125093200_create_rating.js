module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.createTable("Rating", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
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
            reported_by: { 
                type: Sequelize.UUID,
                allowNull: false,
                references: { 
                    model: 'Users',
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
            rating: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            status: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }),
    down: async (queryInterface /* , Sequelize */) => await queryInterface.dropTable("Rating"),
  }