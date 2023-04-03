// Feedback schema
module.exports = (sequelize, DataTypes) => {
    const Feedback = sequelize.define('Feedback',
        {
            tiket_id: DataTypes.UUID,
            reported_by: DataTypes.UUID,
            feedback: DataTypes.INTEGER,
            status: DataTypes.BOOLEAN
        },
        { freezeTableName: true }
    );

    Feedback.associate = function (models) {
        Feedback.belongsTo(models.Tiket, {
            foreignKey: 'tiket_id',
            as: 'tiket'
        });
        models.Tiket.hasOne(Feedback, {
            foreignKey: 'tiket_id',
            as: 'feedback'
        });
    }
    
    return Feedback;
};