// Kategori Schema
module.exports = (sequelize, DataTypes) => {
    const Kategori = sequelize.define('Kategori',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            kategori: DataTypes.STRING,
            akronim: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        },
        { freezeTableName: true }
    );
    
    return Kategori;
};