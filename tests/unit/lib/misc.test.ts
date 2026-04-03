import { cn } from "@/lib/utils";
import { omegaFlowUrl } from "@/lib/cross-links";
import { evidenceDocRegistry, getEvidenceDoc } from "@/lib/evidence-docs";
import { isRhidValid, resolveRhid } from "@/lib/rhid-resolver";
import { mapThinReceipt } from "@/lib/mappers";

describe("misc library helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_OMEGA_FLOW_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("merges tailwind classes with precedence", () => {
    expect(cn("p-2", false && "hidden", "p-4")).toBe("p-4");
  });

  it("builds omega flow urls using env override or localhost default", () => {
    expect(omegaFlowUrl("/runs/123")).toBe("http://localhost:3000/runs/123");
    process.env.NEXT_PUBLIC_OMEGA_FLOW_URL = "https://omega.keon.systems/";
    expect(omegaFlowUrl("/runs/123")).toBe("https://omega.keon.systems/runs/123");
  });

  it("returns evidence docs by slug", () => {
    expect(evidenceDocRegistry.length).toBeGreaterThan(0);
    expect(getEvidenceDoc("start-here")?.filePath).toBe("docs/START_HERE.md");
    expect(getEvidenceDoc("missing")).toBeNull();
  });

  it("resolves RHIDs from manifests and validates presence", () => {
    const manifest = {
      entries: [
        {
          rhid: "rhid:artifact:abc-123",
          sha256: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          content_type: "application/json",
          size_bytes: 64,
          storage_uri: "file:///tmp/a.json",
          created_by_actor_id: "actor_1",
          created_at: "2026-03-07T00:00:00Z",
        },
      ],
    };

    expect(resolveRhid("rhid:artifact:abc-123", manifest)).toEqual({
      rhid: "rhid:artifact:abc-123",
      sha256: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      contentType: "application/json",
      sizeBytes: 64,
      storageUri: "file:///tmp/a.json",
      createdByActorId: "actor_1",
      createdAt: "2026-03-07T00:00:00Z",
    });
    expect(isRhidValid("rhid:artifact:abc-123", manifest)).toBe(true);
    expect(isRhidValid("rhid:artifact:missing", manifest)).toBe(false);
    expect(isRhidValid("", manifest)).toBe(true);
  });

  it("maps thin receipts into UI shape", () => {
    expect(
      mapThinReceipt({
        receipt_id: "rcpt_1",
        run_id: "run_1",
        action_type: "ALLOW",
        timestamp: "2026-03-07T00:00:00Z",
        policy_rhid: "rhid:policy:abc",
        evidence_rhids: ["rhid:artifact:abc"],
        prev_receipt_hash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        hash: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        signature: "sig",
      }),
    ).toEqual({
      receiptId: "rcpt_1",
      runId: "run_1",
      actionType: "ALLOW",
      timestamp: "2026-03-07T00:00:00Z",
      policyRhid: "rhid:policy:abc",
      evidenceRhids: ["rhid:artifact:abc"],
      prevReceiptHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      hash: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      signature: "sig",
    });
  });
});
