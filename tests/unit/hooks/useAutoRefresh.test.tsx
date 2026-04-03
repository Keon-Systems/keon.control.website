import { act, renderHook } from "@testing-library/react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

describe("useAutoRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs immediately and on the configured interval", async () => {
    const fn = vi.fn();
    renderHook(() =>
      useAutoRefresh({
        fn,
        intervalMs: 1000,
      }),
    );

    expect(fn).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(fn).toHaveBeenCalledTimes(4);
    expect(fn.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
  });

  it("does not run when disabled and aborts on unmount", () => {
    const fn = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ enabled }) =>
        useAutoRefresh({
          fn,
          intervalMs: 1000,
          enabled,
        }),
      {
        initialProps: { enabled: false },
      },
    );

    expect(fn).not.toHaveBeenCalled();

    rerender({ enabled: true });
    expect(fn).toHaveBeenCalledTimes(1);

    const signal = fn.mock.calls[0]?.[0] as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
