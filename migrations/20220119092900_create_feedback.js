module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.createTable("Feedback", {
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
            feedback: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            status: Sequelize.BOOLEAN,
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }),
    down: async (queryInterface /* , Sequelize */) => await queryInterface.dropTable("Feedback"),
  }