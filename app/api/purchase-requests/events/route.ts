import { NextRequest } from "next/server";

// Store for connected clients
const clients = new Set<ReadableStreamDefaultController>();

// Function to notify all connected clients
export function notifyPRChange() {
  const message = `data: ${JSON.stringify({ type: "pr-change", timestamp: Date.now() })}\n\n`;
  clients.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch {
      clients.delete(controller);
    }
  });
}

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      
      // Send initial connection message
      const message = `data: ${JSON.stringify({ type: "connected" })}\n\n`;
      controller.enqueue(new TextEncoder().encode(message));
      
      // Heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const ping = `data: ${JSON.stringify({ type: "ping" })}\n\n`;
          controller.enqueue(new TextEncoder().encode(ping));
        } catch {
          clearInterval(heartbeat);
          clients.delete(controller);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clients.delete(controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
