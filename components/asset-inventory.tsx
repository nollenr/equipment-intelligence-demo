"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AssetInventory as AssetInventoryData, AssetInventoryItem } from "../src/data/types";

interface AssetInventoryProperties {
  data: AssetInventoryData;
}

type SortKey = "asset" | "commissioned" | "facility" | "model" | "status" | "type";
type SortDirection = "asc" | "desc";

const collator = new Intl.Collator("en-US", { numeric: true, sensitivity: "base" });

function displayType(value: string): string {
  const labels: Record<string, string> = {
    solar_inverter: "Solar inverter",
    step_up_transformer: "Step-up transformer",
    tracker_controller: "Tracker controller",
    weather_station: "Weather station",
  };

  return labels[value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayStatus(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function typeAbbreviation(value: string): string {
  const abbreviations: Record<string, string> = {
    solar_inverter: "INV",
    step_up_transformer: "XFM",
    tracker_controller: "TRK",
    weather_station: "WST",
  };

  return abbreviations[value] ?? "EQP";
}

function facilityLabel(value: string): string {
  return value.replace("FPL ", "").replace(" Solar Energy Center", "");
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}

function sortValue(asset: AssetInventoryItem, key: SortKey): string | number {
  switch (key) {
    case "asset":
      return asset.equipmentCode;
    case "commissioned":
      return asset.commissionedOn ?? "";
    case "facility":
      return asset.plantName;
    case "model":
      return `${asset.manufacturer} ${asset.model}`;
    case "status": {
      const priority: Record<string, number> = { derated: 0, maintenance: 1, normal: 2 };
      return priority[asset.operatingStatus] ?? 3;
    }
    case "type":
      return displayType(asset.equipmentType);
  }
}

function compareAssets(left: AssetInventoryItem, right: AssetInventoryItem, key: SortKey): number {
  const leftValue = sortValue(left, key);
  const rightValue = sortValue(right, key);

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return leftValue - rightValue;
  }

  const primary = collator.compare(String(leftValue), String(rightValue));
  return primary || collator.compare(left.equipmentCode, right.equipmentCode);
}

function SortButton({
  activeKey,
  direction,
  label,
  onSort,
  sortKey,
}: {
  activeKey: SortKey;
  direction: SortDirection;
  label: string;
  onSort: (key: SortKey) => void;
  sortKey: SortKey;
}) {
  const isActive = activeKey === sortKey;

  return (
    <button
      aria-label={`Sort by ${label}${isActive ? `, currently ${direction === "asc" ? "ascending" : "descending"}` : ""}`}
      className={isActive ? "asset-sort-button active" : "asset-sort-button"}
      onClick={() => onSort(sortKey)}
      type="button"
    >
      {label}
      <span aria-hidden="true">{isActive ? (direction === "asc" ? "↑" : "↓") : "↕"}</span>
    </button>
  );
}

export function AssetInventory({ data }: AssetInventoryProperties) {
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [sortKey, setSortKey] = useState<SortKey>("facility");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const facilities = useMemo(() => {
    const byId = new Map<string, AssetInventoryItem>();
    for (const asset of data.assets) {
      byId.set(asset.plantId, asset);
    }
    return Array.from(byId.values()).sort((left, right) => collator.compare(left.plantName, right.plantName));
  }, [data.assets]);

  const equipmentTypes = useMemo(
    () => Array.from(new Set(data.assets.map((asset) => asset.equipmentType))).sort((left, right) =>
      collator.compare(displayType(left), displayType(right)),
    ),
    [data.assets],
  );

  const statusValues = useMemo(
    () => Array.from(new Set(data.assets.map((asset) => asset.operatingStatus))).sort(collator.compare),
    [data.assets],
  );

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const assets = data.assets.filter((asset) => {
      const matchesFacility = facilityFilter === "all" || asset.plantId === facilityFilter;
      const matchesType = typeFilter === "all" || asset.equipmentType === typeFilter;
      const matchesStatus = statusFilter === "all" || asset.operatingStatus === statusFilter;
      const searchable = [
        asset.equipmentCode,
        asset.equipmentName,
        asset.manufacturer,
        asset.model,
        asset.plantName,
        asset.serialNumber,
      ].join(" ").toLowerCase();

      return matchesFacility && matchesType && matchesStatus && (!normalizedSearch || searchable.includes(normalizedSearch));
    });

    return assets.sort((left, right) => {
      const result = compareAssets(left, right, sortKey);
      return sortDirection === "asc" ? result : -result;
    });
  }, [data.assets, facilityFilter, searchTerm, sortDirection, sortKey, statusFilter, typeFilter]);

  const watchCount = data.assets.filter((asset) => asset.operatingStatus !== "normal").length;

  function handleSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  function resetFilters() {
    setFacilityFilter("all");
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
  }

  return (
    <div className="page-stack assets-page">
      <div className="breadcrumbs">
        <Link href="/fleet">Fleet</Link>
        <span>/</span>
        <strong>Monitored assets</strong>
      </div>

      <section className="page-heading-row">
        <div>
          <span className="eyebrow">Operations / Asset inventory</span>
          <h1>Monitored assets</h1>
          <p>Search, filter, and sort the connected equipment modeled across the fleet.</p>
        </div>
        <div className="refresh-state">
          <span className="live-indicator"><span /> Live</span>
          <span>
            <small>Last refreshed</small>
            <strong>{formatTimestamp(data.refreshedAt)}</strong>
          </span>
        </div>
      </section>

      <section className="asset-summary-grid" aria-label="Asset inventory summary">
        <article><span>Total assets</span><strong>{data.assets.length}</strong><small>Connected equipment</small></article>
        <article><span>Facilities</span><strong>{facilities.length}</strong><small>Florida solar sites</small></article>
        <article><span>Asset types</span><strong>{equipmentTypes.length}</strong><small>Modeled equipment classes</small></article>
        <article className="asset-summary-watch"><span>On watch</span><strong>{watchCount}</strong><small>Derated or maintenance</small></article>
      </section>

      <section className="section-block asset-inventory-block">
        <div className="section-heading asset-inventory-heading">
          <div>
            <span className="eyebrow">Connected equipment</span>
            <h2>Fleet asset register</h2>
          </div>
          <span className="section-note">Live from CockroachDB</span>
        </div>

        <div className="asset-filter-bar">
          <label className="asset-search-field">
            <span>Search assets</span>
            <input
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Code, model, serial, manufacturer…"
              type="search"
              value={searchTerm}
            />
          </label>
          <label>
            <span>Facility</span>
            <select onChange={(event) => setFacilityFilter(event.target.value)} value={facilityFilter}>
              <option value="all">All facilities</option>
              {facilities.map((facility) => (
                <option key={facility.plantId} value={facility.plantId}>{facilityLabel(facility.plantName)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Asset type</span>
            <select onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
              <option value="all">All asset types</option>
              {equipmentTypes.map((equipmentType) => (
                <option key={equipmentType} value={equipmentType}>{displayType(equipmentType)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">All statuses</option>
              {statusValues.map((status) => (
                <option key={status} value={status}>{displayStatus(status)}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="asset-results-meta">
          <span><strong>{filteredAssets.length}</strong> of {data.assets.length} assets</span>
          <span>Select a column heading to sort.</span>
          {(facilityFilter !== "all" || typeFilter !== "all" || statusFilter !== "all" || searchTerm) ? (
            <button onClick={resetFilters} type="button">Clear filters</button>
          ) : null}
        </div>

        <div className="asset-table-scroll">
          <table className="asset-table">
            <thead>
              <tr>
                <th><SortButton activeKey={sortKey} direction={sortDirection} label="Asset" onSort={handleSort} sortKey="asset" /></th>
                <th><SortButton activeKey={sortKey} direction={sortDirection} label="Facility" onSort={handleSort} sortKey="facility" /></th>
                <th><SortButton activeKey={sortKey} direction={sortDirection} label="Asset type" onSort={handleSort} sortKey="type" /></th>
                <th><SortButton activeKey={sortKey} direction={sortDirection} label="Manufacturer / model" onSort={handleSort} sortKey="model" /></th>
                <th><SortButton activeKey={sortKey} direction={sortDirection} label="Status" onSort={handleSort} sortKey="status" /></th>
                <th><SortButton activeKey={sortKey} direction={sortDirection} label="Commissioned" onSort={handleSort} sortKey="commissioned" /></th>
                <th>Latest activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.equipmentId}>
                  <td>
                    <span className={`asset-type-icon type-${asset.equipmentType}`}>{typeAbbreviation(asset.equipmentType)}</span>
                    <span className="asset-table-primary">
                      <strong>{asset.equipmentCode}</strong>
                      <small>{asset.equipmentName} · {asset.serialNumber}</small>
                    </span>
                  </td>
                  <td>
                    <span className="asset-table-primary">
                      <strong>{facilityLabel(asset.plantName)}</strong>
                      <small>{asset.plantCode}</small>
                    </span>
                  </td>
                  <td><span className="asset-type-pill">{displayType(asset.equipmentType)}</span></td>
                  <td>
                    <span className="asset-table-primary">
                      <strong>{asset.model}</strong>
                      <small>{asset.manufacturer}</small>
                    </span>
                  </td>
                  <td><span className={`asset-operating-status status-${asset.operatingStatus}`}><i />{displayStatus(asset.operatingStatus)}</span></td>
                  <td>{formatDate(asset.commissionedOn)}</td>
                  <td>
                    {asset.faultEventId && asset.faultCode ? (
                      <Link className="asset-activity-link" href={`/incidents/${asset.faultEventId}`}>
                        <strong>{asset.faultCode}</strong>
                        <span>{asset.eventStatus ? displayStatus(asset.eventStatus) : "Recorded"} →</span>
                      </Link>
                    ) : (
                      <span className="no-activity">No recorded incidents</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="asset-empty-result">
            <strong>No assets match those filters.</strong>
            <button onClick={resetFilters} type="button">Reset the asset register</button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
