import "server-only";

const enabled = process.env.NODE_ENV !== "production";

/**
 * Writes a log message if logging is enabled.
 */
function write(message: string): void {
    if (!enabled) {
        return;
    }

    console.log(message);
}

/**
 * Starts a new log section.
 */
export function logSection(title: string): void {
    write("");
    write(`[${title}]`);
}

/**
 * Writes an intermediate step.
 */
export function logStep(message: string): void {
    write(` |- ${message}`);
}

/**
 * Writes the final step of a section.
 */
export function logDone(message: string): void {
    write(` \\- ${message}`);
}