import "dotenv/config";
import express, { Request, Response } from 'express';
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
}

// Middleware
app.use(cors(corsOptions))

app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use(express.json({ limit: '50mb' }))
app.use(express.json());

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/user', userRouter);
app.use('/api/project', projectRouter)

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
