-- Adds the caterpillar -> butterfly friendship streak feature.
-- A friendship starts as 'caterpillar'. Any photo sent between the two
-- friends counts as an interaction for that calendar day. Three
-- consecutive days with at least one interaction levels the friendship
-- up to 'butterfly' (stays there even if the streak later lapses,
-- similar to how a Snapchat Best Friend badge doesn't disappear).

ALTER TABLE friendships
    ADD COLUMN streak_days INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN last_interaction_date DATE,
    ADD COLUMN stage VARCHAR(10) NOT NULL DEFAULT 'caterpillar'
        CHECK (stage IN ('caterpillar', 'butterfly'));
