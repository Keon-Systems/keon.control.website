"use client";

import * as React from "react";
import { Shell } from "@/components/layout";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBillingSummary, listControlTenants } from "@/lib/api/control-plane";
import { User, Bell, Palette, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [billingState, setBillingState] = React.useState<string>("loading");

  React.useEffect(() => {
    async function load() {
      const tenants = await listControlTenants();
      if (!tenants[0]) return;
      const billing = await getBillingSummary(tenants[0].id);
      setBillingState(billing.billingState);
    }

    load().catch(() => setBillingState("unavailable"));
  }, []);

  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Settings"
          description="Configure your application preferences and account settings"
        />

        <div className="max-w-2xl space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#66FCF1]" />
                <span>Profile</span>
              </div>
            }
            description="Manage your account information"
          />
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-mono text-sm font-medium text-[#C5C6C7]">
                  Display Name
                </label>
                <Input defaultValue="Admin User" />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-sm font-medium text-[#C5C6C7]">Email</label>
                <Input defaultValue="admin@example.com" type="email" />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-sm font-medium text-[#C5C6C7]">Billing State</label>
                <Input value={billingState} readOnly />
              </div>
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#66FCF1]" />
                <span>Notifications</span>
              </div>
            }
            description="Configure how you receive alerts and updates"
          />
          <CardContent>
            <div className="space-y-4">
              <SettingToggle
                label="Email Notifications"
                description="Receive alerts via email"
                defaultChecked
              />
              <div className="h-px bg-[#384656]" />
              <SettingToggle
                label="Budget Alerts"
                description="Notify when budget thresholds are reached"
                defaultChecked
              />
              <div className="h-px bg-[#384656]" />
              <SettingToggle
                label="Policy Violations"
                description="Notify on blocked or flagged executions"
                defaultChecked
              />
              <div className="h-px bg-[#384656]" />
              <SettingToggle
                label="Weekly Digest"
                description="Weekly summary of governance activity"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#66FCF1]" />
                <span>Appearance</span>
              </div>
            }
            description="Customize the look and feel"
          />
          <CardContent>
            <div className="space-y-4">
              <SettingToggle label="Dark Mode" description="Use dark theme" />
              <div className="h-px bg-[#384656]" />
              <SettingToggle
                label="Compact Mode"
                description="Reduce spacing for denser information display"
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-[#FF6B6B]/30">
          <CardHeader
            title={
              <div className="flex items-center gap-2 text-[#FF6B6B]">
                <AlertTriangle className="h-4 w-4" />
                <span>Danger Zone</span>
              </div>
            }
            description="Irreversible actions"
          />
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-medium text-[#C5C6C7]">
                  Sign Out All Sessions
                </p>
                <p className="font-mono text-xs text-[#C5C6C7] opacity-60">
                  Sign out from all devices
                </p>
              </div>
              <Button variant="outline" size="sm">
                Sign Out All
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </PageContainer>
    </Shell>
  );
}

function SettingToggle({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-mono text-sm font-medium text-[#C5C6C7]">{label}</p>
        <p className="font-mono text-xs text-[#C5C6C7] opacity-60">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-[#66FCF1]" : "bg-[#384656]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#0B0C10] transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
