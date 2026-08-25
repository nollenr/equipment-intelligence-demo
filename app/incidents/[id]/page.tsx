import { notFound } from "next/navigation";

import { IncidentInvestigation } from "../../../components/incident-investigation";
import { ProductShell } from "../../../components/product-shell";
import { getAvailableIncidentEvidence, getLatestIncidentAnalysis } from "../../../src/data/analysis";
import { getIncidentById } from "../../../src/data/incidents";

export const dynamic = "force-dynamic";

interface IncidentPageProperties {
  params: Promise<{ id: string }>;
}

export default async function IncidentPage({ params }: IncidentPageProperties) {
  const { id } = await params;
  const incident = await getIncidentById(id);

  if (!incident) {
    notFound();
  }

  const [availableEvidence, latestAnalysis] = await Promise.all([
    getAvailableIncidentEvidence(incident.faultCode, incident.model, incident.equipmentId),
    getLatestIncidentAnalysis(incident.faultEventId),
  ]);

  return (
    <ProductShell activeSection="investigations">
      <IncidentInvestigation
        availableEvidence={availableEvidence}
        incident={incident}
        initialAnalysis={latestAnalysis}
      />
    </ProductShell>
  );
}
