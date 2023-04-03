// Log schema
module.exports = (sequelize, DataTypes) => {
    const Log = sequelize.define('Logs', {
		ip_address: DataTypes.STRING,
		browser: DataTypes.STRING,
		browser_version: DataTypes.STRING,
		os: DataTypes.STRING,
		logtime: {
			type: DataTypes.DATE,
			defaultValue: sequelize.fn('now')
		},
		logdetail: DataTypes.STRING,
		user_id: {
			type: DataTypes.UUID,
			allowNull: true, 
			references: {
				model: 'users',
				id: 'id'
			}
		}
    },
    { timestamps: false }
    );

    Log.associate = function (models) {
        Log.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    }

    return Log;
}