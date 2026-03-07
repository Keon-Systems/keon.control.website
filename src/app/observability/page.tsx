import Link from "next/link";
import { Shell, PageContainer, PageHeader, PageSection, Card, CardContent, CardHeader } from "@/components/layout";
import { Button } from "@/components/ui";

const observabilitySections = [
  "Platform-wide traces",
  "Latency anomalies",
  "Operator telemetry feeds",
  "Cross-tenant execution debugging",
];

export default function ObservabilityPage() {
  return (
    <Shell>
      <PageContainer
        header={
          <PageHeader
            title="Observability"
            description="Platform telemetry and diagnostics for support and incident response."
            actions={
              <Button asChild variant="secondary">
                <Link href="/observability/traces">Open traces</Link>
              </Button>
            }
          />
        }
      >
        <PageSection title="Observability surfaces" description="Keep raw diagnostics internal and operator-focused.">
          <div className="grid gap-4 md:grid-cols-2">
            {observabilitySections.map((item) => (
              <Card key={item}>
                <CardHeader title={item} />
                <CardContent>
                  <p className="font-mono text-sm leading-6 text-[#C5C6C7]">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </PageSection>
      </PageContainer>
    </Shell>
  );
}
