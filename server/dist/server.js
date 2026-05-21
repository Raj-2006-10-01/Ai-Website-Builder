import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { isAllowedOrigin } from "./lib/trustedOrigins.js";
import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectsRoutes.js";
import { stripeWebhook } from "./controllers/stripeWbhook.js";
const app = express();
const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.post("/api/stripe", express.raw({ type: "application/json" }), stripeWebhook);
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json({ limit: "50mb" }));
app.get("/", (_req, res) => {
    res.send("Server is Live!");
});
app.use("/api/user", userRouter);
app.use("/api/project", projectRouter);
export default app;
