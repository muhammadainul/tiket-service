require('dotenv').config();

module.exports = {
    development: {
        myConfig: {
            sessionSecret: "topSecret!",
            refreshSessionSecret: "topSecret!",
            expiredSessionTime: "24h",
            expiredRefreshSessionTime: "24h",
            destination_image: process.env.DESTINATION_IMAGE,
            path_image: process.env.PATH_IMAGE 
        },
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            service: process.env.SMTP_SERVICE,
            user: process.env.SMTP_USER,
            password: process.env.SMTP_PASSWORD
        }
    },
    test: {
        myConfig: {
            sessionSecret: "topSecret!",
            refreshSessionSecret: "topSecret!",
            expiredSessionTime: "2h",
            expiredRefreshSessionTime: "3h",
            destination_image: process.env.DESTINATION_IMAGE,
            path_image: process.env.PATH_IMAGE  
        },
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            service: process.env.SMTP_SERVICE,
            user: process.env.SMTP_USER,
            password: process.env.SMTP_PASSWORD
        }
    },
    production: {
        myConfig: {
            sessionSecret: "topSecret!",
            refreshSessionSecret: "topSecret!",
            expiredSessionTime: "2h",
            expiredRefreshSessionTime: "3h",
            destination_image: process.env.DESTINATION_IMAGE,
            path_image: process.env.PATH_IMAGE 
        },
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            service: process.env.SMTP_SERVICE,
            user: process.env.SMTP_USER,
            password: process.env.SMTP_PASSWORD
        }
    }
}   