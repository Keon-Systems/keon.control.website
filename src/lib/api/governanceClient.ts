import { fetchJson } from "./http";
import {
  ListDecisionsResponseSchema,
  GetDecisionCaseResponseSchema,
  SubmitDecisionRequestSchema,
  SubmitDecisionResponseSchema,
} from "../contracts/decisions";
import { EvidenceByRunResponseSchema } from "../contracts/evidence";
import { ReceiptsSummaryByRunResponseSchema, ReceiptResponseSchema } from "../contracts/receipts";
import { ListPoliciesResponseSchema, GetPolicyVersionResponseSchema } from "../contracts/policies";
import {
  ListDeliberationsResponseSchema,
  GetDeliberationDetailResponseSchema,
  ListReformsResponseSchema,
  GetReformDetailResponseSchema,
  ListLegitimacyResponseSchema,
} from "../contracts/collective";

function kernelBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_KERNEL_BASE_URL;
  if (!v) throw new Error("Missing NEXT_PUBLIC_KERNEL_BASE_URL");
  return v;
}

export const governanceClient = {
  listDecisionsPending: (tenantId: string) =>
    fetchJson(
      {
        baseUrl: kernelBaseUrl(),
        path: `/decisions?status=pending&tenantId=${encodeURIComponent(tenantId)}`,
      },
      ListDecisionsResponseSchema
    ),

  getDecisionCase: (caseId: string) =>
    fetchJson(
      { baseUrl: kernelBaseUrl(), path: `/decisions/${encodeURIComponent(caseId)}` },
      GetDecisionCaseResponseSchema
    ),

  submitDecision: (caseId: string, payload: unknown) => {
    const parsed = SubmitDecisionRequestSchema.parse(payload);
    return fetchJson(
      {
        baseUrl: kernelBaseUrl(),
        path: `/decisions/${encodeURIComponent(caseId)}`,
        method: "POST",
        body: parsed,
      },
      SubmitDecisionResponseSchema
    );
  },

  getEvidenceByRun: (runId: string) =>
    fetchJson(
      { baseUrl: kernelBaseUrl(), path: `/evidence/runs/${encodeURIComponent(runId)}` },
      EvidenceByRunResponseSchema
    ),

  getReceiptsSummaryByRun: (runId: string) =>
    fetchJson(
      {
        baseUrl: kernelBaseUrl(),
        path: `/receipts/runs/${encodeURIComponent(runId)}?format=summary`,
      },
      ReceiptsSummaryByRunResponseSchema
    ),

  getReceipt: (receiptId: string) =>
    fetchJson(
      { baseUrl: kernelBaseUrl(), path: `/receipts/${encodeURIComponent(receiptId)}` },
      ReceiptResponseSchema
    ),

  listPolicies: () =>
    fetchJson({ baseUrl: kernelBaseUrl(), path: `/policies` }, ListPoliciesResponseSchema),

  getPolicyVersion: (policyId: string, version: string) =>
    fetchJson(
      {
        baseUrl: kernelBaseUrl(),
        path: `/policies/${encodeURIComponent(policyId)}/versions/${encodeURIComponent(version)}`,
      },
      GetPolicyVersionResponseSchema
    ),

  // ── Collective retrieval methods (GET-only, no mutation methods) ──

  listDeliberations: () =>
    fetchJson(
      { baseUrl: kernelBaseUrl(), path: `/collective/deliberations` },
      ListDeliberationsResponseSchema
    ),

  getDeliberation: (sessionId: string) =>
    fetchJson(
      {
        baseUrl: kernelBaseUrl(),
        path: `/collective/deliberations/${encodeURIComponent(sessionId)}`,
      },
      GetDeliberationDetailResponseSchema
    ),

  listReforms: () =>
    fetchJson(
      { baseUrl: kernelBaseUrl(), path: `/collective/reforms` },
      ListReformsResponseSchema
    ),

  getReform: (artifactId: string) =>
    fetchJson(
      {
        baseUrl: kernelBaseUrl(),
        path: `/collective/reforms/${encodeURIComponent(artifactId)}`,
      },
      GetReformDetailResponseSchema
    ),

  listLegitimacyAssessments: (artifactRef?: string) =>
    fetchJson(
      {
        baseUrl: kernelBaseUrl(),
        path: `/collective/legitimacy${artifactRef ? `?artifactRef=${encodeURIComponent(artifactRef)}` : ""}`,
      },
      ListLegitimacyResponseSchema
    ),
};

