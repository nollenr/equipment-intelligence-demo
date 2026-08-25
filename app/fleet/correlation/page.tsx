import { cookies } from "next/headers";

import { FleetCorrelation } from "../../../components/fleet-correlation";
import { ProductShell } from "../../../components/product-shell";
import {
  CANONICAL_B17_EVENT_ID,
  getFleetCorrelationData,
  getLatestFleetCorrelationAnalysis,
} from "../../../src/data/fleet-correlation";
import { DEMO_ROLE_COOKIE, normalizeDemoRole } from "../../../src/persona";

export const dynamic = "force-dynamic";

interface FleetCorrelationPageProperties {
  searchParams: Promise<{ question?: string | string[]; run?: string | string[] }>;
}

function firstParameter(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FleetCorrelationPage({ searchParams }: FleetCorrelationPageProperties) {
  const cookieStore = await cookies();
  const role = normalizeDemoRole(cookieStore.get(DEMO_ROLE_COOKIE)?.value);
  const parameters = await searchParams;
  const requestedQuestion = firstParameter(parameters.question)?.trim().slice(0, 1000) || undefined;
  const autoRun = firstParameter(parameters.run) === "1" && requestedQuestion !== undefined;
  const data = await getFleetCorrelationData(CANONICAL_B17_EVENT_ID);
  const initialAnalysis = role === "fleet-engineer" && !requestedQuestion
    ? await getLatestFleetCorrelationAnalysis(CANONICAL_B17_EVENT_ID, "fleet-engineer-demo")
    : null;

  return (
    <ProductShell activeSection="fleet">
      <FleetCorrelation
        autoRun={autoRun}
        data={data}
        initialAnalysis={initialAnalysis}
        initialQuestion={requestedQuestion}
        key={`${role}:${requestedQuestion ?? "default"}`}
        role={role}
      />
    </ProductShell>
  );
}
