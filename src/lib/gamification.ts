import { createClient } from '@/lib/supabase/client'

/**
 * Award XP to the current user and handle leveling up.
 * Uses the increment_xp RPC function, with a client-side fallback.
 */
export async function awardXP(amount: number): Promise<{ xp: number; level: number; leveledUp: boolean }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { xp: 0, level: 1, leveledUp: false }

  // Try RPC first
  const { data, error } = await supabase.rpc('increment_xp', {
    user_id_input: user.id,
    xp_amount: amount,
  })

  if (!error && data) {
    return {
      xp: data.new_xp ?? 0,
      level: data.new_level ?? 1,
      leveledUp: data.leveled_up ?? false,
    }
  }

  // Fallback: direct update
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level')
    .eq('id', user.id)
    .single()

  if (!profile) return { xp: 0, level: 1, leveledUp: false }

  const levelXP = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000]
  const newXP = profile.xp + amount
  let newLevel = profile.level

  // Check for level up
  while (newLevel < levelXP.length && newXP >= levelXP[newLevel]) {
    newLevel++
  }

  const leveledUp = newLevel > profile.level

  await supabase
    .from('profiles')
    .update({ xp: newXP, level: newLevel })
    .eq('id', user.id)

  if (leveledUp && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('smartstart:levelup', { detail: { level: newLevel } }))
  }

  return { xp: newXP, level: newLevel, leveledUp }
}

/**
 * Update the user's study streak based on last_study_date.
 * Uses the update_streak RPC function, with a client-side fallback.
 */
export async function updateStreak(): Promise<number> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // Try RPC first
  const { data, error } = await supabase.rpc('update_streak', {
    user_id_input: user.id,
  })

  if (!error && typeof data === 'number') {
    return data
  }

  // Fallback: direct update
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_days, last_study_date')
    .eq('id', user.id)
    .single()

  if (!profile) return 0

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let newStreak = profile.streak_days

  if (profile.last_study_date === today) {
    // Already studied today, no change
    return newStreak
  } else if (profile.last_study_date === yesterday) {
    // Consecutive day — increment streak
    newStreak += 1
  } else {
    // Streak broken — reset to 1
    newStreak = 1
  }

  await supabase
    .from('profiles')
    .update({ streak_days: newStreak, last_study_date: today })
    .eq('id', user.id)

  return newStreak
}

/**
 * Check and award any newly earned achievements.
 * Uses the check_achievements RPC function, with a client-side fallback.
 */
export async function checkAchievements(): Promise<string[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Try RPC first
  const { data, error } = await supabase.rpc('check_achievements', {
    user_id_input: user.id,
  })

  if (!error && Array.isArray(data)) {
    return data as string[]
  }

  // Fallback: client-side achievement checking
  const [profileRes, topicsRes, sessionsRes, revisionRes, existingRes] = await Promise.all([
    supabase.from('profiles').select('streak_days').eq('id', user.id).single(),
    supabase.from('topics').select('id').eq('user_id', user.id).eq('status', 'completed'),
    supabase.from('study_sessions').select('id').eq('user_id', user.id),
    supabase.from('revision_schedule').select('id').eq('user_id', user.id).eq('status', 'completed'),
    supabase.from('achievements').select('achievement_type').eq('user_id', user.id),
  ])

  const streak = profileRes.data?.streak_days || 0
  const completedTopics = topicsRes.data?.length || 0
  const totalSessions = sessionsRes.data?.length || 0
  const completedRevisions = revisionRes.data?.length || 0
  const existing = new Set((existingRes.data || []).map(a => a.achievement_type))

  const criteria: { type: string; condition: boolean }[] = [
    { type: 'streak_7', condition: streak >= 7 },
    { type: 'streak_30', condition: streak >= 30 },
    { type: 'topics_10', condition: completedTopics >= 10 },
    { type: 'topics_100', condition: completedTopics >= 100 },
    { type: 'sessions_50', condition: totalSessions >= 50 },
    { type: 'revision_master', condition: completedRevisions >= 50 },
  ]

  const newlyUnlocked: string[] = []

  for (const { type, condition } of criteria) {
    if (condition && !existing.has(type)) {
      await supabase.from('achievements').insert({
        user_id: user.id,
        achievement_type: type,
      })
      newlyUnlocked.push(type)
    }
  }

  if (newlyUnlocked.length > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('smartstart:achievement', { detail: { achievements: newlyUnlocked } }))
  }

  return newlyUnlocked
}

/**
 * Generate daily missions for today if they don't exist.
 * Uses the generate_daily_missions RPC function, with a client-side fallback.
 */
export async function generateDailyMissions(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const today = new Date().toISOString().split('T')[0]

  // Check if missions already exist for today
  const { data: existing } = await supabase
    .from('daily_missions')
    .select('id')
    .eq('user_id', user.id)
    .eq('mission_date', today)
    .single()

  if (existing) return false // Already generated

  // Try RPC first
  const { error } = await supabase.rpc('generate_daily_missions', {
    user_id_input: user.id,
  })

  if (!error) return true

  // Fallback: generate client-side
  const missionPool = [
    { text: 'Complete a 25-minute Pomodoro session', completed: false },
    { text: 'Review 3 topics from your revision schedule', completed: false },
    { text: 'Add a new chapter or topic to a subject', completed: false },
    { text: 'Complete 5 study tasks from your daily plan', completed: false },
    { text: 'Log any mistakes you made today', completed: false },
    { text: 'Write your daily reflection', completed: false },
    { text: 'Study for at least 1 hour total', completed: false },
    { text: 'Mark 3 topics as completed', completed: false },
    { text: 'Rate your confidence on 5 topics', completed: false },
    { text: 'Complete a 50-minute deep focus session', completed: false },
  ]

  // Shuffle and pick 3
  const shuffled = missionPool.sort(() => Math.random() - 0.5)
  const selectedMissions = shuffled.slice(0, 3)

  await supabase.from('daily_missions').insert({
    user_id: user.id,
    mission_date: today,
    missions: selectedMissions,
    xp_reward: 50,
  })

  return true
}

/**
 * Send a browser notification if permission is granted.
 */
export function sendNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
    })
  }
}
