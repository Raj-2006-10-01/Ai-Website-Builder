import "dotenv/config";
import express from 'express';
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
const app = express();
const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(',') || [],
    credentials: true,
};
// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.all('/api/auth/{*any}', toNodeHandler(auth));
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Server is Live!');
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
