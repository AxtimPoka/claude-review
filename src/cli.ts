import { parseArgs } from './args.js';
import { addTodo, completeTodo } from './todo.js';
import { renderList } from './render.js';
import { load, save } from './storage.js';

function main(argv: string[]): number {
  const { file, rest: args } = parseArgs(argv);
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
      console.log(renderList(load()));
      return 0;
    }
    default:
      console.error('usage: tiny-todo [--file <path>] <add|done|list> [args]');
      return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
