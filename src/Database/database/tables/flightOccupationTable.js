import { DataTypes } from "sequelize";
import { database } from "../dbDefinition/db.js";

export const flightOccupationTable = database.define("FlightOccupation", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    // flightId FK is added via association in db-sync.js
    totalSeats: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        validate: { min: 1 },
    },
    occupiedSeats: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
    },
    occupationPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Percentage of seats occupied (0.00 - 100.00)",
        validate: { min: 0, max: 100 },
    },
});
