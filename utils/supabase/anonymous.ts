import { createClient } from '@/utils/supabase/client'
import { LocalStorage, StoredResponse } from '@/utils/session'
import { Database } from '@/types/supabase'

export const createAnonymousClient = () => {
  const supabase = createClient()

  return {
    async saveResponses(tempId: string, responses: string[]) {
      try {
        // Use the first response as username, or empty string if not available
        const username = responses[0] || '';
        LocalStorage.saveResponses(username, responses);
        return { data: responses, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },

    async getResponses(tempId: string) {
      try {
        const storedData = LocalStorage.getResponses();
        return { data: storedData?.responses || null, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },

    async migrateResponsesToDatabase(userId: string) {
      try {
        const storedData = LocalStorage.getResponses();
        if (!storedData) return { error: 'No stored responses found' };

        const { error } = await supabase
          .from('user_responses')
          .insert({
            user_id: userId,
            name: storedData.username,
            responses: storedData.responses,
            status: 'pending',
            created_at: storedData.timestamp,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        
        // Clear localStorage after successful migration
        LocalStorage.clear();
        return { success: true, error: null };
      } catch (error) {
        console.error('Migration error:', error);
        return { success: false, error };
      }
    }
  };
};
