### ts-backend-starter

CLI to scaffold a production-ready TypeScript backend from the `template/` in this package. Instantly bootstrap an Express + TypeScript project with sensible defaults, scripts, and folder structure.

---

### Quick start

Scaffold into a new directory:
```bash
npx ts-backend-starter my-api
cd my-api
npm install
cp example.env .env   # or copy manually on Windows
npm run dev
```

Scaffold into the current directory (must be empty):
```bash
npx ts-backend-starter
```

Show help:
```bash
npx ts-backend-starter --help
```

---

### What you get (template overview)

- **Language/Runtime**: TypeScript, Node.js (Express)
- **Dev tooling**: `ts-node`, `nodemon`, `typescript`
- **Logging**: `morgan`
- **HTTP essentials**: `cors`, `cookie-parser`, `body-parser`
- **Config**: `dotenv`
- **Database**: `mongoose` (MongoDB)

Key scripts inside generated project (`package.json`):
```json
{
  "scripts": {
    "dev": "nodemon",
    "start": "node build/index.js",
    "build": "npm i && tsc"
  }
}
```

Folder structure (simplified):
```text
.
├─ index.ts                 # App entry
├─ routes/                  # Express routes
├─ controllers/             # Route handlers
├─ database/connection/     # Mongoose connection
├─ utils/                   # Helpers (config, logger)
├─ constants/               # App constants
├─ example.env              # Environment variables example
├─ tsconfig.json
├─ nodemon.json
└─ package.json
```

Environment variables (from `example.env`):
```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/my-db
JWT_SECRET=replace_me
```

---

### CLI behavior

- If you pass a directory name, it will be created (if missing) and the template copied into it.
- If you omit the directory, the current working directory is used.
- The target directory must be empty to avoid accidental overwrites.

Commands you’ll commonly run after scaffolding:
```bash
npm install
cp example.env .env
npm run dev   # starts nodemon with ts-node
```

Build and run production build:
```bash
npm run build
npm start
```

---

### Local development of this CLI

Test the package locally without publishing:
```bash
# From this repository root
npm pack

# In a separate temp folder
mkdir test-cli && cd test-cli && npm init -y
npx -y ../ts-backend-starter-*.tgz my-app
```

Or link globally:
```bash
# In this repo
npm link

# Anywhere else
ts-backend-starter my-app
```

---

### Publish

```bash
npm login
npm publish
```

This package exposes the bin `ts-backend-starter`, so users can scaffold via `npx ts-backend-starter`.

---

### Notes and customization

- The generated project is intentionally minimal; adjust `tsconfig.json`, add middlewares, or extend the folder layout as needed.
- To change what gets scaffolded, edit the contents of this repo’s `template/` directory.


