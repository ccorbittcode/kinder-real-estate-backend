import express from "express";
import cors from "cors";
import propertyRoutes from "./routes/property.js";
import dotenv from "dotenv";
import session from 'express-session';
import passport from "passport";
import connectToServer from "./db/conn.js";
dotenv.config({ path: "../.env" });

const app = express();

// Express.js setup
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [`https://kinder-real-estate-ui.vercel.app`, `https://kinder-real-estate-backend-aopb9yqmh-chases-projects-2d870ea0.vercel.app/`];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));
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

// Error handling middleware
app.use(function (err, req, res, next) {
  console.error(err.stack); // Log error stack trace to the console
  res.status(500).send({ error: 'Something went wrong!' }); // Send a 500 response with a custom error message
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
