/**
 * Command line argument parsing. Pure: it reads an argv array and returns what
 * it found. Opening a file is storage.ts's job.
 */
export interface ParsedArgs {
  /** The path given after `--file`, or undefined when the flag was not used. */
  file: string | undefined;
  /** The path given after `--out`, or undefined when the flag was not used. */
  out: string | undefined;
  /** argv with the flags and their values removed. */
  rest: string[];
}

const FLAGS = ['--file', '--out'] as const;
type Flag = (typeof FLAGS)[number];

function isFlag(token: string | undefined): token is Flag {
  return token !== undefined && (FLAGS as readonly string[]).includes(token);
}

/**
 * Pulls leading `--file <path>` and `--out <path>` out of argv.
 *
 * Flags have to come before the command, as the usage line says. Searching the
 * whole of argv would find a flag inside a todo title and write to a file the
 * user never named, and report success.
 *
 * A path is returned exactly as the user typed it. It is not resolved,
 * normalised or restricted to any directory, which is deliberate: see the
 * threat model in REVIEW.md. This is a single-user tool with no privilege
 * boundary, so a path the user types is a path the user already has.
 *
 * Throws when a flag is used wrongly. Doing nothing instead would run the
 * command against the default file and exit 0, which is this repo's third
 * failure class.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const found = new Map<Flag, string>();
  let index = 0;

  while (isFlag(argv[index])) {
    const flag = argv[index] as Flag;
    const value = argv[index + 1];
    // An empty path is not a path, and storage.ts reads an empty TODO_FILE as
    // unset, so it would quietly mean the default file.
    if (value === undefined || value === '' || value.startsWith('--')) {
      throw new Error(`${flag} needs a path`);
    }
    if (found.has(flag)) {
      throw new Error(`${flag} given twice`);
    }
    found.set(flag, value);
    index += 2;
  }

  const rest = argv.slice(index);
  const misplaced = rest.find(isFlag);
  if (misplaced !== undefined) {
    throw new Error(`${misplaced} must come before the command`);
  }

  return { file: found.get('--file'), out: found.get('--out'), rest };
}
