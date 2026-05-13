import CortexPage from "@/app/cortex/page";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/layout", () => ({
  Shell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layout/page-container", () => ({
  PageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      <div>{actions}</div>
    </div>
  ),
  PageSection: ({ title, description, children }: { title?: ReactNode; description?: ReactNode; children: ReactNode }) => (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
      <div>{children}</div>
    </section>
  ),
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ title, description }: { title: ReactNode; description?: ReactNode }) => (
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("next/link", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("CortexPage", () => {
  it("renders Cortex as an operator verification surface", () => {
    render(<CortexPage />);

    expect(screen.getByText(/proof bundle: i1-i7 verified, merkle root stable, all checks passed/i)).toBeInTheDocument();
    expect(screen.getByText(/invariant manifest \/ proof spine/i)).toBeInTheDocument();
    expect(screen.getAllByText(/cortex proof-bundle/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/proof_bundle_id == merkle_root/i)).toBeInTheDocument();
    expect(screen.getAllByText(/cortex proof/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cortex benchmark/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/proving memory correctness under failure, tenancy, replay, indexing drift, trust decay, and governed audit/i)).toBeInTheDocument();
    expect(screen.getByText(/cortex leads on durability\/replay proof/i)).toBeInTheDocument();
    expect(screen.getByText(/transactional outbox, leasing, replay proofs, idempotence, and byte-identical artifacts are not the normal pitch in this market/i)).toBeInTheDocument();
    expect(screen.getByText(/most memory systems optimize recall\. cortex optimizes correctness\./i)).toBeInTheDocument();
    expect(screen.getByText(/most memory systems retrieve context\. cortex proves memory lineage\./i)).toBeInTheDocument();
    expect(screen.getByText(/most memory systems trust their indexes\. cortex treats indexes as disposable derivatives\./i)).toBeInTheDocument();
    expect(screen.getByText(/most memory systems log after the fact\. cortex emits deterministic proof artifacts you can verify\./i)).toBeInTheDocument();
    expect(screen.getByText(/the commercial moat is audit infrastructure/i)).toBeInTheDocument();
    expect(screen.getByText(/ed25519 signing/i)).toBeInTheDocument();
    expect(screen.getByText(/tamper rejection/i)).toBeInTheDocument();
    expect(screen.getByText(/revoked key rejection/i)).toBeInTheDocument();
    expect(screen.getByText(/cortex leads on cryptographic auditability/i)).toBeInTheDocument();
    expect(screen.getByText(/unsigned open-core receipts remain allowed/i)).toBeInTheDocument();
    expect(screen.getByText(/governed signing \/ evidence pack integrity/i)).toBeInTheDocument();
  });
});