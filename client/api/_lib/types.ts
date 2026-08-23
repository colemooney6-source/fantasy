import type { IncomingMessage, ServerResponse } from "node:http";

// Minimal shape of what Vercel's Node.js function runtime provides on top of
// plain http req/res. Avoids depending on the full @vercel/node package
// (and its dev-only transitive dependencies) just for two type helpers.
export interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[] | undefined>;
}

export interface VercelResponse extends ServerResponse {
  status(statusCode: number): VercelResponse;
  json(body: unknown): void;
}
