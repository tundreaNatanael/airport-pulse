import { DataTypes } from "sequelize";
import { database } from "../dbDefinition/db.js";

export const flightsTable = database.define("Flights", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    flightNumber: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: "IATA flight number, e.g. AA123",
        validate: { notEmpty: true },
    },
    airline: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
    },
    // originAirportId and destinationAirportId are added via associations in db-sync.js
    scheduledDeparture: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    scheduledArrival: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("scheduled", "boarding", "departed", "arrived", "cancelled", "delayed"),
        allowNull: false,
        defaultValue: "scheduled",
    },
});
