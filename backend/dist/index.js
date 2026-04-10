import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRoutes from './routes/authRoutes';
import interviewRoutes from './routes/interviewRoutes';
import { setupWebSocket } from './services/websocketService.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
const server = createServer(app);
const wss = setupWebSocket(server);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    wss.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
    setTimeout(() => process.exit(1), 5000);
});
