/**
 * Regional toy/game archetypes in plain language.
 * Templates use ${c} (country) and ${folk} (short culture label).
 */

function folk(civ) {
  return String(civ || "")
    .split(/\s*\/\s*/)[0]
    .replace(/\s+peoples$/i, "")
    .trim() || "local";
}

/** Shared helpers for template bodies */
export function withPlace(country, civ, build) {
  return build(country, folk(civ));
}

export const PLAIN_ARCHETYPES = [
  {
    key: "rattle",
    title: "Infant rattle",
    category: "Musical Play",
    purchase: "music",
    participants: "Alone (infant with caregiver)",
    year: "prehistoric–present",
    req: ["Hollow rattle with seeds, pebbles, or bells", "Safe non-toxic materials"],
    desc: (c, civ) =>
      withPlace(c, civ, (country, folkName) =>
        `Rattles are some of the oldest sound toys. In ${country}, caregivers seal seeds or pebbles inside a gourd, clay pot, basket, or wooden shell so a baby can shake it and hear a clear sound. It is a simple cause-and-effect toy, and in some homes it also feels comforting.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country, folkName) => [
        `Offer a sealed rattle from ${country} within the baby’s reach while you stay close.`,
        "Shake it once slowly so they hear the sound, then pause so they can grab it.",
        "Let them shake, drop, and try again on a soft mat. Stop them from chewing it if the shell cracks.",
        `Hum or say a short lullaby from ${country} while they shake it a few times.`,
        "After play, check plugs and seams. Put it away if seeds can spill out.",
      ]),
  },
  {
    key: "whistle_toy",
    title: "Clay or wood whistle toy",
    category: "Musical Play",
    purchase: "music",
    participants: "Alone",
    year: "ancient–present",
    req: ["Whistle toy", "Breath control", "Open air if loud"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Small bird-shaped clay, wood, or reed whistles show up in markets and old finds across ${country}. Children use them to make loud calls and festival noise. Playing with one teaches steady breath and simple pitch.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Hold a clay, wood, or reed whistle made in a local style from ${country}. Keep the windway and finger holes clear.`,
        "Blow a steady stream for two seconds until you get one clear tone.",
        "Then try three short chirps and one long note. Count each clear sound.",
        "With a partner, take turns copying a short rhythm.",
        "Wipe the mouthpiece between players. Do not share it if anyone is sick.",
      ]),
  },
  {
    key: "pull_toy",
    title: "Animal pull toy",
    category: "Construction",
    purchase: "generic_toy",
    participants: "Alone",
    year: "ancient–present",
    req: ["Wheeled or sliding animal figure", "Pull cord", "Floor space"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Wheeled animal toys have been carved and pulled for a very long time in ${country}. A horse, bird, or ox on wheels helps a toddler learn to walk while pulling a friend behind them.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Tie a short cord to a wheeled animal toy from ${country}. Leave enough slack for small steps.`,
        "Walk five to ten steps on a clear floor so the toy follows without tipping.",
        "Try one gentle left turn and one right turn. Stop if the cord jerks the toy up.",
        "Make up a short parade or market story as you walk.",
        "Coil the cord and store the toy upright so the wheels stay round.",
      ]),
  },
  {
    key: "mini_weapons_toy",
    title: "Toy bow or dart play set",
    category: "Outdoor Folk",
    purchase: "outdoor",
    participants: "1–2 people",
    year: "ancient–present",
    req: ["Soft or low-power toy bow/darts", "Target", "Clear downrange area"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `In ${country}, children practice aim with soft bows, cork darts, or toy blowpipes. A straw, wood, or chalk target turns careful shooting into a scored outdoor game.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Outdoors in ${country}, set up a target with a backstop. Keep people and animals at least five paces away.`,
        "Load a soft arrow or foam dart. Keep the tip pointed at the ground until you shoot.",
        "Stand with feet apart, look at the center, and shoot one shot at a time.",
        "Score 3 for the center, 2 for the middle ring, 1 for the outer. First to 15 wins.",
        "Never aim at people or animals. Pick up every dart before the next turn.",
      ]),
  },
  {
    key: "jacks_local",
    title: "Pocket skill stones",
    category: "Puzzles & Skill",
    purchase: "jacks",
    participants: "1–4 people",
    year: "centuries old",
    req: ["Five small stones or seeds", "Flat ground"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Children in ${country} play pickup games with five small stones or seeds. You toss one up, grab others before it lands, and climb a ladder from ones to fours—often with a local counting chant.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Sit on flat ground with five small stones or seeds used by children in ${country}.`,
        "Scatter them, toss one up, and pick up exactly one stone before you catch the tossed stone.",
        "Next turns: pick up two, then three, then the rest in one sweep while the toss is in the air.",
        "If you drop or miss the catch, your turn ends. The next player starts again at ones.",
        "First to finish ones through fours while saying a short count wins.",
      ]),
  },
  {
    key: "story_dice_oral",
    title: "Story lots / casting sticks",
    category: "Dice & Chance",
    purchase: "dice",
    participants: "2+ people",
    year: "ancient–present",
    req: ["Marked sticks, shells, or dice", "Cup or hand for casting"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `In gatherings across ${country}, people cast marked sticks, shells, or dice to choose who speaks, dances, or answers next. It is a party game of chance—not a sacred reading.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Put three to six marked sticks, shells, or dice in a cup. Marks can be colors or short prompt words used in ${country}.`,
        "Shake and cast onto a cloth. Read the top faces aloud.",
        "The cast picks who must tell a short story, clap a rhythm, or answer a silly question.",
        "Take turns casting until everyone has had at least one prompt.",
        "Use only playful marks. Do not use sacred lots as party toys.",
      ]),
  },
  {
    key: "shadow_play",
    title: "Shadow figures play",
    category: "Dolls & Figures",
    purchase: "generic_toy",
    participants: "1–group",
    year: "ancient–present",
    req: ["Lamp or candle", "Blank wall", "Hands or cut figures"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Night shadow play is common in ${country}: hand animals or simple cut figures on a wall. Light and outline turn a gesture into a tiny show. Some places grew famous puppet arts from the same idea; kids still start with their hands.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `In a dim room, set a lamp so your hands cast sharp shadows on a blank wall about an arm’s length away.`,
        "Make one animal or person with your fingers. Hold it still for three seconds so others can read the shape.",
        `Tell a one-minute folk scene from ${country} (market, animal chase, or greeting) while the shadow moves.`,
        "Optional: cut a cardboard figure, tape it to a stick, and replay the scene with cleaner edges.",
        "Keep flames safe and never leave a candle alone.",
      ]),
  },
  {
    key: "kite_local",
    title: "Local festival kite",
    category: "Outdoor Folk",
    purchase: "outdoor",
    participants: "Alone or 2 people",
    year: "centuries old",
    req: ["Paper or cloth kite", "Line and reel", "Open windy space"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Kite flying is shared worldwide, but makers in ${country} use their own shapes, papers, bridles, and festival days. This entry covers that local kite craft under the wider family of kite play.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Build or buy a paper or cloth kite in a shape used in ${country} (diamond, box, bird, or fighter flat).`,
        "Choose an open field with steady wind. Keep clear of trees and crowds.",
        "Have a helper hold the kite up while you walk backward and pay out line.",
        "Steer with gentle pulls. Bring it down slowly before the wind dies.",
        "Never fly near power lines, airports, or storms.",
      ]),
  },
  {
    key: "cloth_doll_local",
    title: "Local cloth doll",
    category: "Dolls & Figures",
    purchase: "doll",
    participants: "Alone",
    year: "ancient–present",
    req: ["Cloth body", "Stuffing", "Scrap clothing"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Soft cloth dolls dressed in local fabric patterns are common in homes across ${country}. Tiny wraps, sashes, and hairstyles copy everyday dress. Caring for the doll teaches gentle play, and sewing skills pass from one generation to the next.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        "Sew or tie a simple cloth body and stuff it so the head and torso hold shape.",
        `Dress the doll in miniature wraps or embroidered scraps that look like everyday clothes from ${country}.`,
        "Act out at least three care scenes: wake, feed, and put to sleep.",
        "Repair tears with needle and thread instead of throwing the doll away.",
        "Pack the doll into a small basket or box when play ends.",
      ]),
  },
  {
    key: "ball_sewn",
    title: "Sewn cloth or hide ball",
    category: "Ball & Sport",
    purchase: "outdoor",
    participants: "2+ people",
    year: "ancient–present",
    req: ["Sewn cloth, fiber, or hide ball", "Open play space"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Before factory rubber, people in ${country} stuffed and sewed balls from hide, cloth, or plant fiber. Catch, kick, and circle games grew around these homemade balls.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Form a circle of four or more players in a clear yard. Use one sewn cloth, fiber, or hide ball.`,
        "Toss underhand to the neighbor on your right. Score one point for each clean catch.",
        "If someone drops the ball, restart the count from zero—or switch to a gentle kick-around.",
        "Play to ten points, or play until everyone has started a round.",
        "If the seam splits, restuff and restitch before the next game.",
      ]),
  },
  {
    key: "top_local",
    title: "Local spinning top craft",
    category: "Spinning & Tops",
    purchase: "top",
    participants: "Alone or contest group",
    year: "ancient–present",
    req: ["Carved or turned top", "Cord or whip", "Hard flat ground"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Spinning tops are ancient and found almost everywhere. This entry notes how carvers in ${country} shape the tip, wind the cord, and run spinning contests—the same physics toy with local craft habits.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Wind a cord around a carved top from ${country}, or ready a short whip cord if it is a whip top.`,
        "Stand on hard earth or stone. Pull the cord smooth and level so the tip bites and spins.",
        "For whip tops, tap the shoulder lightly to keep it upright for a timed spin.",
        "In a contest, longest continuous spin wins—or play combat where the first top knocked flat loses.",
        "Sand or replace a worn tip so the next spin starts clean.",
      ]),
  },
  {
    key: "string_local",
    title: "Local string figures",
    category: "String & Finger",
    purchase: "string",
    participants: "Alone or 2 people",
    year: "ancient–present",
    req: ["Loop of cord or yarn", "Fingers"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `String figures from ${country} often have local names, animals, and short stories, even when the opening looks like cat’s cradle elsewhere. They are hand patterns you can carry anywhere.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        "Use a loop of cord long enough to stretch between both hands.",
        `Open on both thumbs and little fingers in the starting position taught for figures in ${country}.`,
        "Follow each pick and drop slowly until the named figure appears.",
        "Say the figure’s name or a one-sentence story while you hold the shape.",
        "Return to a clean loop before teaching the next figure.",
      ]),
  },
  {
    key: "board_race_folk",
    title: "Folk race board (local)",
    category: "Board & Race",
    purchase: "generic_board",
    participants: "2–4 people",
    year: "centuries old",
    req: ["Path or cross-and-circle board", "Markers", "Casting sticks, shells, or die"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Path and cross-and-circle race boards appear in many places. In ${country}, players race markers home with shells, sticks, or knucklebones. The track shape and safe spaces may differ, but the race home is the same idea.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Seat 2–4 players at a path or cross-and-circle board used in ${country}. Each player gets four markers in a starting nest.`,
        "Throw two casting sticks, four cowrie shells, or one die. Total the pips or mouth-up shells.",
        "Enter a marker only on the highest single result (for example 4 sticks or a 6), then move that many spaces.",
        "Landing on a lone enemy marker sends it home. Stacked markers are safe.",
        "First player to bring all four markers home wins.",
      ]),
  },
  {
    key: "sowing_local",
    title: "Local pit-and-seed sowing",
    category: "Mancala & Sowing",
    purchase: "mancala",
    participants: "2 people",
    year: "centuries old",
    req: ["Sowing board or pits in earth", "Seeds or stones"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Where sowing games took root in ${country}, boards show local cup counts, relay turns, and wood shapes. They belong to the mancala family, and this entry records the local board habits.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Use a 2×6 board (twelve small pits plus one store per side) common in ${country}. Place four seeds in each small pit.`,
        "On your turn, scoop one pit on your side and drop one seed into each following pit, including your store, skipping the opponent’s store.",
        "If the last seed lands in your store, take another turn.",
        "If the last seed lands in an empty pit on your side, capture that seed and the seeds opposite into your store.",
        "When one side is empty, move leftover seeds to their owners’ stores. Most seeds wins.",
      ]),
  },
  {
    key: "jump_rope",
    title: "Jump-rope & skipping rhymes",
    category: "Outdoor Folk",
    purchase: "outdoor",
    participants: "Alone or 3+ people",
    year: "centuries old",
    req: ["Rope", "Flat ground", "Optional two turners"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Skipping and jump-rope rhymes thrive in schoolyards and streets across ${country}. Solo speed jumps and long-rope group games share the same bounce; the chants make each place sound like itself.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        "For solo play, turn a short rope over your head and jump each pass.",
        "For group play, two turners swing a long rope while one jumper enters on a beat.",
        `Add a short schoolyard chant from ${country}. A missed jump rotates the jumper to turner.`,
        "Count clean jumps. Try for a personal best of 20, then 50.",
        "Stop if the ground is wet or the rope snaps; retie before continuing.",
      ]),
  },
  {
    key: "blindfold_tag",
    title: "Blind man's tag / call games",
    category: "Outdoor Folk",
    purchase: "outdoor",
    participants: "3+ people",
    year: "centuries old",
    req: ["Soft blindfold", "Clear bounded space"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Blindfold seek-and-tag games appear at parties and children’s gatherings in ${country}. Sound, stillness, and care for the blinded player make the game work.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Clear toys and furniture from a bounded room or yard. Mark out-of-bounds lines.`,
        "Blindfold one seeker and spin them twice. Sighted players must stay inside the bounds.",
        "Sighted players may call a short nickname or clap once every five seconds so the seeker has sound cues.",
        "The seeker tags by touch. The tagged player becomes the next seeker.",
        "Remove hard obstacles before each round. No shoving.",
      ]),
  },
  {
    key: "wrestling_play",
    title: "Youth wrestling play",
    category: "Ball & Sport",
    purchase: "outdoor",
    participants: "2 people (+ referee)",
    year: "ancient–present",
    req: ["Soft ground or sand", "Agreed safe holds", "Referee"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Youth wrestling games in ${country} echo adult folk styles, but the play version stays light: safe holds, a marked circle, and laughter over injury.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        "Mark a circle about three paces across on sand or soft ground.",
        "Forbid headlocks, joint twists, and strikes. Grip belts, sashes, or shoulders only.",
        "Start with a handshake. A referee calls start and stop.",
        "Win by making both of the opponent’s shoulders or hips touch the ground, or by pushing them outside the circle—agree the rule before you begin.",
        "Stop at once if anyone feels pain. Reset and try again.",
      ]),
  },
  {
    key: "memory_song",
    title: "Elimination chant game",
    category: "Memory & Word",
    purchase: "generic_toy",
    participants: "3+ people",
    year: "oral antiquity",
    req: ["Shared song or clap pattern", "Circle of players"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Elimination chants and memory songs in ${country} are toys of rhythm and attention. Miss a word or beat and you are out until one player remains.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        "Stand or sit in a circle so everyone can see each other’s hands.",
        `The leader starts a clapping song or elimination chant known in ${country}, one word or beat per player.`,
        "Pass the turn around the circle in time. A wrong word or late clap removes that player.",
        "The last player left starts the next song.",
        "Keep tempos friendly for younger players; speed up only when everyone agrees.",
      ]),
  },
  {
    key: "balance_stilts",
    title: "Play stilts",
    category: "Outdoor Folk",
    purchase: "outdoor",
    participants: "Alone (+ spotter)",
    year: "centuries old",
    req: ["Pair of stilts or can stilts", "Spotter", "Flat ground"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Stilts show up as festival gear and children’s balance toys in ${country}. Makers raise walkers on bamboo, wood, or recycled cans. Racing and trick steps turn height into play.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Mount bamboo, wood, or tin-can stilts made in a local style from ${country}, with a spotter holding your elbow.`,
        "Take five slow steps on flat ground before trying turns.",
        "Race a short marked path only after both walkers can stop safely.",
        "Dismount into a crouch; never jump off from full height.",
        "Check foot pegs and cords before each session.",
      ]),
  },
  {
    key: "leaf_boat",
    title: "Leaf or bark boat race",
    category: "Outdoor Folk",
    purchase: "outdoor",
    participants: "2+ people",
    year: "ancient–present",
    req: ["Leaf, bark, or cork boats", "Gentle stream or basin"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Near water in ${country}, children race tiny boats made from leaves, bark, or corncobs. Currents become tracks, and making the hull is half the fun.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        "Fold a broad leaf or carve a bark/cork hull that floats.",
        "Mark a start and finish on a gentle stream, gutter, or wide basin.",
        "On a shared count of three, release all boats together. No pushing after release.",
        "First boat to the finish without sinking wins. Rebuild any that tip.",
        "Stay out of deep or fast water. An adult should watch stream races.",
      ]),
  },
  {
    key: "snow_or_sand",
    title: "Sand or snow figure play",
    category: "Construction",
    purchase: "outdoor",
    participants: "Alone or group",
    year: "prehistoric–present",
    req: ["Moist sand or packable snow", "Open safe patch"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Wherever sand or snow packs well in ${country}, children build temporary figures—castles, animals, people. The build is the toy, and weather takes it back.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        "Gather moist sand or packable snow from a safe open patch. Never dig undercut cliffs.",
        "Build a base wider than the top so the figure stands.",
        "Optional contest: tallest free-standing tower in five minutes, or best animal likeness.",
        "Photograph favorites if you want to keep them; leave the shore or yard tidy.",
        "Warm hands and change wet clothes after snow play.",
      ]),
  },
  {
    key: "knuckle_football",
    title: "Finger-flick football",
    category: "Ball & Sport",
    purchase: "generic_toy",
    participants: "2 people",
    year: "modern school spread; older flick roots",
    req: ["Table", "Paper or coin ball", "Book or tape goals"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Tabletop finger-flick football spread through schools in ${country}, built on older flicking games. Goals are books or tape posts, and small tournaments can get serious.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        "On a clear table, mark each goal with a gap about three finger-widths wide.",
        "Use a rolled paper ball or smooth button as the ball at center.",
        "Players alternate one finger-flick. No covering the ball with a palm.",
        "A shot through the gap scores one goal. First to five wins.",
        "Reset after each goal. Keep drinks off the table.",
      ]),
  },
  {
    key: "riddle_local",
    title: "Local riddle exchange",
    category: "Memory & Word",
    purchase: "generic_toy",
    participants: "2+ people",
    year: "oral antiquity",
    req: ["Shared language", "Optional elder judge"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Riddle contests in ${country} keep local jokes, nature images, and word play alive. You need no board—only questions, guesses, and a little time pressure.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `One player asks a riddle from ${country} (animals, tools, weather, or food).`,
        "Others have one minute and up to three guesses.",
        "A correct guess scores one point and that person asks the next riddle. If nobody solves it, the asker scores one point and picks the next asker.",
        `Optional playful forfeit for three wrong guesses: clap a rhythm or name five animals from ${country}.`,
        "First to five points wins the exchange.",
      ]),
  },
  {
    key: "ceremonial_toy",
    title: "Festival noisemaker toy",
    category: "Ritual & Ceremony",
    purchase: "music",
    participants: "Alone or parade group",
    year: "centuries old",
    req: ["Ratchet, bell stick, clapper, or drum toy", "Festival context respect"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Festival noisemakers—ratchets, clappers, bell sticks—let children join public celebrations in ${country}. Loud rhythm marks the calendar day. Some toys come out only for the season, then go back into storage.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Ask an adult when ratchets, clappers, or bell sticks are welcome at festivals in ${country}.`,
        "Play short pulses that match the drum or song—usually two or four beats at a time.",
        "Stop at once when leaders raise a hand or the song goes quiet.",
        "Do not copy restricted sacred instruments or mock prayer gestures with the toy.",
        "Put the noisemaker away when the procession ends.",
      ]),
  },
  {
    key: "puzzle_knot",
    title: "Cord & knot puzzle toy",
    category: "Puzzles & Skill",
    purchase: "puzzle",
    participants: "Alone",
    year: "centuries old",
    req: ["Cord, rings, or wire puzzle", "Patience"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Cord, ring, and wire puzzles show up as market toys and smith curiosities around ${country}. You learn by touch: free a ring without forcing, then put the puzzle back together.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Study a cord-and-ring or wire puzzle from ${country}. Note which loop you must free.`,
        "Move loops only through openings that already exist. Do not bend metal or force wood.",
        "Free the target piece by a legal path. The puzzle is solved when that piece comes away cleanly.",
        "Put every loop back to the exact starting state before you claim the solve.",
        "Time your solve, then challenge a friend to beat that time.",
      ]),
  },
  {
    key: "mini_house",
    title: "Miniature household play set",
    category: "Dolls & Figures",
    purchase: "doll",
    participants: "Alone or 2 people",
    year: "ancient–present",
    req: ["Miniature pots, mats, or dolls", "Small play space"],
    desc: (c, civ) =>
      withPlace(c, civ, (country) =>
        `Tiny pots, mats, and doll furniture help children in ${country} act out daily home life. Old finds and family stories both show these teaching toys.`,
      ),
    steps: (c, civ) =>
      withPlace(c, civ, (country) => [
        `Arrange miniature pots, mats, and dolls into a small hearth or room layout familiar in ${country}.`,
        "Assign roles (cook, guest, child) before the scene starts.",
        "Act out one cooking scene, one visiting scene, and one bedtime scene.",
        "Add one new prop each week (ladle, basket, or stool) and reuse it next time.",
        "Pack all pieces into one box after play so the set stays complete.",
      ]),
  },
];
