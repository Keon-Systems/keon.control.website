import { describe, expect, it } from "vitest";
import { navigationSections } from "@/components/layout/navigation";

describe("navigationSections", () => {
  it("has exactly 5 sections: Prepare, Connect, Verify, Operate, Advanced", () => {
    const titles = navigationSections.map((s) => s.title);
    expect(titles).toEqual(["Prepare", "Connect", "Verify", "Operate", "Advanced"]);
  });

  it("does not include /welcome in any section", () => {
    const hrefs = navigationSections.flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).not.toContain("/welcome");
  });

  it("places /control under Operate as 'Workspace'", () => {
    const operate = navigationSections.find((s) => s.title === "Operate");
    expect(operate).toBeDefined();
    const workspace = operate!.items.find((i) => i.href === "/control");
    expect(workspace).toBeDefined();
    expect(workspace!.label).toBe("Workspace");
  });

  it("places /api-keys under Advanced", () => {
    const advanced = navigationSections.find((s) => s.title === "Advanced");
    expect(advanced).toBeDefined();
    const apiKeys = advanced!.items.find((i) => i.href === "/api-keys");
    expect(apiKeys).toBeDefined();
  });

  it("places /setup under Prepare", () => {
    const prepare = navigationSections.find((s) => s.title === "Prepare");
    expect(prepare).toBeDefined();
    const setup = prepare!.items.find((i) => i.href === "/setup");
    expect(setup).toBeDefined();
    expect(setup!.label).toBe("Setup");
  });
});
