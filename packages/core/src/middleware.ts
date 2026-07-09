import type { BeforeRequestHook, AfterResponseHook, OnErrorHook } from "./types";

/** Ordered pipeline of request/response/error hooks. */
export class MiddlewareStack {
  private before: BeforeRequestHook[] = [];
  private after: AfterResponseHook[] = [];
  private onError: OnErrorHook[] = [];

  useBefore(fn: BeforeRequestHook): void {
    this.before.push(fn);
  }

  useAfter(fn: AfterResponseHook): void {
    this.after.push(fn);
  }

  useOnError(fn: OnErrorHook): void {
    this.onError.push(fn);
  }

  async runBefore(init: RequestInit & { url: string }): Promise<RequestInit & { url: string }> {
    let current = init;
    for (const fn of this.before) {
      current = await fn(current);
    }
    return current;
  }

  async runAfter(res: Response): Promise<Response> {
    let current = res;
    for (const fn of this.after) {
      current = await fn(current);
    }
    return current;
  }

  async runOnError(err: unknown): Promise<void> {
    for (const fn of this.onError) {
      await fn(err);
    }
  }
}
