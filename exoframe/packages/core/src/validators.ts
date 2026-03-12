import type { ExoFrameInput } from "./types.js";

/** Thrown when a required input field is missing or invalid. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validates and sanitizes an ExoFrameInput.
 *
 * - Throws ValidationError if `task` is missing or empty.
 * - Fills in sensible defaults for optional fields.
 *
 * @returns A complete, sanitized ExoFrameInput ready for pipeline.run().
 */
export function validateInput(input: Partial<ExoFrameInput>): ExoFrameInput {
  const task = (input.task ?? "").trim();
  if (!task) {
    throw new ValidationError("ExoFrameInput.task must be a non-empty string.");
  }

  return {
    task,
    context: input.context ?? {},
    constraints: input.constraints ?? [],
    files: input.files ?? [],
    mode: input.mode ?? "execute",
  };
}
