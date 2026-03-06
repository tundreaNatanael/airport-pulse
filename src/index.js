import express from "express";
import "dotenv/config";
import apiRouter from "./routes/api/index.js";
import graphqlRouter from "./routes/graphql/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// B2B (partners) entry points
app.use("/api", apiRouter);

// B2C (passengers) graphql entry point
app.use("/graphql", graphqlRouter);

// // A simple "Hello World" route
// app.get("/", (req, res) => {
//   res.send({
//     message:
//       "The Airport Pulse backend is alive! 🚀",
//   });
// });

app.listen(PORT, () => {
  console.log(`Airport Pulse server is running on http://localhost:${PORT}`);
});
