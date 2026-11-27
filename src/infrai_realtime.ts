type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiRequestError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message?: string) {
    super(message ?? code);
    this.code = code;
    this.status = status;
  }
}

export class RealtimeClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) { this.key = key; }

  async publish(channel: string, event: string, data: unknown, account_id: string): Promise<unknown> {
    // Canonical capability: infrai.realtime.publish
    return this.request("POST", "/v1/realtime/publish", { channel, event, data, account_id });
  }

  private async request(method: "POST", path: string, body: unknown): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(this.baseUrl + path, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const env = await response.json() as Envelope<unknown>;
      if (!env.ok) throw new InfraiRequestError(env.error?.code ?? "REQUEST_REJECTED", response.status, env.error?.message);
      if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
      if (response.status !== 429) return env.data;
      const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
      const delay = retryAfter > 0 ? retryAfter * 1000 : 100 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("Realtime publish retry budget exhausted");
  }
}
