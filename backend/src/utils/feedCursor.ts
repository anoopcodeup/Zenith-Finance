type FeedCursorPayload = {
  createdAt: Date;
  id: string;
};

/**
 * Encode feed cursor into opaque base64 string.
 * Format before encoding: createdAt|id
 */
export function encodeFeedCursor(payload: FeedCursorPayload): string {
  const raw = `${payload.createdAt.toISOString()}|${payload.id}`;
  return Buffer.from(raw, "utf8").toString("base64");
}

/**
 * Decode opaque base64 cursor into payload.
 * Throws if cursor is invalid.
 */
export function decodeFeedCursor(cursor: string): FeedCursorPayload {
  let decoded: string;

  try {
    decoded = Buffer.from(cursor, "base64").toString("utf8");
  } catch {
    throw new Error("Invalid cursor encoding");
  }

  const [createdAtRaw, id] = decoded.split("|");

  if (!createdAtRaw || !id) {
    throw new Error("Invalid cursor format");
  }

  const createdAt = new Date(createdAtRaw);

  if (isNaN(createdAt.getTime())) {
    throw new Error("Invalid cursor date");
  }

  return { createdAt, id };
}
