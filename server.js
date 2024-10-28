import express from "express";
import cors from "cors";
import propertyRoutes from "./routes/property.js";
import dotenv from "dotenv";
import session from 'express-session';
import passport from "passport";
import connectToServer from "./db/conn.js";
dotenv.config({ path: "../.env" });

const app = express();


/*app.use(cors({
  origin: (origin, callback) => {
    console.log("Received request from origin:", origin); // Log every incoming origin
    callback(null, true); // Allow every origin
  },
  credentials: true
}));8 */

// CORS setup
app.use(cors({
  origin: function (origin, callback) {
    console.log("Received request from origin:", origin); // Log every incoming origin
    const allowedOrigins = [/kinder-real-estate-[a-z0-9-]+\.vercel\.app$/];
    if (!origin || allowedOrigins.some(pattern => pattern.test(origin))) {
      callback(null, true); // Allow the request if the origin is not set or matches the pattern
    } else {
      console.log("Blocking origin:", origin); // Log blocked origins
      callback(new Error('CORS policy violation')); // Block the request if the origin does not match the pattern
    }
  },
  credentials: true
}));

// Express.js setup
app.use(express.json());
app.use(session({
  secret: process.env.VITE_PASSPORT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 86400000, // 24 hours
    sameSite: 'strict'
  }
}));

// Initialize Passport.js and its session handling
app.use(passport.initialize());
app.use(passport.session());

app.use(propertyRoutes);

// Define a root route
app.get('/', (req, res) => {
  res.send('Welcome to Kinder Real Estate Backend');
});

// Error handling middleware
app.use(function (err, req, res, next) {
  console.error(err.stack); // Log error stack trace to the console
  res.status(500).send({ error: err }); // Send a 500 response with a custom error message
});

// get driver connection

const port = process.env.VITE_PORT || 5000;

// perform a database connection when server starts
connectToServer().then(() => {
  // Start the server after the connection is made
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}).catch((err) => {
  console.error('Failed to connect to the database', err);
  process.exit(1); // Exit process with failure
});

// Export the Express app for Vercel
export default app;