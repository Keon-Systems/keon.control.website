import { formatBytes, formatDuration, formatHash, formatNumber, formatTimestamp } from "@/lib/format";

describe("format utilities", () => {
  it("formats timestamps as ISO strings", () => {
    expect(formatTimestamp(new Date("2026-03-07T12:34:56.789Z"))).toBe("2026-03-07T12:34:56.789Z");
  });

  it("truncates hashes when the hash is longer than the requested length", () => {
    expect(formatHash("abcdef123456", 6)).toBe("abcdef...");
  });

  it("returns the full hash when the requested length is non-positive", () => {
    expect(formatHash("abcdef123456", 0)).toBe("abcdef123456");
  });

  it("formats numbers with grouping separators", () => {
    expect(formatNumber(1234567.891)).toBe("1,234,567.89");
  });

  it("formats negative durations as zero", () => {
    expect(formatDuration(-10)).toBe("0ms");
  });

  it("formats durations across units", () => {
    expect(formatDuration(950)).toBe("950ms");
    expect(formatDuration(5000)).toBe("5s");
    expect(formatDuration(65000)).toBe("1m 5s");
    expect(formatDuration(3665000)).toBe("1h 1m");
    expect(formatDuration(90000000)).toBe("1d 1h");
  });

  it("formats bytes across units", () => {
    expect(formatBytes(-1)).toBe("0 B");
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.00 KiB");
    expect(formatBytes(1048576)).toBe("1.00 MiB");
  });
});
