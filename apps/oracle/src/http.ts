import type { OracleStore } from "./db/store";

export function startHealthServer(store: OracleStore, port: number, streamKeys: string[]) {
  return Bun.serve({
    port,
    fetch(request: Request) {
      const url = new URL(request.url);
      if (url.pathname === "/healthz" || url.pathname === "/readyz") {
        return Response.json(store.health(streamKeys));
      }

      return new Response("Not Found", { status: 404 });
    }
  });
}
