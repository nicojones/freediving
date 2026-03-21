'use server';

import mysql from 'mysql2/promise';
// @ts-expect-error named-placeholders has no types
import named from 'named-placeholders';

const globalForDb = global as unknown as { dbPool: mysql.Pool };

globalForDb.dbPool =
  globalForDb.dbPool ||
  mysql.createPool({
    host: process.env.DB_HOST ?? '',
    user: process.env.DB_USER ?? '',
    database: process.env.DB_NAME ?? '',
    password: process.env.DB_PASS ?? '',
    ...(process.env.DB_PORT ? { port: +process.env.DB_PORT } : {}),
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    namedPlaceholders: true,
  });

const dbPool = globalForDb.dbPool;

export const getDbConnection = async (): Promise<[mysql.PoolConnection, () => void]> => {
  const connection = await dbPool.getConnection();
  return [
    connection,
    () => {
      dbPool.releaseConnection(connection);
      connection.release();
    },
  ];
};

export const namedPlaceholders: (
  q: string,
  p: Record<string, unknown>
) => { sql: string; values: unknown[] } = named();
