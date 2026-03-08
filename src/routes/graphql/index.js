import { Router } from "express";
import { pushRows, retrieveRows } from "../../supabase/index.js";

const router = Router();

let cachedHandler;

async function loadGraphQLHandler() {
  const [{ buildSchema }, { createHandler }] = await Promise.all([
    import("graphql"),
    import("graphql-http/lib/use/express"),
  ]);

  const pickFrom = (row, ...keys) => {
    if (!row) return null;

    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        return row[key];
      }
    }

    return null;
  };

  const normalizeConnectionSelection = (value) => {
    if (!value) return null;

    const allowed = new Set([
      "boltServices",
      "uberServices",
      "publicTransport.taxi",
      "publicTransport.metro",
      "publicTransport.trains",
      "rentalCar",
    ]);

    const aliases = {
      bolt: "boltServices",
      boltservices: "boltServices",
      uber: "uberServices",
      uberservices: "uberServices",
      taxi: "publicTransport.taxi",
      "publictransport.taxi": "publicTransport.taxi",
      metro: "publicTransport.metro",
      "publictransport.metro": "publicTransport.metro",
      train: "publicTransport.trains",
      trains: "publicTransport.trains",
      "publictransport.trains": "publicTransport.trains",
      rentalcar: "rentalCar",
      "rental car": "rentalCar",
    };

    const trimmed = `${value}`.trim();

    if (allowed.has(trimmed)) {
      return trimmed;
    }

    const aliasKey = trimmed.toLowerCase().replace(/\s+/g, "");
    return aliases[aliasKey] ?? null;
  };

  const fetchFlightByDesignator = async (flightDesignator) => {
    const candidateColumns = [
      "flight_designator",
      "flight_number",
      "flightNumber",
      "designator",
    ];

    let lastError;
    let hadSuccessfulQuery = false;

    for (const column of candidateColumns) {
      try {
        const rows = await retrieveRows("flights", {
          filters: { [column]: flightDesignator },
          limit: 1,
        });

        hadSuccessfulQuery = true;

        if (rows.length) {
          return rows[0];
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!hadSuccessfulQuery && lastError) {
      throw lastError;
    }

    return null;
  };

  const fetchAirportByCode = async (code) => {
    if (!code) return null;

    const candidateColumns = [
      "code",
      "airport_code",
      "iata_code",
      "icao_code",
      "id",
    ];

    let lastError;
    let hadSuccessfulQuery = false;

    for (const column of candidateColumns) {
      try {
        const rows = await retrieveRows("airports", {
          filters: { [column]: code },
          limit: 1,
        });

        hadSuccessfulQuery = true;

        if (rows.length) {
          return rows[0];
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!hadSuccessfulQuery && lastError) {
      throw lastError;
    }

    return null;
  };

  const mapFlightDetails = (flightRow, arrivalAirport, departureAirport) => {
    // const departureAirportCode = pickFrom(
    //   flightRow,
    //   "departure_airport",
    //   "departure_airport_code",
    //   "departureAirport",
    //   "departure_code",
    //   "from_airport",
    // );

    // const arrivalAirportCode = pickFrom(
    //   flightRow,
    //   "arrival_airport",
    //   "arrival_airport_code",
    //   "arrivalAirport",
    //   "arrival_code",
    //   "to_airport",
    // );

    const departureAirportName = departureAirport?.name;
    const arrivalAirportName = arrivalAirport?.name;

    const connections = arrivalAirport?.connections;

    return {
      flight_number: pickFrom(
        flightRow,
        "flight_number",
        "flight_designator",
        "flightNumber",
        "designator",
      ),
      aircraft_type: pickFrom(
        flightRow,
        "aircraft_type",
        "aircraftType",
        "aircraft",
      ),
      expected_departure_time: pickFrom(
        flightRow,
        "expected_departure_time",
        "scheduled_departure_time",
        "departure_time",
        "scheduled_departure",
      ),
      expected_arrival_time: pickFrom(
        flightRow,
        "expected_arrival_time",
        "scheduled_arrival_time",
        "arrival_time",
        "scheduled_arrival",
      ),
      actual_departure_time: pickFrom(
        flightRow,
        "actual_departure_time",
        "departed_at",
        "actual_departure",
      ),
      actual_arrival_time: pickFrom(
        flightRow,
        "actual_arrival_time",
        "arrived_at",
        "actual_arrival",
      ),
      flight_duration: pickFrom(
        flightRow,
        "flight_duration",
        "duration",
        "elapsed_time",
      ),
      departure_airport: departureAirportName,
      arrival_airport: arrivalAirportName,
      connections,
    };
  };

  const schema = buildSchema(`
    type Query {
      health: String!
      flightDetails(flightDesignator: String!): FlightDetails
    }

    input PassengerIntakeInput {
      flightDesignator: String
      luggageType: String!
      luggageCount: Int
      companionsCount: Int
      connectionSelected: String
    }

    type PassengerIntakeResponse {
      ok: Boolean!
      message: String!
    }

    type PublicTransport {
      taxi: String
      buses: String
      metro: String
      trains: String
      rental_car: String
    }

    type Connections {
      boltServices: String
      uberServices: String
      publicTransport: PublicTransport
    }

    type FlightDetails {
      flight_number: String
      aircraft_type: String
      expected_departure_time: String
      expected_arrival_time: String
      actual_departure_time: String
      actual_arrival_time: String
      flight_duration: String
      departure_airport: String
      arrival_airport: String
      connections: Connections
    }

    type Mutation {
      submitPassengerIntake(input: PassengerIntakeInput!): PassengerIntakeResponse!
    }
  `);

  const rootValue = {
    health: () => "ok",
    flightDetails: async ({ flightDesignator }) => {
      const flight = await fetchFlightByDesignator(flightDesignator);

      if (!flight) {
        return null;
      }

      const arrivalAirportCode = flight?.arrival_airport_iata;
      const departureAirportCode = flight?.departure_airport_iata;

      // const departureAirportCode = pickFrom(
      //   flight,
      //   "departure_airport",
      //   "departure_airport_code",
      //   "departureAirport",
      //   "departure_code",
      //   "from_airport",
      // );

      const arrivalAirport = await fetchAirportByCode(arrivalAirportCode);
      const departureAirport = await fetchAirportByCode(departureAirportCode);

      return mapFlightDetails(flight, arrivalAirport, departureAirport);
    },
    submitPassengerIntake: async ({ input }) => {
      try {
        if (
          input.luggageCount != null &&
          (!Number.isInteger(input.luggageCount) || input.luggageCount < 0)
        ) {
          return {
            ok: false,
            message: "luggageCount must be a non-negative integer.",
          };
        }

        if (
          input.companionsCount != null &&
          (!Number.isInteger(input.companionsCount) ||
            input.companionsCount < 0)
        ) {
          return {
            ok: false,
            message: "companionsCount must be a non-negative integer.",
          };
        }

        const connectionSelected = normalizeConnectionSelection(
          input.connectionSelected,
        );

        if (input.connectionSelected && !connectionSelected) {
          return {
            ok: false,
            message:
              "connectionSelected must be one of boltServices, uberServices, publicTransport.taxi, publicTransport.metro, publicTransport.trains, rentalCar.",
          };
        }

        await pushRows("passengers", {
          flightDesignator: input.flightDesignator ?? null,
          luggageType: input.luggageType,
          luggageCount: input.luggageCount ?? null,
          companionsCount: input.companionsCount ?? null,
          connectionSelected: connectionSelected ?? null,
        });

        return {
          ok: true,
          message: "Passenger intake submitted successfully.",
        };
      } catch (error) {
        return {
          ok: false,
          message: error.message || "Failed to submit passenger intake.",
        };
      }
    },
  };

  return createHandler({
    schema,
    rootValue,
    graphiql: process.env.NODE_ENV !== "production",
  });
}

router.all("/", async (req, res, next) => {
  if (!cachedHandler) {
    cachedHandler = await loadGraphQLHandler();
  }

  return cachedHandler(req, res, next);
});

export default router;
