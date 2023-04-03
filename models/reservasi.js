// Reservasi schema
module.exports = (sequelize, DataTypes) => {
    const Reservasi = sequelize.define('Reservasi',
        {
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            tiket_id: DataTypes.UUID,
            pegawai_id: DataTypes.UUID,
            tanggal: DataTypes.DATE,
            tempat: DataTypes.STRING,
            tujuan: DataTypes.STRING,
            keterangan: DataTypes.TEXT,
            status: DataTypes.BOOLEAN,
            nama_petugas: DataTypes.STRING,
            telepon: DataTypes.STRING
        },
        { freezeTableName: true }
    );

    Reservasi.associate = function (models) {
        Reservasi.belongsTo(models.Tiket, {
            foreignKey: 'tiket_id',
            as: 'tiket'
        });
        models.Tiket.hasOne(Reservasi, {
            foreignKey: 'tiket_id',
            as: 'reservasi'
        });

        Reservasi.belongsTo(models.Pegawai, {
            foreignKey: 'pegawai_id',
            as: 'pegawai'
        });
        models.Pegawai.hasOne(Reservasi, {
            foreignKey: 'pegawai_id',
            as: 'reservasi'
        });
    }
    
    return Reservasi;
};