export default function invariant(
  condition: unknown,
  message?: string
): asserts condition {
  if (condition) {
    return;
  }
  throw new Error(message ?? "Invariant failed");
}
