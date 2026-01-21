import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

dotenv.config();
const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.use("/api/auth",authRoutes);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

console.log("Hello, World!");