import { database } from "../dbDefinition/db.js";
import { DataTypes } from "sequelize";

export const usersTable = database.define("Users", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        validate: {
            notEmpty: true,
        },
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    adminRole: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
            notEmpty: true,
        },
    },
    refreshToken: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            notEmpty: false,
        },
    },
});
