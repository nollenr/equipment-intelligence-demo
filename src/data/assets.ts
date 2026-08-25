import { getApplicationPool } from "../database";
import { assetInventoryQuery } from "../queries";
import type { AssetInventory, AssetInventoryItem } from "./types";

interface AssetInventoryRow {
  commissioned_on: Date | string | null;
  equipment_code: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  event_status: string | null;
  event_time: Date | null;
  fault_code: string | null;
  fault_event_id: string | null;
  fault_name: string | null;
  firmware_version: string | null;
  manufacturer: string;
  model: string;
  operating_status: string;
  plant_code: string;
  plant_id: string;
  plant_name: string;
  serial_number: string;
  state_code: string | null;
}

function dateOnly(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

export async function getAssetInventory(): Promise<AssetInventory> {
  const pool = getApplicationPool();
  const result = await pool.query<AssetInventoryRow>(assetInventoryQuery);

  const assets: AssetInventoryItem[] = result.rows.map((asset) => ({
    commissionedOn: dateOnly(asset.commissioned_on),
    equipmentCode: asset.equipment_code,
    equipmentId: asset.equipment_id,
    equipmentName: asset.equipment_name,
    equipmentType: asset.equipment_type,
    eventStatus: asset.event_status,
    eventTime: asset.event_time?.toISOString() ?? null,
    faultCode: asset.fault_code,
    faultEventId: asset.fault_event_id,
    faultName: asset.fault_name,
    firmwareVersion: asset.firmware_version,
    manufacturer: asset.manufacturer,
    model: asset.model,
    operatingStatus: asset.operating_status,
    plantCode: asset.plant_code,
    plantId: asset.plant_id,
    plantName: asset.plant_name,
    serialNumber: asset.serial_number,
    stateCode: asset.state_code,
  }));

  return {
    assets,
    refreshedAt: new Date().toISOString(),
  };
}
