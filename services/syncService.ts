
/**
 * 云端同步服务
 */
const SUPABASE_URL = 'https://cbpseqmzvvufuajdhcqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicHNlcW16dnZ1ZnVhamRoY3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjQwMzUsImV4cCI6MjA4Mzg0MDAzNX0.hmOOpdPr5Z2SLpwnNIqq7UYtYKcCalbENRT2d3x9eWY';

export const syncWithCloud = async (coupleId: string, localData: any) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !coupleId) {
    return localData;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/couple_data?couple_id=eq.${coupleId}`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        return localData;
    }

    const cloudData = await response.json();
    return cloudData[0]?.data || localData;
  } catch (error) {
    console.warn("Cloud sync paused or timeout");
    return localData;
  }
};

export const pushToCloud = async (coupleId: string, data: any) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !coupleId) return;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/couple_data`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ 
        couple_id: coupleId, 
        data: data, 
        updated_at: Date.now() 
      })
    });
  } catch (e) {
    // 自动推送失败不影响本地使用
  }
};
