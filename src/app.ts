import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler } from './middleware/error';
import router from './routes';

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use('/api', router);
app.use(errorHandler);
