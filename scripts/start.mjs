// Production entrypoint (`npm start`). Kept in Node rather than inline shell so
// the same script runs under cmd.exe on Windows and /bin/sh on Railway/Render.
import { spawn } from 'node:child_process';

const run = (command, args) =>
  new Promise((resolve, reject) => {
    // shell:true so npm's node_modules/.bin PATH injection resolves the
    // .cmd shims on Windows as well as the symlinks on Linux.
    const child = spawn(command, args, { stdio: 'inherit', shell: true });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) return reject(new Error(`${command} terminated with ${signal}`));
      if (code !== 0) return reject(new Error(`${command} exited with code ${code}`));
      resolve();
    });
  });

const startServer = () => {
  const child = spawn('tsx', ['server/index.ts'], { stdio: 'inherit', shell: true });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => child.kill(signal));
  }
  child.on('exit', code => process.exit(code ?? 1));
};

if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error('[start] DATABASE_URL and DIRECT_URL are required');
  process.exit(1);
}

// Production deployments must apply reviewed migrations only. Never use db push.
run('prisma', ['migrate', 'deploy'])
  .then(startServer)
  .catch(error => {
    console.error(`[start] ${error.message}`);
    process.exit(1);
  });
