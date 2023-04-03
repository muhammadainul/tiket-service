// Temporary schema
module.exports = (sequelize, DataTypes) => {
    const Temporary = sequelize.define('Temporary', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
		pegawai_id: DataTypes.UUID,
		assign: DataTypes.BOOLEAN,
        total: DataTypes.INTEGER
    },
    { freezeTableName: true }
    );

    return Temporary;
}