export class HttpError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `HTTP Error: ${status}`);
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export class TimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class NetworkError extends Error {
  constructor(message = "Network error") {
    super(message);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class ParseError extends Error {
  public readonly original: unknown;
  constructor(original: unknown, message = "Failed to parse response") {
    super(message);
    this.original = original;
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

