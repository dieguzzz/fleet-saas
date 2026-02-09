'use server';

import { createClient } from '@/services/supabase/server';

export async function checkDatabaseConnection() {
  try {
    const supabase = await createClient();
    const start = Date.now();

    // Simple query to check connection
    // We select from 'vehicles' or 'organizations' as they should exist.
    // 'organizations' is central.
    const { count, error } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    const duration = Date.now() - start;

    if (error) {
      return {
        success: false,
        message: error.message,
        duration,
      };
    }

    return {
      success: true,
      message: `Connected successfully.`,
      duration,
      count,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error',
      duration: 0,
    };
  }
}
