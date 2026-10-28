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
 * Pulls `--file <path>` out of argv.
 *
 * The path is returned exactly as the user typed it. It is not resolved,
 * normalised or restricted to any directory, which is deliberate: see the
 * threat model in REVIEW.md. This is a single-user tool with no privilege
 * boundary, so a path the user types is a path the user already has.
 *
 * `--file` with nothing after it is left in `rest`, where it fails the command
 * lookup and gets the usage line. That keeps this function from throwing, so
 * it adds no new error path to a cli.ts that has no try/catch yet.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const index = argv.indexOf('--file');
  if (index === -1) {
    return { file: undefined, rest: [...argv] };
  }

  const file = argv[index + 1];
  if (file === undefined) {
    return { file: undefined, rest: [...argv] };
  }

  const rest = [...argv];
  rest.splice(index, 2);
  return { file, rest };
}
