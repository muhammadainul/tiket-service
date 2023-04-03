const { Client } = require('node-scp');
const fs = require('fs');

require('dotenv').config();

module.exports = {
    Upload: async (imageData) => {
        console.log('Image data', imageData);
        try {
            const client = await Client({
                host: process.env.SCP_HOST,
                port: process.env.SCP_PORT,
                username: process.env.SCP_USERNAME,
                password: process.env.SCP_PASSWORD
            });
            console.log('client', client);
            await client.uploadFile(`./uploads/images/${imageData.filename}`, `/www/wwwroot/pixelco.site/${imageData.filename}`);

            fs.unlinkSync(`./uploads/images/${imageData.filename}`);
            // await client.list('/')
            client.close();
        } catch (error) {
            console.log('error', error);
            return error;
        }
    }
}