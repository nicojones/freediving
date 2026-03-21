#!/usr/bin/env node
/**
 * Creates a fresh MySQL database per E2E run (freediving_test_${timestamp}),
 * then spawns Playwright with DB_* env vars so the app uses that DB.
 * Run `npm run db:up` before `npm run test:e2e` locally.
 */
import { spawn } from 'child_process';
import mysql from 'mysql2/promise';

const DB_NAME = `freediving_test_${Date.now()}`;
const DB_HOST = process.env.DB_HOST ?? 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT ?? '3306', 10);
const DB_USER = process.env.DB_USER ?? 'root';
const DB_PASS = process.env.DB_PASS ?? 'root';

async function waitForMySQL(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const c = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASS,
        connectTimeout: 5000,
      });
      await c.ping();
      await c.end();
      return;
    } catch {
      if (i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        throw new Error('MySQL not ready after 30s. Run `npm run db:up` first.');
      }
    }
  }
}

async function main() {
  try {
    await waitForMySQL();
  } catch (err) {
    console.error('Failed to connect to MySQL:', err.message);
    process.exit(1);
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
    });
    await connection.query(
      `CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.end();
  } catch (err) {
    console.error('Failed to create test database. Is MySQL running? Run `npm run db:up` first.');
    console.error(err);
    process.exit(1);
  }

  const env = {
    ...process.env,
    DB_HOST,
    DB_PORT: String(DB_PORT),
    DB_USER,
    DB_PASS,
    DB_NAME,
    NODE_ENV: 'test',
  };

  const child = spawn('npx', ['playwright', 'test', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env,
  });

  const code = await new Promise((resolve) => child.on('close', resolve));
  process.exit(code ?? 1);
}

main();
