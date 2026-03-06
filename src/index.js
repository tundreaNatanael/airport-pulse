import express from "express";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// A simple "Hello World" route
app.get("/", (req, res) => {
  res.send({
    message:
      "The modern backend is alive! 🚀 The modern backend is alive!The modern backend is alive!The modern backend is alive!",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
