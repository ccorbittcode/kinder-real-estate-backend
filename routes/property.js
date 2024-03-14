import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

import express from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";


// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


// The router will be added as a middleware and will take control of requests starting with path /record.
const propertyRoutes = express.Router();

// This will help us connect to the database
import { getDb } from "../db/conn.js";

// This help convert the id from string to ObjectId for the _id.
import { ObjectId } from "mongodb";

// Define the asyncHandler function
function asyncHandler(fn) {
    return function (req, res, next) {
        return Promise
            .resolve(fn(req, res, next))
            .catch(next);
    }
}

// Passport.js setup
passport.use(new LocalStrategy(
    async function (username, password, done) {
        let db_connect = await getDb("kinder-real-estate");
        let user = await db_connect.collection("users").findOne({ username: username });
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        if (!bcrypt.compareSync(password, user.password)) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    }
));

passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(async function (id, done) {
    let db_connect = await getDb("kinder-real-estate");
    let user = await db_connect.collection("users").findOne({ _id: new ObjectId(id) });
    done(null, user);
});

propertyRoutes.route("/api/auth/check").get(function (req, res) {
    if (req.isAuthenticated()) {
        res.json({ isAuthenticated: true });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// Signup route
propertyRoutes.route("/signup").post(async function (req, res) {
    let db_connect = await getDb("kinder-real-estate");
    let hashedPassword = bcrypt.hashSync(req.body.password, 10);
    let user = {
        username: req.body.username,
        password: hashedPassword
    };
    try {
        let result = await db_connect.collection("users").insertOne(user);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

// Login route

propertyRoutes.route("/login").post(function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Authentication failed
            return res.status(401).json({ message: 'Authentication failed' });
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            // Authentication succeeded
            return res.status(200).json({ message: 'Authentication succeeded' });
        });
    })(req, res, next);
});

// Logout route
propertyRoutes.route("/logout").get(asyncHandler(async function (req, res) {
    await req.logout(err => {
        if (err) { return next(err); }
    });
    await res.clearCookie('connect.sid');
    // Send a response indicating that the logout was successful
    res.status(200).json({ message: 'Logout successful' });
}));

// Change password route
propertyRoutes.route("/change-password").post(async function (req, res) {
    let db_connect = await getDb("kinder-real-estate");
    let user = await db_connect.collection("users").findOne({ username: req.body.username });
    if (!user) {
        return res.status(400).json({ message: 'Cannot find user' });
    }
    if (!bcrypt.compareSync(req.body.oldPassword, user.password)) {
        return res.status(400).json({ message: 'Old password is incorrect' });
    }
    let hashedPassword = bcrypt.hashSync(req.body.newPassword, 10);
    let newvalues = { $set: { password: hashedPassword } };
    try {
        let result = await db_connect.collection("users").updateOne({ username: req.body.username }, newvalues);
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

// This section lists of all the properties.
propertyRoutes.route("/properties").get(async function (req, response) {
    let db_connect = await getDb("kinder-real-estate");
    try {
        let res = await db_connect
            .collection("properties")
            .find({})
            .toArray();
        response.json(res);
    } catch (err) {
        console.error(err);
        response.status(500).send(err);
    }
});

// This section gets a single property by id
propertyRoutes.route("/property/:id").get(async function (req, response) {
    let db_connect = await getDb();
    let myquery = { _id: new ObjectId(req.params.id) };
    try {
        let res = await db_connect
            .collection("properties")
            .findOne(myquery);
        response.json(res);
    } catch (err) {
        console.error(err);
        response.status(500).send(err);
    }
});

// This section creates a new property.
propertyRoutes.route("/properties/add").post(async function (req, response) {
    let db_connect = await getDb("kinder-real-estate");
    let myobj = {
        name: req.body.name,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode,
        propertyType: req.body.propertyType,
        rentOrSale: req.body.rentOrSale,
        price: req.body.price,
        bedrooms: req.body.bedrooms,
        bathrooms: req.body.bathrooms,
        squareFeet: req.body.squareFeet,
        lotSize: req.body.lotSize,
        yearBuilt: req.body.yearBuilt,
        description: req.body.description,
        images: req.body.images,
    };
    try {
        let res = await db_connect.collection("properties").insertOne(myobj);
        response.json(res);
    } catch (err) {
        console.error(err);
        response.status(500).send(err);
    }
});

// This section updates a property by id.
propertyRoutes.route("/property/:id").put(async function (req, response) {
    try {
        let db_connect = await getDb();
        let myquery = { _id: new ObjectId(req.params.id) };
        let newvalues = {
            $set: {
                name: req.body.name,
                address: req.body.address,
                city: req.body.city,
                state: req.body.state,
                postalCode: req.body.postalCode,
                propertyType: req.body.propertyType,
                rentOrSale: req.body.rentOrSale,
                price: req.body.price,
                bedrooms: req.body.bedrooms,
                bathrooms: req.body.bathrooms,
                squareFeet: req.body.squareFeet,
                lotSize: req.body.lotSize,
                yearBuilt: req.body.yearBuilt,
                description: req.body.description,
                images: req.body.images,
            },
        };
        let res = await db_connect.collection("properties").updateOne(myquery, newvalues);
        console.log("1 listing updated");
        response.json(res);
    } catch (err) {
        console.error(err);
        response.status(500).send(err);
    }
});

// This section updates the images of a property by id.
propertyRoutes.route("/property/:id/images").put(async function (req, response) {
    try {
        let db_connect = await getDb();
        let myquery = { _id: new ObjectId(req.params.id) };
        let newvalues = {
            $set: {
                images: req.body.images,
            },
        };
        let res = await db_connect.collection("properties").updateOne(myquery, newvalues);
        console.log("Images of 1 listing updated");
        response.json(res);
    } catch (err) {
        console.error(err);
        response.status(500).send(err);
    }
});

// Delete image route
propertyRoutes.route("/delete-image/:library/:publicId").delete(asyncHandler(async function (req, res) {
    try {
        let result = await cloudinary.uploader.destroy(`${req.params.library}/${req.params.publicId}`, {
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME
        });
        console.log(result);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}));

// This section deletes a property
propertyRoutes.route("/property/:id").delete(async (req, response) => {
    let db_connect = await getDb();
    let myquery = { _id: new ObjectId(req.params.id) };
    try {
        let obj = await db_connect.collection("properties").deleteOne(myquery);
        console.log("1 listing deleted");
        response.json(obj);
    } catch (err) {
        console.error(err);
        response.status(500).send(err);
    }
});

// This section searches properties based on multiple search parameters.
propertyRoutes.route("/search").get(async function (req, response) {
    let db_connect = await getDb("kinder-real-estate");
    let searchParams = req.query;
    // Convert numerical search parameters from string to number
    if (searchParams.price) searchParams.price = Number(searchParams.price);
    if (searchParams.bedrooms) searchParams.bedrooms = Number(searchParams.bedrooms);
    if (searchParams.bathrooms) searchParams.bathrooms = Number(searchParams.bathrooms);
    // Construct the query
    let query = {};
    if (searchParams.rentOrSale) query.rentOrSale = searchParams.rentOrSale;
    if (searchParams.city) query.city = searchParams.city;
    if (searchParams.bedrooms) query.bedrooms = searchParams.bedrooms;
    if (searchParams.bathrooms) query.bathrooms = searchParams.bathrooms;
    if (searchParams.price) query.price = searchParams.price;
    // If a keyword is provided, search for it in the name and description fields
    if (searchParams.keyword) {
        query.$or = [
            { name: { $regex: searchParams.keyword, $options: 'i' } },
            { description: { $regex: searchParams.keyword, $options: 'i' } }
        ];
    }
    try {
        let res = await db_connect
            .collection("properties")
            .find(query)
            .toArray();
        response.json(res);
    } catch (err) {
        console.error(err);
        response.status(500).send(err);
    }
});

export default propertyRoutes;
