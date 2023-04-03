module.exports = {
    up: async (queryInterface, Sequelize) =>
        await queryInterface.changeColumn(
            'Tiket',
            'handled_by',
            {   
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Pegawai',
                    key: 'id'
                }
            }
        ),  
    down: async (queryInterface /* , Sequelize */) => 
        await queryInterface.changeColumn(
            'Tiket',
            'handled_by',
            {   
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Pegawai',
                    key: 'id'
                }
            }
        )
  }