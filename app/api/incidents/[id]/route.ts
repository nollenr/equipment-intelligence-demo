import { getIncidentById } from "../../../../src/data/incidents";

export const dynamic = "force-dynamic";

interface IncidentRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: IncidentRouteContext) {
  try {
    const { id } = await context.params;
    const incident = await getIncidentById(id);

    if (!incident) {
      return Response.json({ error: "Incident not found." }, { status: 404 });
    }

    return Response.json(incident);
  } catch (error) {
    console.error("Incident API failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Incident data is temporarily unavailable." }, { status: 503 });
  }
}
