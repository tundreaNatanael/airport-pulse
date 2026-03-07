import { DataTypes } from "sequelize";
import { database } from "../dbDefinition/db.js";

export const airportsTable = database.define("Airports", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    iataCode: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        unique: true,
        comment: "3-letter IATA code, e.g. JFK",
        validate: {
            notEmpty: true,
            len: [3, 3],
        },
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
    },
    country: {
        type: DataTypes.STRING(2),
        allowNull: false,
        comment: "ISO 3166-1 alpha-2 country code, e.g. US",
        validate: { notEmpty: true },
    },
    timezone: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "IANA timezone, e.g. America/New_York",
    },
});
