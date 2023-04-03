// Layanan schema
module.exports = (sequelize, DataTypes) => {
    const Layanan = sequelize.define('Layanan', {
		nama_layanan: DataTypes.STRING,
		kategori_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
    },
    { freezeTableName: true }
    );

    Layanan.associate = function (models) {
        Layanan.belongsTo(models.Kategori, {
            foreignKey: 'kategori_id',
            as: 'kategori'
        });
        models.Kategori.hasMany(Layanan, {
            foreignKey: 'kategori_id',
            as: 'layanan'
        });
    }

    return Layanan;
}