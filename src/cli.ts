import { parseArgs } from './args.js';
import { addTodo, completeTodo } from './todo.js';
import { renderList } from './render.js';
import { exportText, load, save } from './storage.js';

function main(argv: string[]): number {
  const { file, out, rest: args } = parseArgs(argv);
  if (file !== undefined) {
    process.env.TODO_FILE = file;
  }

  const [command, ...rest] = args;

  switch (command) {
    case 'add': {
      const title = rest.join(' ');
      save(addTodo(load(), title));
      console.log(`Added: ${title.trim()}`);
      return 0;
    }
    case 'done': {
      const id = Number(rest[0]);
      const todos = completeTodo(load(), id);
      save(todos);
      console.log(`Done: ${todos[id - 1]?.title ?? String(id)}`);
      return 0;
    }
    case 'list': {
      const text = renderList(load());
      if (out !== undefined) {
        exportText(out, text + '\n');
        return 0;
      }
      console.log(text);
      return 0;
    }
    default:
      console.error('usage: tiny-todo [--file <path>] [--out <path>] <add|done|list> [args]');
      return 1;
  }
}

// CLAUDE.md: the library throws, and this file turns the error into an exit
// code. Without this, a bad argument or a corrupt data file reaches the user as
// a stack trace.
try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
