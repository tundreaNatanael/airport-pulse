import { database } from "../dbDefinition/db.js";
import { airportsTable } from "../tables/airportsTable.js";
import { flightsTable } from "../tables/flightsTable.js";
import { flightOccupationTable } from "../tables/flightOccupationTable.js";
import "../tables/usersTable.js";

// --- Associations ---

// A flight has one origin airport and one destination airport
flightsTable.belongsTo(airportsTable, { as: "origin", foreignKey: { name: "originAirportId", allowNull: false } });
flightsTable.belongsTo(airportsTable, { as: "destination", foreignKey: { name: "destinationAirportId", allowNull: false } });
airportsTable.hasMany(flightsTable, { as: "departingFlights", foreignKey: "originAirportId" });
airportsTable.hasMany(flightsTable, { as: "arrivingFlights", foreignKey: "destinationAirportId" });

// A flight has one occupation record
flightsTable.hasOne(flightOccupationTable, { foreignKey: { name: "flightId", allowNull: false } });
flightOccupationTable.belongsTo(flightsTable, { foreignKey: "flightId" });

// --- Sync ---
database.sync({ alter: true }).then(() => {
    console.log("FINISHED SUCCESS");
    process.exit(0);
});
