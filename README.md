# Iterative DFS

There are two places to add nodes to the visited set in the iterative DFS algorithm:
`on-push` and `on-pop`. This is a web-app that shows you that `on-push` is better.


A React application for visualizing Depth-First Search algorithms.

## Deployment

This application is configured to run as a subdirectory at `mainurl.com/dfs-viz`.

### Build Command

**Important:** Always build with the correct base path:

```bash
npm run build -- --base=/dfs-viz/
```

This ensures all assets (CSS, JS, images) are served from the correct subdirectory path.

### Development

For local development:

```bash
npm install
npm run dev
```

### CICD pipeline

Automatically builds and deploys to remote server.