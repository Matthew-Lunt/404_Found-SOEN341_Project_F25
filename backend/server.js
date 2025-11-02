// Import dependencies
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

// Read Firebase service account JSON
const serviceAccount = JSON.parse(
  fs.readFileSync("./firebaseServiceAccount.json", "utf8")
);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firestore database
const db = admin.firestore();

// Express app setup
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Create a new event
app.post("/api/events", async (req, res) => {
  try {
    const event = req.body;
    if (!event.title || !event.organizer || !event.date) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const eventData = {
      title: event.title,
      organizer: event.organizer,
      description: event.description || "",
      date: event.date,
      time: event.time || "",
      location: event.location || "",
      capacity: Number(event.capacity || 0),
      ticketType: event.ticketType || "Free",
      price: event.price || "Free",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("events").add(eventData);
    res.status(201).json({ message: "✅ Event created successfully!", id: docRef.id });
  } catch (error) {
    console.error("❌ Error creating event:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get all events
app.get("/api/events", async (req, res) => {
  try {
    const snapshot = await db.collection("events").get();
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("🔥 Backend is running successfully!");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
