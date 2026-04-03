import {
  ApiError,
  NetworkError,
  NotFoundError,
  ServerError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
  parseApiError,
} from "@/lib/api/errors";

describe("api error helpers", () => {
  it("preserves explicit ApiError instances", () => {
    const error = new ValidationError("bad input", { field: "tenantId" });
    expect(parseApiError(error)).toBe(error);
  });

  it("maps fetch TypeErrors to NetworkError", () => {
    const parsed = parseApiError(new TypeError("fetch failed"));
    expect(parsed).toBeInstanceOf(NetworkError);
    expect(parsed.code).toBe("NETWORK_ERROR");
  });

  it("wraps generic errors and unknown values", () => {
    expect(parseApiError(new Error("boom"))).toMatchObject({ message: "boom" } satisfies Partial<ApiError>);
    expect(parseApiError("wat")).toMatchObject({ message: "An unknown error occurred" } satisfies Partial<ApiError>);
  });

  it("constructs the typed error classes with expected metadata", () => {
    expect(new TimeoutError("timeout")).toMatchObject({ code: "TIMEOUT_ERROR" });
    expect(new NotFoundError("missing")).toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
    expect(new UnauthorizedError("nope")).toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
    expect(new ServerError("down", 503)).toMatchObject({ statusCode: 503, code: "SERVER_ERROR" });
  });
});
