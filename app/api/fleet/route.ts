import { getFleetOverview } from "../../../src/data/fleet";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fleet = await getFleetOverview();
    return Response.json(fleet);
  } catch (error) {
    console.error("Fleet API failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Fleet data is temporarily unavailable." }, { status: 503 });
  }
}
