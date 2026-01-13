
/**
 * 云端同步服务
 * 注意：使用此功能需要您在 Supabase.com 注册并获取以下信息
 */
const https://cbpseqmzvvufuajdhcqk.supabase.co = ''; // 填写您的 Supabase 项目地址
const eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicHNlcW16dnZ1ZnVhamRoY3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjQwMzUsImV4cCI6MjA4Mzg0MDAzNX0.hmOOpdPr5Z2SLpwnNIqq7UYtYKcCalbENRT2d3x9eWY = ''; // 填写您的 Supabase 匿名密钥

export const syncWithCloud = async (coupleId: string, localData: any) => {
  if (!https://cbpseqmzvvufuajdhcqk.supabase.co || !eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicHNlcW16dnZ1ZnVhamRoY3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjQwMzUsImV4cCI6MjA4Mzg0MDAzNX0.hmOOpdPr5Z2SLpwnNIqq7UYtYKcCalbENRT2d3x9eWY) {
    console.warn("未配置数据库 API Key，同步功能暂不可用");
    return localData;
  }

  try {
    // 这里展示简化的逻辑：推送本地数据并获取最新的全量数据
    // 实际开发中会使用 supabase-js 库进行更精细的操作
    const response = await fetch(`${https://cbpseqmzvvufuajdhcqk.supabase.co}/rest/v1/couple_data?couple_id=eq.${coupleId}`, {
      method: 'GET',
      headers: {
        'apikey': eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicHNlcW16dnZ1ZnVhamRoY3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjQwMzUsImV4cCI6MjA4Mzg0MDAzNX0.hmOOpdPr5Z2SLpwnNIqq7UYtYKcCalbENRT2d3x9eWY,
        'Authorization': `Bearer ${eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicHNlcW16dnZ1ZnVhamRoY3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjQwMzUsImV4cCI6MjA4Mzg0MDAzNX0.hmOOpdPr5Z2SLpwnNIqq7UYtYKcCalbENRT2d3x9eWY}`,
      }
    });

    const cloudData = await response.json();
    
    // 合并逻辑：以 id 为准去重，以 updatedAt 为准取最新
    // 这里由 App.tsx 内部处理合并更佳
    return cloudData[0]?.data || localData;
  } catch (error) {
    console.error("同步失败:", error);
    return localData;
  }
};

export const pushToCloud = async (coupleId: string, data: any) => {
  if (!https://cbpseqmzvvufuajdhcqk.supabase.co || !coupleId) return;

  try {
    await fetch(`${https://cbpseqmzvvufuajdhcqk.supabase.co}/rest/v1/couple_data`, {
      method: 'POST',
      headers: {
        'apikey': eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicHNlcW16dnZ1ZnVhamRoY3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjQwMzUsImV4cCI6MjA4Mzg0MDAzNX0.hmOOpdPr5Z2SLpwnNIqq7UYtYKcCalbENRT2d3x9eWY,
        'Authorization': `Bearer ${eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicHNlcW16dnZ1ZnVhamRoY3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjQwMzUsImV4cCI6MjA4Mzg0MDAzNX0.hmOOpdPr5Z2SLpwnNIqq7UYtYKcCalbENRT2d3x9eWY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ couple_id: coupleId, data, updated_at: Date.now() })
    });
  } catch (e) {
    console.error("上传失败:", e);
  }
};
