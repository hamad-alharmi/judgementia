export type EvidenceType = "state_log" | "forensic_file" | "financial_trail";
export type EvidenceImplicates = "prosecution" | "defense" | "ambiguous";

export interface EvidencePiece {
  id: string;
  name: string;
  description: string;
  type: EvidenceType;
  implicates: EvidenceImplicates;
}

export interface CrimeScenario {
  id: string;
  title: string;
  charge: string;
  synopsis: string;
  evidenceSummary: string;
  severity: "felony" | "capital";
  evidence: readonly EvidencePiece[];
}

export const CRIME_SCENARIOS: readonly CrimeScenario[] = [
  {
    id: "scenario-001",
    title: "The Rogue Auditor Case",
    charge: "Aggravated Computer Intrusion & Data Exfiltration",
    synopsis:
      "Lead compliance auditor Alex Mercer is accused of using privileged root credentials to siphon 14TB of sealed ledger data from a sovereign wealth custodian during a maintenance window.",
    evidenceSummary:
      "Terminal authentication logs, internal whistleblower chat leaks, and a post-breach cryptocurrency transfer.",
    severity: "felony",
    evidence: [
      {
        id: "ev-001-a",
        name: "Decrypted Terminal Log 03:44 AM",
        description:
          "Forensic reconstruction shows the defendant's unique root SSH key authenticating into the core production mainframe, initiating a bulk export job to an external staging bucket.",
        type: "state_log",
        implicates: "prosecution",
      },
      {
        id: "ev-001-b",
        name: "Internal Slack Leak",
        description:
          "Encrypted chat logs recovered from #risk-ops show the defendant warned executives about systemic vulnerabilities 24 hours before the breach—suggesting foreknowledge or a defensive motive.",
        type: "forensic_file",
        implicates: "defense",
      },
      {
        id: "ev-001-c",
        name: "Offshore Crypto Wallet Transfer",
        description:
          "Blockchain analysis traces 50 ETH moved from a mixer wallet to an unverified node within six minutes of the exfiltration window; wallet metadata partially matches the defendant's hardware token seed phrase hash.",
        type: "financial_trail",
        implicates: "ambiguous",
      },
    ],
  },
  {
    id: "scenario-002",
    title: "Operation Black Docket",
    charge: "Conspiracy to Obstruct Federal Cyber Inquiry",
    synopsis:
      "Corporate counsel at Nexus Arbitration LLC allegedly orchestrated synchronized deletion of e-discovery archives ahead of a federal grand jury subpoena on RICO predicate acts.",
    evidenceSummary:
      "WORM storage audit gaps, VPN session overlap maps, and shredded-cloud retention invoices.",
    severity: "felony",
    evidence: [
      {
        id: "ev-002-a",
        name: "WORM Storage Erasure Manifest",
        description:
          "Immutable audit logs show privileged service accounts purging 2.3 million objects tagged GRAND_JURY_HOLD between 01:12 and 01:47 UTC—credentials mapped to the defendant's federated SSO profile.",
        type: "state_log",
        implicates: "prosecution",
      },
      {
        id: "ev-002-b",
        name: "After-Hours VPN Overlap Map",
        description:
          "NetFlow data correlates the defendant's home IP with three junior associates during the purge window, but geolocation jitter suggests possible session hijacking from a contractor VPN pool.",
        type: "forensic_file",
        implicates: "ambiguous",
      },
      {
        id: "ev-002-c",
        name: "Retention Vendor Invoice Chain",
        description:
          "Invoices for emergency shredding services were approved by the defendant, yet wire confirmation emails include a forwarded thread where outside counsel advised preservation under FRCP 37(e).",
        type: "financial_trail",
        implicates: "defense",
      },
    ],
  },
  {
    id: "scenario-003",
    title: "The Harrowfield Protocol",
    charge: "Wire Fraud & Negligent Homicide via Suppressed Trial Data",
    synopsis:
      "Pharma CTO Dr. Lian Harrowfield stands accused of knowingly withholding fatal Phase III telemetry from regulators while accelerating a $40B blockbuster approval pipeline.",
    evidenceSummary:
      "Redacted mortality dashboards, whistleblower deposition hashes, and offshore licensing payments.",
    severity: "capital",
    evidence: [
      {
        id: "ev-003-a",
        name: "Redacted Mortality Dashboard v4.2",
        description:
          "Recovered Tableau exports show a 340% spike in hepatic failure events post-dose; metadata proves the defendant exported the file then applied a classification label LEGAL_PRIVILEGE within nine minutes.",
        type: "forensic_file",
        implicates: "prosecution",
      },
      {
        id: "ev-003-b",
        name: "Whistleblower Deposition Hash Match",
        description:
          "A sealed deposition transcript (SHA-256 verified) describes the defendant instructing biostatisticians to 'smooth the tail risk'—language the defense argues is standard sensitivity analysis jargon.",
        type: "state_log",
        implicates: "ambiguous",
      },
      {
        id: "ev-003-c",
        name: "Offshore Licensing Royalty Trail",
        description:
          "SWIFT records show $12M routed to a Cayman SPV controlled by the defendant's spouse two days before FDA fast-track approval; defense claims routine IP monetization unrelated to trial data.",
        type: "financial_trail",
        implicates: "prosecution",
      },
    ],
  },
  {
    id: "scenario-004",
    title: "Silent Witness 14",
    charge: "Witness Intimidation in a RICO Matter",
    synopsis:
      "Defense alleges mistaken identity; prosecution claims the defendant orchestrated surveillance and coercion against a cooperating insider.",
    evidenceSummary:
      "Burner phone pings, surveillance stills, and financial transfers routed through shell entities within hours of key testimony.",
    severity: "felony",
    evidence: [],
  },
  {
    id: "scenario-005",
    title: "The Apex Arbitration Fraud",
    charge: "International Securities Fraud",
    synopsis:
      "Traders allegedly fabricated arbitration awards to move distressed sovereign debt through offshore settlement pipelines.",
    evidenceSummary:
      "Forged tribunal seals, mismatched SWIFT confirmations, and algorithmic trade bursts timed to falsified award releases.",
    severity: "felony",
    evidence: [],
  },
  {
    id: "scenario-006",
    title: "Crown v. Ashford",
    charge: "High Treason — Compromise of Classified Counsel",
    synopsis:
      "A senior barrister is accused of leaking sealed strategic litigation briefs to a hostile state procurement agency.",
    evidenceSummary:
      "Steganographic email attachments, diplomatic cable intercepts, and cryptographic proof of exfiltration from a SCIF-adjacent workstation.",
    severity: "capital",
    evidence: [],
  },
  {
    id: "scenario-007",
    title: "The Night Clerk Affair",
    charge: "Judicial Bribery and Extortion",
    synopsis:
      "A court clerk allegedly sold advance notice of injunction rulings to private equity litigants during hostile takeover seasons.",
    evidenceSummary:
      "Cash deposit patterns, altered docket timestamps, and recorded conversations referencing pre-ruling market positioning.",
    severity: "felony",
    evidence: [],
  },
  {
    id: "scenario-008",
    title: "Project Iron Verdict",
    charge: "Weapons-Grade Material Diversion",
    synopsis:
      "Defense contractors face allegations of diverting export-controlled components to unauthorized third-party foundries.",
    evidenceSummary:
      "Bill of lading discrepancies, radiation signature tests, and intercepted freight manifests bearing falsified end-user certificates.",
    severity: "felony",
    evidence: [],
  },
] as const;

