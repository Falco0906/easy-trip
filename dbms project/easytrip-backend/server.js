const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const User = require('./models/users');

const app = express();

// CORS configuration - allow all origins for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] // Replace with your actual frontend URL
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(express.json());

// MongoDB connection - Use environment variable or fallback to local
const mongoURI = process.env.MONGODB_URI || process.env.DB_CONNECTION || "mongodb://localhost:27017/easytrip";

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
    console.log(`Connected to: ${mongoURI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    // In production, you might want to exit the process
    if (process.env.NODE_ENV === 'production') {
      console.error("Database connection failed in production. Exiting...");
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// Schemas and Models
const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  pricePerNight: { type: Number, required: true },
  amenities: [String],
  availableRooms: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Hotel = mongoose.model("Hotel", hotelSchema);

const flightSchema = new mongoose.Schema({
  airline: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  price: { type: Number, required: true },
  availableSeats: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Flight = mongoose.model("Flight", flightSchema);

const trainSchema = new mongoose.Schema({
  trainName: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  price: { type: Number, required: true },
  availableSeats: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Train = mongoose.model("Train", trainSchema);

// Health check route
app.get("/", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({
    message: "EasyTrip API is running",
    status: "Server is healthy",
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API health check
app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({
    server: "Running",
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Hotels API
app.get("/api/hotels", asyncHandler(async (req, res) => {
  const { location, maxPrice, amenities } = req.query;
  let query = {};
  
  if (location) query.location = new RegExp(location, 'i');
  if (maxPrice) query.pricePerNight = { $lte: parseInt(maxPrice) };
  if (amenities) query.amenities = { $in: amenities.split(',') };
  
  const hotels = await Hotel.find(query).sort({ pricePerNight: 1 });
  res.json({ success: true, count: hotels.length, data: hotels });
}));

app.post("/api/hotels", asyncHandler(async (req, res) => {
  const hotel = new Hotel(req.body);
  const savedHotel = await hotel.save();
  res.status(201).json({ success: true, data: savedHotel });
}));

// Flights API
app.get("/api/flights", asyncHandler(async (req, res) => {
  const { from, to, date } = req.query;
  let query = {};
  
  if (from) query.from = new RegExp(from, 'i');
  if (to) query.to = new RegExp(to, 'i');
  if (date) {
    const searchDate = new Date(date);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);
    query.departureTime = { $gte: searchDate, $lt: nextDay };
  }
  
  const flights = await Flight.find(query).sort({ price: 1 });
  res.json({ success: true, count: flights.length, data: flights });
}));

app.post("/api/flights", asyncHandler(async (req, res) => {
  const flight = new Flight(req.body);
  const savedFlight = await flight.save();
  res.status(201).json({ success: true, data: savedFlight });
}));

// Trains API
app.get("/api/trains", asyncHandler(async (req, res) => {
  const { from, to, date } = req.query;
  let query = {};
  
  if (from) query.from = new RegExp(from, 'i');
  if (to) query.to = new RegExp(to, 'i');
  if (date) {
    const searchDate = new Date(date);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);
    query.departureTime = { $gte: searchDate, $lt: nextDay };
  }
  
  const trains = await Train.find(query).sort({ price: 1 });
  res.json({ success: true, count: trains.length, data: trains });
}));

app.post("/api/trains", asyncHandler(async (req, res) => {
  const train = new Train(req.body);
  const savedTrain = await train.save();
  res.status(201).json({ success: true, data: savedTrain });
}));

// Authentication Routes
app.post('/signup', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Signup request:', { email: email, password: '[HIDDEN]' });
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 6 characters long' 
    });
  }
  
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ 
      success: false, 
      message: 'User already exists with this email' 
    });
  }
  
  const user = new User({ 
    email: email.toLowerCase(), 
    password 
  });
  
  await user.save();
  
  res.status(201).json({ 
    success: true, 
    message: 'Account created successfully',
    user: { email: user.email, id: user._id }
  });
}));

app.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email: email, password: '[HIDDEN]' });
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }
  
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: 'No account found with this email' 
    });
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid password' 
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Login successful',
    user: { email: user.email, id: user._id }
  });
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API endpoints available at: http://localhost:${PORT}`);
});
