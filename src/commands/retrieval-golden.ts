import { createPool } from "../database.js";
import { createEmbeddings } from "../openai/embeddings.js";
import { searchAuthorizedEvidence } from "../retrieval/vector.js";

interface GoldenCase {
  expectedDocumentCode: string;
  forbiddenDocumentCodes: string[];
  mustRankFirst: boolean;
  name: string;
  principalCode: string;
  question: string;
}

const goldenCases: GoldenCase[] = [
  {
    expectedDocumentCode: "OEM-HPS-2500X-OM",
    forbiddenDocumentCodes: ["FLEET-B17-HIGH-AMBIENT"],
    name: "field root-cause question",
    mustRankFirst: true,
    principalCode: "field-tech-demo",
    question: "Why did inverter INV-042 enter a derated state after fault B17?",
  },
  {
    expectedDocumentCode: "SITE-MAN-COOLING-INSPECTION",
    forbiddenDocumentCodes: ["FLEET-B17-HIGH-AMBIENT"],
    name: "field inspection question",
    mustRankFirst: true,
    principalCode: "field-tech-demo",
    question: "What should I inspect before I reset the B17 event on this inverter?",
  },
  {
    expectedDocumentCode: "FLEET-B17-HIGH-AMBIENT",
    forbiddenDocumentCodes: [],
    name: "engineer fleet-pattern question",
    mustRankFirst: true,
    principalCode: "fleet-engineer-demo",
    question: "Across the fleet, did high ambient temperature increase the frequency of B17 events?",
  },
  {
    expectedDocumentCode: "OEM-HPS-2500X-OM",
    forbiddenDocumentCodes: ["FLEET-B17-HIGH-AMBIENT"],
    name: "field permission-boundary question",
    mustRankFirst: true,
    principalCode: "field-tech-demo",
    question: "Across the fleet, did high ambient temperature increase the frequency of B17 events?",
  },
  {
    expectedDocumentCode: "OEM-SD-8400-COOLING",
    forbiddenDocumentCodes: ["FLEET-B17-HIGH-AMBIENT"],
    mustRankFirst: true,
    name: "A12 definition question",
    principalCode: "field-tech-demo",
    question: "Why did SD-8400 inverter INV-102 enter Maintenance Hold after fault A12 fan feedback variance?",
  },
  {
    expectedDocumentCode: "SITE-BAB-FAN-INSPECTION",
    forbiddenDocumentCodes: ["FLEET-B17-HIGH-AMBIENT"],
    mustRankFirst: true,
    name: "A12 field inspection question",
    principalCode: "field-tech-demo",
    question: "What exterior fan-system inspection should I perform at Babcock Ranch for fault A12?",
  },
  {
    expectedDocumentCode: "CHECKLIST-INV-RETURN-SERVICE",
    forbiddenDocumentCodes: ["FLEET-B17-HIGH-AMBIENT"],
    mustRankFirst: true,
    name: "A12 maintenance-release question",
    principalCode: "field-tech-demo",
    question: "What criteria are required to release an SD-8400 inverter from A12 Maintenance Hold?",
  },
  {
    expectedDocumentCode: "OEM-TRC8-POSITION",
    forbiddenDocumentCodes: ["FLEET-B17-HIGH-AMBIENT"],
    mustRankFirst: true,
    name: "P09 definition question",
    principalCode: "field-tech-demo",
    question: "According to the TRC-8 operations and fault response manual, what does fault P09 position deviation mean and what component failure does it not prove?",
  },
  {
    expectedDocumentCode: "SITE-CIT-TRACKER-INSPECTION",
    forbiddenDocumentCodes: ["FLEET-B17-HIGH-AMBIENT"],
    mustRankFirst: true,
    name: "P09 tracker-row inspection question",
    principalCode: "field-tech-demo",
    question: "What should I inspect from outside the movement envelope at Citrus for tracker fault P09?",
  },
  {
    expectedDocumentCode: "CHECKLIST-TRK-RETURN-AUTO",
    forbiddenDocumentCodes: ["FLEET-B17-HIGH-AMBIENT"],
    mustRankFirst: true,
    name: "P09 return-to-automatic question",
    principalCode: "field-tech-demo",
    question: "What criteria are required to return a TRC-8 tracker row from P09 Safe Stow Hold to Automatic Tracking?",
  },
];

const pool = createPool("nextera-checkpoint3-golden-retrieval");

try {
  const batch = await createEmbeddings(goldenCases.map((testCase) => testCase.question));
  const results = [];

  for (const [index, testCase] of goldenCases.entries()) {
    const evidence = await searchAuthorizedEvidence(pool, batch.vectors[index]!, testCase.principalCode, 3);
    const codes = evidence.map((source) => source.documentCode);
    const forbidden = testCase.forbiddenDocumentCodes.filter((code) => codes.includes(code));
    const topDocumentCode = evidence[0]?.documentCode ?? null;
    const expectedPresent = testCase.mustRankFirst
      ? topDocumentCode === testCase.expectedDocumentCode
      : codes.includes(testCase.expectedDocumentCode);
    const passed = expectedPresent && forbidden.length === 0;

    results.push({
      name: testCase.name,
      passed,
      principalCode: testCase.principalCode,
      rankings: evidence.map((source) => ({
        cosineDistance: Number(source.cosineDistance?.toFixed(6)),
        documentCode: source.documentCode,
        rank: source.retrievalRank,
        scopeCode: source.scopeCode,
      })),
    });
  }

  console.log(JSON.stringify({ model: batch.model, results, totalTokens: batch.totalTokens }, null, 2));
  if (results.some((result) => !result.passed)) {
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}
