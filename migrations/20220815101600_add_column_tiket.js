module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.addColumn(
            'Tiket',
            'nama_pelapor',
            {
                type: Sequelize.STRING,
                allowNull: true
            }
        ),  
    down: async (queryInterface , Sequelize) => 
        await queryInterface.addColumn(
            'Tiket',
            'nama_pelapor',
            {
                type: Sequelize.STRING,
                allowNull: true
            }
        )
    }