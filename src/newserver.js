console.log("🚀 Starting server...");

import express from "express";
import { SCREEN_RESPONSES } from "./Flow.js"; // Ensure correct path

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ✅ Log Every Request
app.use((req, res, next) => {
    console.log(`🔍 Incoming request: ${req.method} ${req.url}`);
    next();
});

app.get("/flow/:screen", (req, res) => {
    const { screen } = req.params;

    console.log(`➡️ Request for screen: ${screen}`);
    console.log("Available screens:", Object.keys(SCREEN_RESPONSES));

    if (SCREEN_RESPONSES[screen]) {
        console.log(`✅ Found screen: ${screen}`);
        return res.json(SCREEN_RESPONSES[screen]);
    }

    console.log("❌ Screen not found!");
    return res.status(404).json({ error: "Screen not found" });
});

// ✅ Test Route
app.get("/test", (req, res) => {
    console.log("✅ Test route accessed!");
    res.send("Server is working!");
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
