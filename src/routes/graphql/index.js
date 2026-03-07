import { Router } from "express";
import { pushRows } from "../../supabase/index.js";

const router = Router();

let cachedHandler;

async function loadGraphQLHandler() {
  const [{ buildSchema }, { createHandler }] = await Promise.all([
    import("graphql"),
    import("graphql-http/lib/use/express"),
  ]);

  const schema = buildSchema(`
    type Query {
      health: String!
    }

    input PassengerIntakeInput {
      flightDesignator: String
      luggageType: String!
      luggageCount: Int
      companionsCount: Int
    }

    type PassengerIntakeResponse {
      ok: Boolean!
      message: String!
    }

    type Mutation {
      submitPassengerIntake(input: PassengerIntakeInput!): PassengerIntakeResponse!
    }
  `);

  const rootValue = {
    health: () => "ok",
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

        await pushRows("passengers", {
          flightDesignator: input.flightDesignator ?? null,
          luggageType: input.luggageType,
          luggageCount: input.luggageCount ?? null,
          companionsCount: input.companionsCount ?? null,
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

// B2C GraphQL endpoint (prepared to be extended)
router.all("/", async (req, res, next) => {
  if (!cachedHandler) {
    cachedHandler = await loadGraphQLHandler();
  }

  return cachedHandler(req, res, next);
});

export default router;
