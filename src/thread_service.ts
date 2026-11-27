import { z } from "zod";
import { RealtimeClient } from "./infrai_realtime.ts";

export const threadEvent = z.object({
  channel: z.string().min(1),
  account_id: z.string().min(1),
  actor: z.string().min(1),
  kind: z.enum(["typing", "read", "payment"]),
  payment_id: z.string().optional(),
  amount_cents: z.number().int().nonnegative().optional()
});
export type ThreadEvent = z.infer<typeof threadEvent>;

export function riskAction(input: ThreadEvent): "publish" | "hold" {
  if (input.kind === "payment" && (input.amount_cents ?? 0) >= 100000) return "hold";
  return "publish";
}

export async function recordThreadEvent(client: RealtimeClient, raw: unknown): Promise<"published" | "held"> {
  const input = threadEvent.parse(raw);
  const action = riskAction(input);
  if (action === "hold") return "held";
  await client.publish(input.channel, `thread.${input.kind}`, input, input.account_id);
  return "published";
}
