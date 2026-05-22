import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { isAllowedOrigin } from "./lib/trustedOrigins.js";
import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectsRoutes.js";
import { stripeWebhook } from "./controllers/stripeWbhook.js";

const app = express();

const corsOptions = {
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
};

app.use(cors(corsOptions));

// Stripe webhook must be before JSON parsing
app.post("/api/stripe", express.raw({ type: "application/json" }), stripeWebhook);

// Better Auth routes - handle all auth paths
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json({ limit: "50mb" }));

app.get("/", (_req: Request, res: Response) => {
    res.send("Server is Live!");
});

app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
});

app.use("/api/user", userRouter);
app.use("/api/project", projectRouter);

// Error handling middleware
app.use((err: any, _req: Request, res: Response) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
});

export default app;