module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.addColumn(
                'Pegawai',
                'next',
                {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                    defaultValue: null
                }
            ),
            queryInterface.addColumn(
                'Pegawai',
                'order',
                {
                    type: Sequelize.INTEGER,
                    allowNull: true
                }
            ),
        ])
    },
    down: async (queryInterface , Sequelize) => {
        return Promise.all([
            queryInterface.addColumn(
                'Pegawai',
                'next',
                {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                    defaultValue: null
                }
            ),
            queryInterface.addColumn(
                'Pegawai',
                'order',
                {
                    type: Sequelize.INTEGER,
                    allowNull: true
                }
            ),
        ])
    }
}