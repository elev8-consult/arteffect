import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { CommerceError } from "./errors";

export const cartCookieName = "ae_cart";

export function createAccessToken() {
  return randomBytes(32).toString("base64url");
}

export function hashAccessToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function accessTokenMatches(token: string, expectedHash: string) {
  const actual = Buffer.from(hashAccessToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function cartTokenFromHeaders(headers: Headers, cartID?: number | string) {
  const explicit = headers.get("x-cart-token")?.trim();
  if (explicit) return explicit;

  const bearer = headers.get("authorization")?.match(/^Bearer\s+([A-Za-z0-9_-]{20,})$/i)?.[1];
  if (bearer) return bearer;

  const cookie = parseCookies(headers.get("cookie") || "")[cartCookieName];
  if (!cookie) return undefined;
  const separator = cookie.indexOf(".");
  if (separator < 1) return undefined;
  if (cartID !== undefined && cookie.slice(0, separator) !== String(cartID)) return undefined;
  return cookie.slice(separator + 1);
}

export function requireCartToken(headers: Headers, cartID: number | string) {
  const token = cartTokenFromHeaders(headers, cartID);
  if (!token || !/^[A-Za-z0-9_-]{40,80}$/.test(token)) {
    throw new CommerceError("CART_ACCESS_DENIED", "A valid cart access token is required.", 401);
  }
  return token;
}

export function cartCookie(cartID: number | string, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${cartCookieName}=${cartID}.${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; Priority=High${secure}`;
}

function parseCookies(header: string) {
  return Object.fromEntries(
    header.split(";").flatMap((part) => {
      const separator = part.indexOf("=");
      if (separator < 1) return [];
      const name = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      return name ? [[name, value]] : [];
    })
  );
}
