/** Thrown for non-2xx HTTP responses. Carries the status and parsed body. */
export class HttpError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `HTTP Error: ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/** Thrown when a request exceeds its timeout and is aborted. */
export class TimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/** Thrown for transport-level failures (DNS, connection reset, offline). */
export class NetworkError extends Error {
  constructor(message = "Network error") {
    super(message);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/** Thrown when the response body cannot be parsed as the requested type. */
export class ParseError extends Error {
  public readonly original: unknown;
  constructor(original: unknown, message = "Failed to parse response") {
    super(message);
    this.name = "ParseError";
    this.original = original;
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}
