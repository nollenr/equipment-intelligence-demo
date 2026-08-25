import { AssetInventory } from "../../components/asset-inventory";
import { ProductShell } from "../../components/product-shell";
import { getAssetInventory } from "../../src/data/assets";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const inventory = await getAssetInventory();

  return (
    <ProductShell activeSection="fleet">
      <AssetInventory data={inventory} />
    </ProductShell>
  );
}
