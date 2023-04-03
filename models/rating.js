// Rating schema
module.exports = (sequelize, DataTypes) => {
    const Rating = sequelize.define('Rating',
        {
            tiket_id: DataTypes.UUID,
            reported_by: DataTypes.UUID,
            pegawai_id: DataTypes.UUID,
            status: DataTypes.BOOLEAN,
            rating: DataTypes.INTEGER
        },
        { freezeTableName: true }
    );

    Rating.associate = function (models) {
        Rating.belongsTo(models.Tiket, {
            foreignKey: 'tiket_id',
            as: 'tiket'
        });
        models.Tiket.hasOne(Rating, {
            foreignKey: 'tiket_id',
            as: 'rating'
        });
    }
    
    return Rating;
};