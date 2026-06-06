import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

function sendJson(socket,payload) {
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload){
    for(const client of wss.clients){
        if(client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

/*
  *  here we are passing same HTTP server into websocket server as they connect with each other perfectly 

  * as http server will listen on the same port for post and websocket server 

  *  upgrade http on the same request to avoid to running on two different ports 

  *  to make work simple for networking and deployment
*/
export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',     
            // it is string representing the websocket and keeps websocket separate from rest API  
        maxPayload:  1024 * 1024, 
          //  allows single incoming websockets how much size should it have in bytes, it works as security measure against memory absue  
    });

    wss.on('connection', async (socket, req) => {
        if(wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);

                if(decision.isDenied()){
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;

                    const reason = decision.reason.isRateLimit() ? 'Rate Limit exceeded' : 'Access denied';

                    socket.close(code, reason);
                    return;
                }
            } catch (error) {
                console.error('ws connection error', error);
                socket.close(1011, 'Security server error.');  
                return              
            }
        }
        socket.isAlive = true;
        socket.on('pong', () => { socket.isAlive = true; })
        sendJson(socket, { type: "welcome" });
        socket.on('error', console.error);
    });

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if(ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        })
    }, 30000);

    wss.on('close', () => clearInterval(interval));

    
      // clean to used by rest of the app
    function broadcastMatchCreated(match){
        broadcast(wss, { type: 'match_created', data: match })
    }

    return { broadcastMatchCreated }
}