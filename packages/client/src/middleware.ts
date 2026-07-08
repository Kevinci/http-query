import type { BeforeRequestHook, AfterResponseHook, OnErrorHook } from "./types";

export class MiddlewareStack {
  private before: BeforeRequestHook[] = [];
  private after: AfterResponseHook[] = [];
  private onError: OnErrorHook[] = [];

  useBefore(fn: BeforeRequestHook) {
    this.before.push(fn);
  }

  useAfter(fn: AfterResponseHook) {
    this.after.push(fn);
  }

  useOnError(fn: OnErrorHook) {
    this.onError.push(fn);
  }

  async runBefore(init: RequestInit & { url: string }) {
    let current = init;
    for (const fn of this.before) {
      // eslint-disable-next-line no-await-in-loop
      current = await fn(current);
    }
    return current;
  }

  async runAfter(res: Response) {
    let current = res;
    for (const fn of this.after) {
      // eslint-disable-next-line no-await-in-loop
      current = await fn(current);
    }
    return current;
  }

  async runOnError(err: unknown) {
    for (const fn of this.onError) {
      // eslint-disable-next-line no-await-in-loop
      await fn(err);
    }
  }
}

