import { getAssetInventory } from "../../../src/data/assets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const inventory = await getAssetInventory();
    return Response.json(inventory);
  } catch (error) {
    console.error("Asset API failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Asset data is temporarily unavailable." }, { status: 503 });
  }
}
