// Scheduled Cleanup Worker
// Deletes polls that haven't been accessed in 30+ days

import { Env } from './types';

export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    console.log('Running scheduled cleanup task at', new Date().toISOString());

    try {
      // Delete polls not accessed in 30 days
      // D1 foreign key cascades will handle dependent data (questions, participants, answers)
      const result = await env.DB.prepare(
        `DELETE FROM polls 
         WHERE last_accessed < datetime('now', '-30 days')`
      ).run();

      const deletedCount = result.meta.changes || 0;
      console.log(`Cleanup complete: Deleted ${deletedCount} inactive polls`);

      // Note: KV magic links will auto-expire via TTL, no manual cleanup needed
    } catch (error) {
      console.error('Cleanup task failed:', error);
      throw error;
    }
  },
};
