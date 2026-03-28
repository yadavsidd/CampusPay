import { db } from "../db/database.ts";

export function logActivity(type: string, message: string, address?: string, amount?: number) {
  try {
    const stmt = db.prepare(`
      INSERT INTO activities (type, message, address, amount)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(type, message, address || null, amount || null);
    console.log(`[ActivityLog] ${type}: ${message}`);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
