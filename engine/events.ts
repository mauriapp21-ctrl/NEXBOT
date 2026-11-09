import type { ServerResponse } from "node:http";

/**
 * Buffered Server-Sent Events channel: late subscribers first receive every
 * past event, so a client that connects after the run started misses nothing.
 */
export class EventChannel<T> {
  private readonly history: T[] = [];
  private readonly clients = new Set<ServerResponse>();
  private closed = false;

  publish(event: T) {
    this.history.push(event);
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) client.write(data);
  }

  subscribe(res: ServerResponse) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    for (const event of this.history) res.write(`data: ${JSON.stringify(event)}\n\n`);
    if (this.closed) {
      res.end();
      return;
    }
    this.clients.add(res);
    res.on("close", () => this.clients.delete(res));
  }

  close() {
    this.closed = true;
    for (const client of this.clients) client.end();
    this.clients.clear();
  }
}
