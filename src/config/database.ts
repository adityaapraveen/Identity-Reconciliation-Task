import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.NODE_ENV === 'production'
  ? '/tmp/bitespeed.db'
  : path.join(process.cwd(), 'bitespeed.db');

let db: Database;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    //enabling WAL mode so that reads and writes dont block each other
    await db.run('PRAGMA journal_mode = WAL');
    await db.run('PRAGMA foreign_keys = ON');

    //to create tables on startup if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Contact (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneNumber    TEXT,
        email          TEXT,
        linkedId       INTEGER REFERENCES Contact(id),
        linkPrecedence TEXT NOT NULL CHECK (linkPrecedence IN ('primary', 'secondary')),
        createdAt      TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt      TEXT NOT NULL DEFAULT (datetime('now')),
        deletedAt      TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_contact_email
        ON Contact(email)
        WHERE deletedAt IS NULL;

      CREATE INDEX IF NOT EXISTS idx_contact_phone
        ON Contact(phoneNumber)
        WHERE deletedAt IS NULL;

      CREATE INDEX IF NOT EXISTS idx_contact_linked_id
        ON Contact(linkedId);
    `);

    console.log(`SQLite connected at ${dbPath}`);
  }

  return db;
}