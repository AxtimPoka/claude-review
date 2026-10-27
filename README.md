# tiny-todo

A deliberately tiny todo CLI. It exists to practise a code review pipeline,
not to be a good todo app.

```bash
npm install
npm run build
node dist/cli.js add "buy milk"
node dist/cli.js list
```

`npm run check` runs lint, typecheck and tests — the same three things CI runs.
