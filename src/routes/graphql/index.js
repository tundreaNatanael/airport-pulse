import { Router } from "express";

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
  `);

  const rootValue = {
    health: () => "ok",
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
