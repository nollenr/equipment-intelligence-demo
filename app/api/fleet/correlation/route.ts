import { createFleetCorrelationAnalysis } from "../../../../src/analysis/fleet-correlation";
import { AnalysisInputError } from "../../../../src/analysis/thermal-derating";
import {
  CANONICAL_B17_EVENT_ID,
  getFleetCorrelationData,
  getLatestFleetCorrelationAnalysis,
} from "../../../../src/data/fleet-correlation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const principalCode = new URL(request.url).searchParams.get("principal") ?? "field-tech-demo";
    const data = await getFleetCorrelationData(CANONICAL_B17_EVENT_ID);
    const latestAnalysis = principalCode === "fleet-engineer-demo"
      ? await getLatestFleetCorrelationAnalysis(CANONICAL_B17_EVENT_ID, principalCode)
      : null;
    return Response.json({
      access: principalCode === "fleet-engineer-demo" ? "engineering_authorized" : "engineering_restricted",
      data,
      latestAnalysis,
    });
  } catch (error) {
    console.error("Fleet correlation load failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Fleet correlation is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      anchorFaultEventId?: unknown;
      principalCode?: unknown;
      question?: unknown;
    };
    const anchorFaultEventId = typeof body.anchorFaultEventId === "string"
      ? body.anchorFaultEventId
      : CANONICAL_B17_EVENT_ID;
    const principalCode = typeof body.principalCode === "string" ? body.principalCode : "";
    const question = typeof body.question === "string" ? body.question : "";
    const analysis = await createFleetCorrelationAnalysis(anchorFaultEventId, question, principalCode);
    return Response.json(analysis, { status: 201 });
  } catch (error) {
    if (error instanceof AnalysisInputError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Fleet correlation analysis failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Fleet correlation analysis is temporarily unavailable." }, { status: 503 });
  }
}
