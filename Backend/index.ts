import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import leadRoutes from './routes/leadRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';

dotenv.config();
const app = express();

// Middleware order is important
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

console.log("Hello, World!");