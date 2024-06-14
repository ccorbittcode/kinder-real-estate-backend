import { MongoClient } from "mongodb";
import { HttpsProxyAgent } from "https-proxy-agent";

let _db;

export default async function connectToServer() {
    const Db = process.env.VITE_ATLAS_URI;
    //configuring the proxy agent
    const proxyAgent = new HttpsProxyAgent(process.env.QUOTAGUARDSTATIC_URL);
    const client = new MongoClient(Db, {proxyOptions: { agent: proxyAgent } });

    try {
        const db = await client.connect();
        // Verify we got a good "db" object
        if (db) {
            _db = db.db("kinder-real-estate");
            console.log("Successfully connected to MongoDB.");
        }
        return _db;
    } catch (err) {
        throw err;
    }
}

export async function getDb() {
    return _db;
}
