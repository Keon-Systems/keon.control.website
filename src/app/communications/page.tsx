"use client";
import * as React from "react";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { ComposeForm } from "@/components/communications";
import { MessageSquare } from "lucide-react";

export default function CommunicationsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Communications"
        description="Send messages to tenants via email or in-app channels"
      />
      <div className="max-w-2xl">
        <Card>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#66FCF1]" />
                <span>Compose Message</span>
              </div>
            }
            description="Send to all tenants or specific tenants"
          />
          <CardContent>
            <ComposeForm />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
