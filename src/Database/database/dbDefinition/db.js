import { Sequelize } from "sequelize";

const dbDetails = {
    NAME: process.env.DB_NAME,
    USERNAME: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    options: {
        dialect: "mysql",
        timezone: "+00:00",
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        define: {
            freezeTableName: true,
        },
        logging: process.env.NODE_ENV === "development" ? console.log : false,
    },
};
export const database = new Sequelize(dbDetails.NAME, dbDetails.USERNAME, dbDetails.PASSWORD, dbDetails.options);