"use client";

import * as React from "react";
import { PageContainer, PageHeader, Card, CardContent } from "@/components/layout/page-container";
import { DeclareIncidentForm } from "@/components/incidents";

export default function NewIncidentPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Declare Incident"
        description="Open a new incident record and begin the incident response protocol"
      />

      <Card>
        <CardContent className="p-0">
          <DeclareIncidentForm />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
