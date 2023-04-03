// Komentar schema
module.exports = (sequelize, DataTypes) => {
    const Komentar = sequelize.define('Komentar',
        {
            tiket_id: DataTypes.UUID,
            user_id: DataTypes.UUID,
            komentar: DataTypes.TEXT
        },
        { freezeTableName: true }
    );
    
    Komentar.associate = function (models) {
        Komentar.belongsTo(models.Tiket, {
            foreignKey: 'tiket_id',
            as: 'tiket'
        });
        models.Tiket.hasMany(Komentar, {
            foreignKey: 'tiket_id',
            as: 'komentar'
        });

        Komentar.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        models.Users.hasMany(Komentar, {
            foreignKey: 'user_id',
            as: 'user'
        });
    }
    
    return Komentar;
};