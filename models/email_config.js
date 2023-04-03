// Mail Schema
module.exports = (sequelize, DataTypes) => {
    const Email_config = sequelize.define('Email_config',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            host: DataTypes.STRING,
            user: DataTypes.STRING,
            password: DataTypes.STRING,
            port: DataTypes.INTEGER,
            tls: DataTypes.STRING,
            template: DataTypes.TEXT,
            template_footer: DataTypes.TEXT,
            webmail: DataTypes.STRING
        },
        { freezeTableName: true }
    );
    
    return Email_config;
};