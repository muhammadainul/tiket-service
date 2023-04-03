module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.createTable("Temporary", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            pegawai_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Pegawai',
                    key: 'id'
                }
            },
            assign: Sequelize.BOOLEAN,
            total: Sequelize.INTEGER,
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }),
    down: async (queryInterface /* , Sequelize */) => await queryInterface.dropTable("Temporary"),
  }