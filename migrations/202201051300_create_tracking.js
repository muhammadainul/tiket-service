module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.createTable("Tracking", {
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
            user_id: { 
                type: Sequelize.UUID,
                allowNull: false,
                references: { 
                    model: 'Users',
                    key: 'id'
                }
            },
            status: { 
                type: Sequelize.STRING
            },
            deskripsi: { 
                type: Sequelize.TEXT
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
    down: async (queryInterface /* , Sequelize */) => await queryInterface.dropTable("Tracking"),
  }