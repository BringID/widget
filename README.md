# BringID Widget

BringID Widget is a privacy-focused identity verification application built on the Semaphore protocol. It allows users to prove their identity without revealing personal information by leveraging zero-knowledge proofs and blockchain-based identity groups.

This widget is not meant to be used standalone. It is accessed exclusively through the `BringIDModal` component provided by the [`bringid`](https://www.npmjs.com/package/bringid) npm package. The modal embeds the widget in an iframe and handles all communication between the host application and the verification flow.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **Language:** TypeScript
- **UI:** React 19, Styled Components
- **State Management:** Redux Toolkit, React Redux
- **Blockchain:** Ethers.js, Semaphore Protocol
- **Analytics:** Plausible (via next-plausible)

## Environment Variables

Copy the example env file and fill in the values:

```bash
cp .env.example .env.local
```

| Variable                        | Description                                   |
| ------------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_ZUPLO_API_KEY`     | API key for the Zuplo API gateway             |
| `NEXT_PUBLIC_TASK_PENDING_TIME` | Duration (ms) for task pending state          |
| `NEXT_PUBLIC_IS_STAGING`        | Set to `true` to enable staging configuration |

## Development

### Prerequisites

- Node.js 18+
- npm

### Getting Started

```bash
# Install dependencies
npm install

# Start development server (with Turbopack)
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command         | Description                     |
| --------------- | ------------------------------- |
| `npm run dev`   | Start dev server with Turbopack |
| `npm run build` | Create production build         |
| `npm run start` | Start production server         |
| `npm run lint`  | Run ESLint                      |
| `npm run clean` | Remove `.next` build cache      |

## License

AGPL-3.0
