/* Session-level bridge audit: when a S.U.R.Y.A. lawyer views a permissioned
   DMS record, the event lands here and the DMS Audit Trail surfaces it —
   demonstrating cross-system auditable access. In production this would be
   a server-side, append-only (WORM) log keyed to the lawyer's JWT identity. */

export type BridgeAccessEvent = { at: string; lawyer: string; document: string; caseId: string };

let events: BridgeAccessEvent[] = [];

export const recordBridgeAccess = (e: BridgeAccessEvent) => { events = [e, ...events].slice(0, 50); };
export const getBridgeAccessEvents = () => events;
export const bridgeAccessCount = () => events.length;
