import { query } from '../db/index.js';

const BUTTERFLY_THRESHOLD_DAYS = 3;         // "You give me butterflies!"
const SOCIAL_BUTTERFLY_THRESHOLD_DAYS = 14; // "You're a social butterfly!"

// Called whenever a photo is sent between two friends. Updates the
// friendship's day-streak and, at each threshold, advances the stage:
//   caterpillar -> butterfly (3 consecutive days)
//   butterfly -> social_butterfly (14 consecutive days)
// Returns which milestone (if any) was just crossed, so the sender can be
// shown the matching celebratory message.
export async function recordInteraction(friendshipId) {
  const streakResult = await query(
    `UPDATE friendships
     SET streak_days = CASE
           WHEN last_interaction_date = CURRENT_DATE THEN streak_days
           WHEN last_interaction_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
           ELSE 1
         END,
         last_interaction_date = CURRENT_DATE
     WHERE id = $1
     RETURNING streak_days, stage`,
    [friendshipId]
  );

  const { streak_days, stage } = streakResult.rows[0];
  let milestone = null;

  if (streak_days >= SOCIAL_BUTTERFLY_THRESHOLD_DAYS && stage !== 'social_butterfly') {
    await query(`UPDATE friendships SET stage = 'social_butterfly' WHERE id = $1`, [friendshipId]);
    milestone = 'social_butterfly';
  } else if (streak_days >= BUTTERFLY_THRESHOLD_DAYS && stage === 'caterpillar') {
    await query(`UPDATE friendships SET stage = 'butterfly' WHERE id = $1`, [friendshipId]);
    milestone = 'butterfly';
  }

  return { milestone, streakDays: streak_days };
}
