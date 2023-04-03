module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.addColumn(
            'Pegawai',
            'level',
            {
                type: Sequelize.INTEGER,
                allowNull: true
            }
        ),  
    down: async (queryInterface , Sequelize) => 
        await queryInterface.addColumn(
            'Pegawai',
            'level',
            {
                type: Sequelize.INTEGER,
                allowNull: true
            }
        )
    }