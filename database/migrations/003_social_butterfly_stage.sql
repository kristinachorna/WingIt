-- Adds a second, longer-streak tier on top of the existing caterpillar/butterfly
-- stages. At 3 consecutive days of interaction a friendship becomes 'butterfly'
-- ("You give me butterflies!"). At 14 consecutive days it becomes
-- 'social_butterfly' ("You're a social butterfly!").

ALTER TABLE friendships DROP CONSTRAINT IF EXISTS friendships_stage_check;
ALTER TABLE friendships ADD CONSTRAINT friendships_stage_check
    CHECK (stage IN ('caterpillar', 'butterfly', 'social_butterfly'));
