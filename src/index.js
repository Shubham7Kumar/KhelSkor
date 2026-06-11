import AgentAPI from 'apminsight';
AgentAPI.config();

import express from 'express';
import { matchRouter } from './routes/matches.routes.js';
import http from 'http';
import { attachWebSocketServer } from './ws/server.js';
import { securityMiddleware } from './arcjet.js';
import { commentaryRouter } from './routes/commentary.routes.js';

const app = express();
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';


// As express framework for HTTP it can't handle websocket direclty so we create core nodeJs server

const server = http.createServer(app);

app.use(express.json());
app.use(securityMiddleware());

app.get("/", (req,res) => {
    res.send("Hello from Express Server");
});

app.use("/matches",matchRouter);
app.use("/matches/:id/commentary", commentaryRouter);
const { broadcastMatchCreated, broadcastCommentary } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

server.listen(PORT, HOST, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://127.0.0.1:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server running on ${baseUrl}`);
    console.log(`WebSocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`)
})