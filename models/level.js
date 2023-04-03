// Level schema
module.exports = (sequelize, DataTypes) => {
    const Level = sequelize.define('Level', {
		level: DataTypes.INTEGER,
		deskripsi: DataTypes.STRING
    },
    { freezeTableName: true }
    );

    return Level;
}