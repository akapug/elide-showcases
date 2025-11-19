/**
 * Hello API Endpoint
 *
 * Demonstrates a simple API route with multiple HTTP methods.
 */

import { Request, Response } from "elide:http";
import type { RouteContext } from "../../../router.ts";

/**
 * GET /api/hello
 *
 * Returns a simple JSON response
 */
export async function GET(req: Request, ctx: RouteContext) {
  return Response.json({
    message: "Hello from Elide Full-Stack Framework!",
    timestamp: new Date().toISOString(),
    user: ctx.user || null,
    documentation: {
      endpoints: {
        GET: "Get hello message",
        POST: "Echo back your data",
      },
    },
  });
}

/**
 * POST /api/hello
 *
 * Echoes back the request body
 */
export async function POST(req: Request, ctx: RouteContext) {
  try {
    const body = await req.json();

    return Response.json({
      message: "Received your data!",
      echo: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Invalid JSON in request body",
      },
      { status: 400 }
    );
  }
}

/**
 * Configure caching for this route
 */
export const config = {
  cache: {
    maxAge: 60, // Cache for 60 seconds
    swr: 30, // Stale-while-revalidate for 30 seconds
  },
};
