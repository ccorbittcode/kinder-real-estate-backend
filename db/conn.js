import { MongoClient } from "mongodb";

let _db;

export default async function connectToServer() {
    const Db = process.env.MONGODB_URI;
    const client = new MongoClient(Db, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false
    });

    try {
        const db = await client.connect();
        // Verify we got a good "db" object
        if (db) {
            _db = db.db("kinder-real-estate");
            console.log("Successfully connected to MongoDB.");
        }
        return _db;
    } catch (err) {
        console.error("Failed to connect to the database", err);
        throw err;
    }
}

export async function getDb() {
    return _db;
}
