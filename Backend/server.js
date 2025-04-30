import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/coludinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import dashboardRouter from './routes/dashboardRoute.js';
import reportRouter from './routes/reportRoute.js';
import adminRouter from './routes/adminRoute.js';
import reviewRouter from './routes/reviewRoute.js';
import returnRouter from './routes/returnRoute.js';
import chatbotRouter from './routes/chatbotRoute.js';
import { WebSocketServer } from 'ws'; 

// App Config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// api endpoints
app.use('/api/reviews', reviewRouter);
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportRouter);
app.use('/api/returns', returnRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chatbot', chatbotRouter);
app.get('/', (req, res) => {
    res.send('API is working');
});

// Start the server
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// WebSocket Server Setup
const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Function to send updates to all connected clients
export const broadcast = (data) => {
    wss.clients.forEach(client => {
        client.send(JSON.stringify(data));
    });
};