// Tracking schema
module.exports = (sequelize, DataTypes) => {
    const Tracking = sequelize.define('Tracking', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        tiket_id: {
            type: DataTypes.UUID
        },
        user_id: {
            type: DataTypes.UUID
        },
        status: DataTypes.STRING,
        deskripsi: DataTypes.STRING
    },
    { freezeTableName: true }
    );

    Tracking.associate = function (models) {
        Tracking.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };
    
    return Tracking;
}