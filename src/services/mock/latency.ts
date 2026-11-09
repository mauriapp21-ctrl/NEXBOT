/** Simulated network latency between 150 and 600 ms. */
export function simulateLatency(min = 150, max = 600): Promise<void> {
  const ms = Math.round(min + Math.random() * (max - min));
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ServiceError extends Error {
  constructor(
    message: string,
    readonly code: "not_found" | "validation" | "conflict" | "unavailable",
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/** Deep copy so callers can never mutate the fake database by reference. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function notFound(entity: string, id: string): never {
  throw new ServiceError(`${entity} "${id}" no existe.`, "not_found");
}
