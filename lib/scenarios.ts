export interface CrimeScenario {
  id: string;
  title: string;
  charge: string;
  synopsis: string;
  evidenceSummary: string;
  severity: "felony" | "capital";
}

export const CRIME_SCENARIOS: readonly CrimeScenario[] = [
  {
    id: "scenario-001",
    title: "The Meridian Vault Breach",
    charge: "Aggravated Financial Espionage",
    synopsis:
      "A former compliance officer allegedly exfiltrated sealed audit ledgers from a sovereign wealth custodian during a 72-hour maintenance window.",
    evidenceSummary:
      "Encrypted USB traces, badge-swipe anomalies, and a terminated VPN tunnel originating from a secured compliance terminal.",
    severity: "felony",
  },
  {
    id: "scenario-002",
    title: "Operation Black Docket",
    charge: "Conspiracy to Obstruct Federal Inquiry",
    synopsis:
      "Prosecutors allege a ring of corporate counsel coordinated destruction of discovery materials ahead of a grand jury subpoena.",
    evidenceSummary:
      "Shredder service invoices, metadata gaps in document retention logs, and witness statements describing synchronized after-hours access.",
    severity: "felony",
  },
  {
    id: "scenario-003",
    title: "The Harrowfield Protocol",
    charge: "Premeditated Corporate Homicide",
    synopsis:
      "A pharmaceutical executive stands accused of knowingly suppressing fatal trial data to accelerate a blockbuster drug approval.",
    evidenceSummary:
      "Redacted internal memos, whistleblower deposition transcripts, and mortality curves withheld from regulatory filings.",
    severity: "capital",
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
  },
  {
    id: "scenario-008",
    title: "Project Iron Verdict",
    charge: "Weapons-Grade Material Diversion",
    synopsis:
      "Defense contractors face allegations of diverting export-controlled components to unauthorized third-party foundries.",
    evidenceSummary:
      "Bill of lading discrepancies, radiation signature tests, and intercepted freight manifests bearing falsified end-user certificates.",
    severity: "capital",
  },
] as const;

const FALLBACK_SCENARIO: CrimeScenario = CRIME_SCENARIOS[0] ?? {
  id: "scenario-fallback",
  title: "Emergency Docket",
  charge: "Unspecified Felony",
  synopsis: "A sealed matter brought before the court under extraordinary jurisdiction.",
  evidenceSummary: "Classified exhibits pending review.",
  severity: "felony",
};

export function getScenarioById(id: string): CrimeScenario | null {
  const found = CRIME_SCENARIOS.find((s) => s.id === id);
  return found ?? null;
}

export function pickRandomScenario(): CrimeScenario {
  const index = Math.floor(Math.random() * CRIME_SCENARIOS.length);
  return CRIME_SCENARIOS[index] ?? FALLBACK_SCENARIO;
}

export function formatScenarioForRoom(scenario: CrimeScenario): string {
  return JSON.stringify({
    id: scenario.id,
    title: scenario.title,
    charge: scenario.charge,
    synopsis: scenario.synopsis,
    evidenceSummary: scenario.evidenceSummary,
    severity: scenario.severity,
  });
}

export function parseScenarioFromRoom(raw: string): CrimeScenario | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      "title" in parsed &&
      "charge" in parsed &&
      "synopsis" in parsed &&
      "evidenceSummary" in parsed &&
      "severity" in parsed &&
      typeof (parsed as CrimeScenario).id === "string" &&
      typeof (parsed as CrimeScenario).title === "string"
    ) {
      return parsed as CrimeScenario;
    }
    return null;
  } catch {
    return null;
  }
}
