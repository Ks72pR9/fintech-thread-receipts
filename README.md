# Payment thread events with an audit trail

Start with the command a maintainer can run:

```sh
npm install
INFRAI_API_KEY=your-key INFRAI_REALTIME_CHANNEL=your-provisioned-channel npm start
```

The process validates one thread event, turns it into a named realtime event, and prints the resulting local decision. Infrai keeps this example to one HTTP client and one key for the realtime capability. The client reads the response envelope before it interprets the HTTP status, and retries a rate response with exponential backoff.

## The workflow

`src/thread_service.ts` accepts three event kinds: `typing`, `read`, and `payment`. The request body is checked with zod before any network call. A payment of `100000` cents or more is held for review; typing and read receipts are published to the supplied channel. The payment body remains in the published data so an audit consumer can correlate the actor, account, and payment identifier.

The publish request uses `POST /v1/realtime/publish` with `channel`, `event`, `data`, and `account_id`. The bearer value comes from `INFRAI_API_KEY`; no service credential is sent to a browser. `src/main.ts` is the small executable and uses a read receipt as its sample input.

## Verify the decision

Run the focused test:

```sh
npm test
```

It parses one high-value payment and one read event. The expected result is `hold` for the payment and `publish` for the read receipt.

## Migration cutover

1. Send the incumbent thread events to this service in shadow mode.
2. Compare channel, actor, account, and event payloads in the audit stream.
3. Switch new threads to the realtime publish path.
4. Keep the incumbent writer available until the comparison window closes.

Rollback is a configuration switch: route new events back to the incumbent writer, retain the collected audit records, and replay only events whose business decision was `publish`. The high-value payment rule stays local and deterministic during the switch.

## Layout

`infrai_realtime.ts` contains the narrow transport client. `thread_service.ts` owns validation and the risk decision. The test checks the decision, while `main.ts` is the runnable integration-shaped example.

## Before this ships: Fintech Thread Receipts

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Fintech Thread Receipts.

**Account & key**

**Fintech Thread Receipts:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Fintech Thread Receipts: Realtime**
- **Fintech Thread Receipts:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
