import { act, renderHook } from "@testing-library/react";
import { useExplainMode } from "@/lib/use-explain-mode";

describe("useExplainMode", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("opens explain mode on ? and derives the focused element label", () => {
    const button = document.createElement("button");
    button.setAttribute("data-explain-name", "Trust Score");
    document.body.appendChild(button);
    button.focus();

    const { result } = renderHook(() => useExplainMode());

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    });

    expect(result.current.isExplainMode).toBe(true);
    expect(result.current.provenanceData?.element).toBe("Trust Score");
    expect(result.current.provenanceData?.signer.verified).toBe(true);
  });

  it("closes explain mode on Escape and via the close handler", () => {
    const input = document.createElement("input");
    input.setAttribute("aria-label", "Command Search");
    document.body.appendChild(input);
    input.focus();

    const { result } = renderHook(() => useExplainMode());

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    });
    expect(result.current.isExplainMode).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.isExplainMode).toBe(false);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    });
    act(() => {
      result.current.closeExplainMode();
    });

    expect(result.current.isExplainMode).toBe(false);
    expect(result.current.provenanceData).toBeNull();
  });
});
