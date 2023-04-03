module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.createTable("Level", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            level: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            deskripsi: Sequelize.STRING,
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }),
    down: async (queryInterface /* , Sequelize */) => await queryInterface.dropTable("Level"),
  }