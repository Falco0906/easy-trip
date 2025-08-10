const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const User = require('./models/users');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your MongoDB connection string
const mongoURI = "mongodb://localhost:27017/easytrip";
mongoose.connect(mongoURI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("MongoDB connection error:", err));

// Schemas and Models

const hotelSchema = new mongoose.Schema({
  name: String,
  location: String,
  pricePerNight: Number,
  amenities: [String],
  availableRooms: Number,
});
const Hotel = mongoose.model("Hotel", hotelSchema);

const flightSchema = new mongoose.Schema({
  airline: String,
  from: String,
  to: String,
  departureTime: Date,
  arrivalTime: Date,
  price: Number,
  availableSeats: Number,
});
const Flight = mongoose.model("Flight", flightSchema);

const trainSchema = new mongoose.Schema({
  trainName: String,
  from: String,
  to: String,
  departureTime: Date,
  arrivalTime: Date,
  price: Number,
  availableSeats: Number,
});
const Train = mongoose.model("Train", trainSchema);

// Routes

app.get("/", (req, res) => {
  res.send("EasyTrip API is running");
});

// Hotels API
app.get("/api/hotels", async (req, res) => {
  const hotels = await Hotel.find();
  res.json(hotels);
});

app.post("/api/hotels", async (req, res) => {
  const hotel = new Hotel(req.body);
  await hotel.save();
  res.json(hotel);
});

// Flights API
app.get("/api/flights", async (req, res) => {
  const flights = await Flight.find();
  res.json(flights);
});

app.post("/api/flights", async (req, res) => {
  const flight = new Flight(req.body);
  await flight.save();
  res.json(flight);
});

// Trains API
app.get("/api/trains", async (req, res) => {
  const trains = await Train.find();
  res.json(trains);
});

app.post("/api/trains", async (req, res) => {
  const train = new Train(req.body);
  await train.save();
  res.json(train);
});
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true, // optional, needed only if you're using cookies or sessions
}));
//sign up
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  console.log('Request body:', req.body);

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const user = new User({ email, password });
  await user.save();
  res.json({ message: 'Signup successful' });
});



//login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Start server

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
