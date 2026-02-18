import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { verifyToken, getUserFromToken } from "./trustlayer-sso";
import { db } from "./db";
import { chatMessages, chatUsers, chatChannels } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

interface AuthenticatedClient {
  ws: WebSocket;
  userId: string;
  username: string;
  avatarColor: string;
  role: string;
  channelId: string | null;
}

const clients = new Map<WebSocket, AuthenticatedClient>();

function broadcast(channelId: string, data: any, exclude?: WebSocket) {
  const msg = JSON.stringify(data);
  Array.from(clients.entries()).forEach(([ws, client]) => {
    if (client.channelId === channelId && ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

function getPresence(): { onlineCount: number; channelUsers: Record<string, string[]> } {
  const channelUsers: Record<string, string[]> = {};
  Array.from(clients.values()).forEach((client) => {
    if (client.channelId) {
      if (!channelUsers[client.channelId]) channelUsers[client.channelId] = [];
      if (!channelUsers[client.channelId].includes(client.username)) {
        channelUsers[client.channelId].push(client.username);
      }
    }
  });
  return { onlineCount: clients.size, channelUsers };
}

function broadcastPresence() {
  const presence = getPresence();
  const msg = JSON.stringify({ type: "presence", ...presence });
  Array.from(clients.entries()).forEach(([ws]) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

async function getChannelHistory(channelId: string, limit = 50) {
  const msgs = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.channelId, channelId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  const enriched = await Promise.all(
    msgs.reverse().map(async (m) => {
      const [user] = await db.select().from(chatUsers).where(eq(chatUsers.id, m.userId));
      return {
        id: m.id,
        channelId: m.channelId,
        userId: m.userId,
        username: user?.username || "Unknown",
        avatarColor: user?.avatarColor || "#06b6d4",
        role: user?.role || "member",
        content: m.content,
        replyToId: m.replyToId,
        createdAt: m.createdAt,
      };
    })
  );

  return enriched;
}

export function setupChatWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/chat" });

  wss.on("connection", (ws) => {
    ws.on("message", async (raw) => {
      try {
        const data = JSON.parse(raw.toString());

        switch (data.type) {
          case "join": {
            const token = data.token;
            if (!token) {
              ws.send(JSON.stringify({ type: "error", message: "Token required" }));
              return;
            }

            const user = await getUserFromToken(token);
            if (!user) {
              ws.send(JSON.stringify({ type: "error", message: "Invalid or expired token" }));
              return;
            }

            const channelId = data.channelId || null;

            clients.set(ws, {
              ws,
              userId: user.id,
              username: user.username,
              avatarColor: user.avatarColor,
              role: user.role,
              channelId,
            });

            await db.update(chatUsers).set({ isOnline: true, lastSeen: new Date() }).where(eq(chatUsers.id, user.id));

            if (channelId) {
              const history = await getChannelHistory(channelId);
              ws.send(JSON.stringify({ type: "history", messages: history }));

              broadcast(channelId, { type: "user_joined", userId: user.id, username: user.username }, ws);
            }

            broadcastPresence();
            break;
          }

          case "switch_channel": {
            const client = clients.get(ws);
            if (!client) return;

            const oldChannel = client.channelId;
            const newChannel = data.channelId;

            if (oldChannel) {
              broadcast(oldChannel, { type: "user_left", userId: client.userId, username: client.username }, ws);
            }

            client.channelId = newChannel;
            clients.set(ws, client);

            const history = await getChannelHistory(newChannel);
            ws.send(JSON.stringify({ type: "history", messages: history }));

            broadcast(newChannel, { type: "user_joined", userId: client.userId, username: client.username }, ws);
            broadcastPresence();
            break;
          }

          case "message": {
            const client = clients.get(ws);
            if (!client || !client.channelId) return;

            let content = (data.content || "").trim();
            if (!content || content.length > 2000) return;

            const [saved] = await db.insert(chatMessages).values({
              channelId: client.channelId,
              userId: client.userId,
              content,
              replyToId: data.replyToId || null,
            }).returning();

            const messagePayload = {
              type: "message",
              id: saved.id,
              channelId: saved.channelId,
              userId: client.userId,
              username: client.username,
              avatarColor: client.avatarColor,
              role: client.role,
              content: saved.content,
              replyToId: saved.replyToId,
              createdAt: saved.createdAt,
            };

            broadcast(client.channelId, messagePayload);
            break;
          }

          case "typing": {
            const client = clients.get(ws);
            if (!client || !client.channelId) return;
            broadcast(client.channelId, { type: "typing", userId: client.userId, username: client.username }, ws);
            break;
          }
        }
      } catch (err) {
        console.error("[Chat WS] Error:", err);
      }
    });

    ws.on("close", async () => {
      const client = clients.get(ws);
      if (client) {
        if (client.channelId) {
          broadcast(client.channelId, { type: "user_left", userId: client.userId, username: client.username });
        }
        await db.update(chatUsers).set({ isOnline: false, lastSeen: new Date() }).where(eq(chatUsers.id, client.userId)).catch(() => {});
        clients.delete(ws);
        broadcastPresence();
      }
    });
  });

  console.log("[Chat WS] WebSocket server attached at /ws/chat");
}
