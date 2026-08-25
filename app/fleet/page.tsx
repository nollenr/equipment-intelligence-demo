import { FleetOverview } from "../../components/fleet-overview";
import { ProductShell } from "../../components/product-shell";
import { getFleetOverview } from "../../src/data/fleet";

export const dynamic = "force-dynamic";

export default async function FleetPage() {
  const fleet = await getFleetOverview();

  return (
    <ProductShell activeSection="fleet">
      <FleetOverview data={fleet} />
    </ProductShell>
  );
}
