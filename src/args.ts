/**
 * Command line argument parsing. Pure: it reads an argv array and returns what
 * it found. Opening the file is storage.ts's job.
 */
export interface ParsedArgs {
  /** The path given after `--file`, or undefined when the flag was not used. */
  file: string | undefined;
  /** argv with the flag and its value removed. */
  rest: string[];
}

/**
 * Pulls a leading `--file <path>` out of argv.
 *
 * The flag has to come first, before the command, as the usage line says.
 * Searching the whole of argv would find a `--file` inside a todo title and
 * write the list to a file the user never named, and report success.
 *
 * The path is returned exactly as the user typed it. It is not resolved,
 * normalised or restricted to any directory, which is deliberate: see the
 * threat model in REVIEW.md. This is a single-user tool with no privilege
 * boundary, so a path the user types is a path the user already has.
 *
 * Throws when the flag is used wrongly. Doing nothing instead would run the
 * command against the default file and exit 0, which is this repo's third
 * failure class.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  let file: string | undefined;
  let rest = [...argv];

  if (rest[0] === '--file') {
    const value = rest[1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error('--file needs a path');
    }
    file = value;
    rest = rest.slice(2);
  }

  if (rest.includes('--file')) {
    throw new Error('--file must come before the command');
  }

  return { file, rest };
}