const FALLBACK_SCENARIO: CrimeScenario = CRIME_SCENARIOS[0] ?? {
  id: "scenario-fallback",
  title: "Emergency Docket",
  charge: "Unspecified Felony",
  synopsis: "A sealed matter brought before the court under extraordinary jurisdiction.",
  evidenceSummary: "Classified exhibits pending review.",
  severity: "felony",
  evidence: [],
};

export function getScenarioById(id: string): CrimeScenario | null {
  const found = CRIME_SCENARIOS.find((s) => s.id === id);
  return found ?? null;
}

export function pickRandomScenario(): CrimeScenario {
  const cyberPool = CRIME_SCENARIOS.filter((s) => s.evidence.length === 3);
  const pool = cyberPool.length > 0 ? cyberPool : [...CRIME_SCENARIOS];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? FALLBACK_SCENARIO;
}

export function formatScenarioForRoom(scenario: CrimeScenario): string {
  return JSON.stringify({
    id: scenario.id,
    title: scenario.title,
    charge: scenario.charge,
    synopsis: scenario.synopsis,
    evidenceSummary: scenario.evidenceSummary,
    severity: scenario.severity,
    evidence: scenario.evidence,
  });
}

function isEvidencePiece(value: unknown): value is EvidencePiece {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.description === "string" &&
    (record.type === "state_log" ||
      record.type === "forensic_file" ||
      record.type === "financial_trail") &&
    (record.implicates === "prosecution" ||
      record.implicates === "defense" ||
      record.implicates === "ambiguous")
  );
}

export function parseScenarioFromRoom(raw: string): CrimeScenario | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    if (
      typeof record.id !== "string" ||
      typeof record.title !== "string" ||
      typeof record.charge !== "string" ||
      typeof record.synopsis !== "string" ||
      typeof record.evidenceSummary !== "string" ||
      typeof record.severity !== "string"
    ) {
      return null;
    }

    const catalog = getScenarioById(record.id);
    let evidence: EvidencePiece[] = [];

    if (Array.isArray(record.evidence)) {
      evidence = record.evidence.filter(isEvidencePiece);
    }
    if (evidence.length !== 3 && catalog?.evidence.length === 3) {
      evidence = [...catalog.evidence];
    }

    return {
      id: record.id,
      title: record.title,
      charge: record.charge,
      synopsis: record.synopsis,
      evidenceSummary: record.evidenceSummary,
      severity: record.severity === "capital" ? "capital" : "felony",
      evidence,
    };
  } catch {
    return null;
  }
}

export function getScenarioEvidence(
  scenario: CrimeScenario | null,
): readonly EvidencePiece[] {
  if (!scenario) {
    return [];
  }
  if (scenario.evidence.length === 3) {
    return scenario.evidence;
  }
  const catalog = getScenarioById(scenario.id);
  return catalog?.evidence ?? [];
}
