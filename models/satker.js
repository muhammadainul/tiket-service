// Satker schema
module.exports = (sequelize, DataTypes) => {
    const Satker = sequelize.define('Satker', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
		kode_satker: {
            type: DataTypes.STRING,
            allowNull: false
        },
		nama_satker: DataTypes.STRING,
        akronim: DataTypes.STRING,
        lokasi: DataTypes.STRING
    },
    { freezeTableName: true }
    );

    Satker.associate = function (models) {
        models.Users.belongsTo(Satker, {
            foreignKey: 'satker_id',
            as: 'satker'
        })
    };

    return Satker;
}