import express from "express";
import dotenv from "dotenv"; // Import dotenv

dotenv.config(); // Load .env file

const app = express();

// Access environment variables
const PORT = process.env.PORT || 3000;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

console.log("Database URL:", PUBLIC_KEY);
console.log("API Key:", PRIVATE_KEY);

app.get("/", (req, res) => {
  res.send("Hello, .env is loaded!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
