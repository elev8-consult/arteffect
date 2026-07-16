import config from "@payload-config";
import { getPayload } from "payload";
import type { Payload } from "payload";

let payloadClientPromise: Promise<Payload> | null = null;

export function getPayloadClient() {
  payloadClientPromise ??= getPayload({ config });

  return payloadClientPromise;
}
