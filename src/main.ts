import { RealtimeClient } from "./infrai_realtime.ts";
import { recordThreadEvent } from "./thread_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const channel = process.env.INFRAI_REALTIME_CHANNEL;
if (!channel) throw new Error("INFRAI_REALTIME_CHANNEL is required");

const client = new RealtimeClient(key);
const result = await recordThreadEvent(client, {
  channel,
  account_id: "acct_demo",
  actor: "customer-42",
  kind: "read"
});
console.log(JSON.stringify({ result, audit: "thread event accepted" }));
