module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.createTable("Kategori", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            kategori: {
                type: Sequelize.STRING,
                allowNull: true
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
    down: async (queryInterface /* , Sequelize */) => await queryInterface.dropTable("Kategori"),
  }