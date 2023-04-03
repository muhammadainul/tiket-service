module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.createTable("Layanan", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            nama_layanan: Sequelize.STRING,
            kategori_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Kategori',
                    key: 'id'
                }
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
    down: async (queryInterface /* , Sequelize */) => await queryInterface.dropTable("Layanan"),
  }