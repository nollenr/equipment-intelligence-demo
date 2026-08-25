import { createIncidentAnalysis } from "../../../../../src/analysis/incident-analysis";
import { AnalysisInputError } from "../../../../../src/analysis/thermal-derating";

export const dynamic = "force-dynamic";

interface AnalysisRouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: AnalysisRouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { question?: unknown };
    const question = typeof body.question === "string" ? body.question : "";
    const analysis = await createIncidentAnalysis(id, question);
    return Response.json(analysis, { status: 201 });
  } catch (error) {
    if (error instanceof AnalysisInputError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Incident analysis failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Analysis is temporarily unavailable." }, { status: 503 });
  }
}
