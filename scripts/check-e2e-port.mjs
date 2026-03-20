#!/usr/bin/env node
import { execSync } from 'child_process';
/**
 * Ensures port 3098 (E2E web server) is free before running Playwright tests.
 * If the port is in use, Playwright hangs indefinitely with no output.
 */
import net from 'net';

const E2E_PORT = 3098;

const server = net.createServer();
server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // Instead of error, kill the process on the port and continue
    try {
      execSync(`lsof -ti :${E2E_PORT} | xargs kill -9`, { stdio: 'ignore' });
      // Inform the user the process was killed
      console.log(`\n⚠️ Port ${E2E_PORT} was in use. Killed process(es) occupying it.\n`);
    } catch (e) {
      // If nothing was using the port, or kill failed, just continue
    }
    // Try listening again after killing
    setTimeout(() => {
      server.listen(E2E_PORT);
    }, 300);
    return;
  }
  throw err;
});
server.once('listening', () => {
  server.close();
});
server.listen(E2E_PORT);
