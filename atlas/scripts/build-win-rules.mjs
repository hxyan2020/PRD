/**
 * Author howToWin + rulesNotToBreak for every curated seed and archetype,
 * then patch English content sources and all locale overlays.
 *
 * Run: node scripts/build-win-rules.mjs
 * Then: node scripts/generate-content-i18n.mjs && npm run data
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "content-i18n-data");

function load(name) {
  return JSON.parse(readFileSync(join(dataDir, name), "utf8"));
}
function save(name, data) {
  writeFileSync(join(dataDir, name), JSON.stringify(data, null, 2) + "\n");
}

/** @type {Record<string, { howToWin: string[], rulesNotToBreak: string[] }>} */
const ARCHETYPE = {
  rattle: {
    howToWin: [
      "There is no score—play succeeds when the baby explores a clear, safe rattle sound with a caregiver close by.",
    ],
    rulesNotToBreak: [
      "Stay within arm’s reach the whole time.",
      "Stop play if the shell cracks or seeds can spill.",
      "Do not let the infant chew through plugs or seams.",
    ],
  },
  whistle_toy: {
    howToWin: [
      "Make one clear long tone, then a short rhythm of three chirps that a partner can copy.",
    ],
    rulesNotToBreak: [
      "Wipe the mouthpiece between players.",
      "Do not share the whistle if anyone is sick.",
      "Keep finger holes and the windway clear—never force objects into them.",
    ],
  },
  pull_toy: {
    howToWin: [
      "Walk a short clear path so the toy follows upright for five to ten steps without tipping.",
    ],
    rulesNotToBreak: [
      "Do not yank the cord hard enough to lift or throw the toy.",
      "Keep the floor clear of trip hazards before parade play.",
      "Store the toy upright so wheels are not left bent under weight.",
    ],
  },
  mini_weapons_toy: {
    howToWin: [
      "First player to 15 points wins (3 center, 2 middle ring, 1 outer).",
    ],
    rulesNotToBreak: [
      "Never aim at people or animals.",
      "Keep a clear downrange area with a backstop.",
      "Pick up every dart or arrow before the next turn.",
    ],
  },
  jacks_local: {
    howToWin: [
      "First player to finish the ones–twos–threes–fours sequence while saying the count wins.",
    ],
    rulesNotToBreak: [
      "Pick up only the allowed number of stones on that turn.",
      "A drop or missed catch ends your turn—restart at ones next time.",
      "Do not disturb the remaining pile while catching.",
    ],
  },
  story_dice_oral: {
    howToWin: [
      "Everyone completes at least one prompted story, clap, or answer; optionally race who finishes a lively round first.",
    ],
    rulesNotToBreak: [
      "Use only playful marks—never sacred lots as party toys.",
      "Keep prompts kind; no humiliating dares.",
      "Take turns casting so nobody is skipped.",
    ],
  },
  shadow_play: {
    howToWin: [
      "Hold a readable shadow shape for three seconds, then finish a one-minute scene others can follow.",
    ],
    rulesNotToBreak: [
      "Keep flames safe and never leave a candle alone.",
      "Keep hands and figures a safe distance from hot lamps.",
      "Do not block exits or crowd the light source.",
    ],
  },
  kite_local: {
    howToWin: [
      "Launch, keep the kite stable in wind, and bring it down under control before the wind dies.",
    ],
    rulesNotToBreak: [
      "Never fly near power lines, airports, or storms.",
      "Keep clear of trees and crowds.",
      "Do not snatch a diving kite blindly—let it land if unsure.",
    ],
  },
  cloth_doll_local: {
    howToWin: [
      "Complete at least three care scenes (wake, feed, sleep) with the doll dressed and intact.",
    ],
    rulesNotToBreak: [
      "Repair tears instead of discarding the doll.",
      "Do not leave needles or pins in the play area.",
      "Pack the doll away so clothing and stuffing stay together.",
    ],
  },
  ball_sewn: {
    howToWin: [
      "First circle to ten clean catches wins, or play until everyone has started a round.",
    ],
    rulesNotToBreak: [
      "Toss underhand unless the group agrees on kicks.",
      "Restitch a split seam before continuing.",
      "Keep the yard clear of glass and hard obstacles.",
    ],
  },
  top_local: {
    howToWin: [
      "Longest continuous spin wins, or in combat play the first top knocked flat loses.",
    ],
    rulesNotToBreak: [
      "Pull the cord level—do not whip toward faces.",
      "Stand on hard ground clear of feet and pets.",
      "Sand or replace a worn tip before the next contest.",
    ],
  },
  string_local: {
    howToWin: [
      "Form the named figure cleanly and hold it while saying its name or a one-sentence story.",
    ],
    rulesNotToBreak: [
      "Do not yank loops so hard that cord cuts into fingers.",
      "Return to a clean loop before teaching the next figure.",
      "Keep the cord away from necks during partner passes.",
    ],
  },
  board_race_folk: {
    howToWin: [
      "First player to bring all four markers home wins.",
    ],
    rulesNotToBreak: [
      "Enter a marker only on the agreed high throw.",
      "Stacked markers are safe—do not capture them.",
      "Move only the number shown by the cast; no silent extra steps.",
    ],
  },
  sowing_local: {
    howToWin: [
      "When one side is empty, count stores—the higher seed total wins.",
    ],
    rulesNotToBreak: [
      "Sow one seed per pit in order; do not skip or double-drop.",
      "Skip the opponent’s store when sowing.",
      "Captures only apply when the last seed lands in an empty pit on your side.",
    ],
  },
  jump_rope: {
    howToWin: [
      "Beat a personal best (try 20, then 50 clean jumps) or outlast others in a group chant round.",
    ],
    rulesNotToBreak: [
      "Stop if the ground is wet or the rope snaps.",
      "Enter a long rope only on the beat—do not shove the jumper.",
      "Give turners space; do not stand in the rope arc.",
    ],
  },
  blindfold_tag: {
    howToWin: [
      "The seeker wins the round by tagging a sighted player by touch; that player becomes the next seeker.",
    ],
    rulesNotToBreak: [
      "No shoving or running the seeker into hard obstacles.",
      "Sighted players must stay inside the marked bounds.",
      "Remove hard objects before each round.",
    ],
  },
  wrestling_play: {
    howToWin: [
      "Win by making both of the opponent’s shoulders or hips touch the ground, or by pushing them outside the circle—agree which rule before you start.",
    ],
    rulesNotToBreak: [
      "No headlocks, joint twists, or strikes.",
      "Grip only belts, sashes, or shoulders as agreed.",
      "Stop at once if anyone feels pain.",
    ],
  },
  memory_song: {
    howToWin: [
      "Last player remaining after elimination starts the next song and is the round winner.",
    ],
    rulesNotToBreak: [
      "A wrong word or late clap removes that player—no restarts mid-pass.",
      "Keep tempos friendly unless everyone agrees to speed up.",
      "Do not shove players out of the circle.",
    ],
  },
  balance_stilts: {
    howToWin: [
      "Complete five controlled steps, then a short marked path race only after both walkers can stop safely.",
    ],
    rulesNotToBreak: [
      "Always use a spotter when mounting.",
      "Never jump off from full height—dismount into a crouch.",
      "Check foot pegs and cords before each session.",
    ],
  },
  leaf_boat: {
    howToWin: [
      "First boat to the finish without sinking wins.",
    ],
    rulesNotToBreak: [
      "No pushing boats after the shared release count.",
      "Stay out of deep or fast water.",
      "An adult must watch stream races.",
    ],
  },
  snow_or_sand: {
    howToWin: [
      "Optional contest: tallest free-standing tower in five minutes, or the best animal likeness by group vote.",
    ],
    rulesNotToBreak: [
      "Never dig undercut cliffs or tunnels that can collapse.",
      "Build a base wider than the top.",
      "Leave the shore or yard tidy when you finish.",
    ],
  },
  knuckle_football: {
    howToWin: [
      "First player to five goals wins.",
    ],
    rulesNotToBreak: [
      "One finger-flick per turn—no covering the ball with a palm.",
      "Keep drinks off the table.",
      "Reset to center after each goal.",
    ],
  },
  riddle_local: {
    howToWin: [
      "First player to five points wins the exchange.",
    ],
    rulesNotToBreak: [
      "At most three guesses and one minute per riddle.",
      "Keep forfeits playful—never cruel.",
      "The asker reveals the answer only after guesses are done.",
    ],
  },
  ceremonial_toy: {
    howToWin: [
      "Join the festival pulse: play short matching beats and stop cleanly when leaders signal silence.",
    ],
    rulesNotToBreak: [
      "Only use noisemakers when adults say they are welcome.",
      "Do not copy restricted sacred instruments or mock prayer gestures.",
      "Put the toy away when the procession ends.",
    ],
  },
  puzzle_knot: {
    howToWin: [
      "Free the target piece by a legal path, then restore the exact starting state; optionally beat a timed solve.",
    ],
    rulesNotToBreak: [
      "Do not bend metal or force wood.",
      "Move loops only through openings that already exist.",
      "Do not claim a solve until the puzzle is fully reset.",
    ],
  },
  mini_house: {
    howToWin: [
      "Finish one cooking scene, one visiting scene, and one bedtime scene with roles assigned.",
    ],
    rulesNotToBreak: [
      "Keep miniature pieces out of real mouths and heat sources.",
      "Pack the full set into one box after play.",
      "Do not break props to “force” a story ending.",
    ],
  },
};

/** Hand-authored curated overrides (id → win/rules). Others are derived. */
/** @type {Record<string, { howToWin: string[], rulesNotToBreak: string[] }>} */
const CURATED_OVERRIDE = {
  "game-0001": {
    howToWin: [
      "Checkmate the opponent’s king: it is under attack and has no legal escape, block, or capture.",
    ],
    rulesNotToBreak: [
      "Do not leave your own king in check.",
      "Move each piece only as its rules allow (including castling and en passant conditions).",
      "Players alternate turns; White moves first.",
    ],
  },
  "game-0002": {
    howToWin: [
      "After both players pass, the higher score of territory plus captives wins (scoring rules vary by country).",
    ],
    rulesNotToBreak: [
      "Do not recreate the previous full-board position (ko).",
      "Do not play suicidal moves unless they capture.",
      "Stones do not move after placement—only place or pass.",
    ],
  },
  "game-0003": {
    howToWin: [
      "Checkmate the opposing general (jiang/shuai).",
    ],
    rulesNotToBreak: [
      "Generals may not face each other on an open file.",
      "Pieces must follow xiangqi move and river rules.",
      "Do not leave your general in check.",
    ],
  },
  "game-0004": {
    howToWin: [
      "Checkmate or forcibly impasse the opposing king under shogi rules; drops are part of legal play.",
    ],
    rulesNotToBreak: [
      "Captured pieces may be dropped later—respect nifu and other drop bans.",
      "Do not leave your king in check.",
      "Promote only when entering, leaving, or moving inside the promotion zone as rules allow.",
    ],
  },
  "game-0005": {
    howToWin: [
      "When one player’s pits are empty, count stores—the higher seed total wins (ties are draws).",
    ],
    rulesNotToBreak: [
      "Sow counterclockwise one seed per pit; skip the opponent’s store.",
      "Take an extra turn only when the last seed lands in your store.",
      "Capture only from the empty-pit-on-your-side case defined for the variant.",
    ],
  },
  "game-0006": {
    howToWin: [
      "First player to bear all fifteen checkers off the board wins.",
    ],
    rulesNotToBreak: [
      "Enter from the bar before moving other checkers when you have one on the bar.",
      "Do not land on a point with two or more opposing checkers.",
      "Bear off only when all of your checkers are in your home board.",
    ],
  },
  "game-0037": {
    howToWin: [
      "Pull the center marker across your team’s line.",
    ],
    rulesNotToBreak: [
      "Do not wrap the rope around limbs under sport rules.",
      "Stay behind your foul line.",
      "Stop immediately if someone slips dangerously.",
    ],
  },
  "game-0048": {
    howToWin: [
      "Be the last player who is not bankrupt.",
    ],
    rulesNotToBreak: [
      "Pay rent when you land on an owned property you do not own.",
      "Build houses only on complete color sets as the rules allow.",
      "Resolve debts honestly—no hiding cash from the bank.",
    ],
  },
  "game-0049": {
    howToWin: [
      "The player who topples the tower loses (or the previous player wins, by house rule).",
    ],
    rulesNotToBreak: [
      "Remove only one block per turn, below the incomplete top layer.",
      "Use one hand only when removing and stacking.",
      "Do not steady the tower with your other hand.",
    ],
  },
};

function uniq(list) {
  const out = [];
  const seen = new Set();
  for (const s of list) {
    const t = String(s || "").trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function deriveFromSteps(steps, { name = "", category = "" } = {}) {
  const win = [];
  const rules = [];
  for (const s of steps || []) {
    if (
      /\b(win|wins|winner|checkmate|majority|highest score|first to|score one|scores? |bear off|bankrupt|topples?|last player|most seeds|higher (total|score|store))\b/i.test(
        s,
      )
    ) {
      win.push(s);
    }
    if (
      /\b(never|do not|don't|avoid|must not|illegal|foul|no shoving|no hands|stop (at once|immediately)|not aim|not share|not leave|forbid|without)\b/i.test(
        s,
      )
    ) {
      rules.push(s);
    }
  }
  if (!win.length) {
    if (/Dolls|Musical|Construction|Ritual/i.test(category) || /doll|tea|slinky|rattle|poi/i.test(name)) {
      win.push(
        "There is no competitive score—succeed by completing the intended play safely and as described in the steps.",
      );
    } else {
      win.push(
        "Complete the stated goal first, or hold the best score when the round ends, as described in the how-to-play steps.",
      );
    }
  }
  if (!rules.length) {
    rules.push("Follow turn order and any house rules everyone agreed before play.");
    rules.push("Stop immediately if equipment breaks or anyone risks injury.");
  }
  return {
    howToWin: uniq(win).slice(0, 3),
    rulesNotToBreak: uniq(rules).slice(0, 4),
  };
}

/** Lightweight zh-Hans translations for common patterns + curated/archetype packs. */
function toZhHans(text) {
  const map = [
    ["There is no score—play succeeds when the baby explores a clear, safe rattle sound with a caregiver close by.", "不计分——看护者近旁时，婴儿能安全探索清晰的摇铃声即算成功。"],
    ["Stay within arm’s reach the whole time.", "全程待在一臂之内。"],
    ["Stop play if the shell cracks or seeds can spill.", "外壳开裂或种子可能漏出时立即停止。"],
    ["Do not let the infant chew through plugs or seams.", "勿让婴儿咬穿塞子或接缝。"],
    ["Checkmate the opponent’s king: it is under attack and has no legal escape, block, or capture.", "将死对方的王：王被攻击且无法合法躲避、垫将或吃子解将。"],
    ["Do not leave your own king in check.", "不可让己方的王处于被将军状态。"],
    ["Move each piece only as its rules allow (including castling and en passant conditions).", "每枚棋子只能按规则走法移动（含王车易位与吃过路兵条件）。"],
    ["Players alternate turns; White moves first.", "双方轮流走子；白方先行。"],
    ["Pull the center marker across your team’s line.", "把中线标记拉过己方端线。"],
    ["Do not wrap the rope around limbs under sport rules.", "竞技规则下勿把绳缠绕肢体。"],
    ["Stay behind your foul line.", "站在己方犯规线之后。"],
    ["Stop immediately if someone slips dangerously.", "有人危险滑倒时立即停止。"],
    ["Be the last player who is not bankrupt.", "成为最后一个尚未破产的玩家。"],
    ["The player who topples the tower loses (or the previous player wins, by house rule).", "推倒塔楼的玩家判负（或按约定由上一家获胜）。"],
    ["Remove only one block per turn, below the incomplete top layer.", "每回合只抽一块位于未完成顶层之下的木块。"],
    ["Use one hand only when removing and stacking.", "抽取与叠放时只用一只手。"],
    ["Do not steady the tower with your other hand.", "不得用另一只手扶塔。"],
    ["First player to bring all four markers home wins.", "最先把四枚棋子全部送回家的玩家获胜。"],
    ["When one side is empty, count stores—the higher seed total wins.", "一方坑位空后清点库中种子——较多者胜。"],
    ["First player to five goals wins.", "先得到五球者胜。"],
    ["First player to five points wins the exchange.", "先得到五分者赢得本轮对答。"],
    ["Never aim at people or animals.", "绝不可瞄准人或动物。"],
    ["Never fly near power lines, airports, or storms.", "绝不可在电线、机场或暴风雨附近放飞。"],
    ["Follow turn order and any house rules everyone agreed before play.", "遵守出牌/行动顺序以及开局前大家同意的约定。"],
    ["Stop immediately if equipment breaks or anyone risks injury.", "器具损坏或有人有受伤风险时立即停止。"],
    ["There is no competitive score—succeed by completing the intended play safely and as described in the steps.", "无竞技计分——安全地按步骤完成预定玩法即算成功。"],
    ["Complete the stated goal first, or hold the best score when the round ends, as described in the how-to-play steps.", "按玩法步骤：先完成既定目标，或在回合结束时保持最高分。"],
  ];
  for (const [en, zh] of map) {
    if (text === en) return zh;
  }
  // Light structural fallbacks
  let s = text;
  s = s.replace(/^First player to (.+) wins\.?$/i, "最先$1的玩家获胜。");
  s = s.replace(/^Never (.+)\.?$/i, "绝不可$1。");
  s = s.replace(/^Do not (.+)\.?$/i, "不可$1。");
  s = s.replace(/^Stop immediately if (.+)\.?$/i, "若$1，立即停止。");
  if (s === text && /^[\x00-\x7F“”‘’—–…]+$/.test(text)) {
    // leave English for later; mark as needing review by returning as-is
    return text;
  }
  return s;
}

function toZhHant(hans) {
  const table = {
    国: "國", 战: "戰", 东: "東", 车: "車", 马: "馬", 发: "發", 现: "現", 时: "時",
    来: "來", 过: "過", 进: "進", 这: "這", 个: "個", 为: "為", 与: "與", 从: "從",
    对: "對", 会: "會", 还: "還", 说: "說", 种: "種", 经: "經", 后: "後", 开: "開",
    关: "關", 门: "門", 长: "長", 书: "書", 学: "學", 儿: "兒", 戏: "戲", 游: "遊",
    乐: "樂", 胜: "勝", 负: "負", 规: "規", 则: "則", 数: "數", 点: "點", 线: "線",
    盘: "盤", 传: "傳", 统: "統", 记: "記", 录: "錄", 称: "稱", 类: "類", 区: "區",
    场: "場", 员: "員", 们: "們", 于: "於", 并: "並", 两: "兩", 内: "內", 当: "當",
    应: "應", 该: "該", 让: "讓", 给: "給", 着: "著", 样: "樣", 气: "氣", 风: "風",
    头: "頭", 见: "見", 觉: "覺", 听: "聽", 话: "話", 语: "語", 认: "認", 识: "識",
    请: "請", 问: "問", 题: "題", 难: "難", 单: "單", 复: "複", 简: "簡", 边: "邊",
    际: "際", 达: "達", 运: "運", 动: "動", 变: "變", 换: "換", 选: "選", 择: "擇",
    获: "獲", 续: "續", 断: "斷", 终: "終", 结: "結", 构: "構", 术: "術", 艺: "藝",
    华: "華", 亚: "亞", 欧: "歐", 岛: "島", 湾: "灣", 陆: "陸", 军: "軍", 将: "將",
    约: "約", 纪: "紀", 众: "眾", 乡: "鄉", 节: "節", 庆: "慶", 仪: "儀", 绳: "繩",
    队: "隊", 强: "強", 远: "遠", 满: "滿", 齐: "齊", 备: "備", 设: "設", 计: "計",
    产: "產", 业: "業", 买: "買", 卖: "賣", 价: "價", 钱: "錢", 页: "頁", 纸: "紙",
    笔: "筆", 画: "畫", 图: "圖", 响: "響", 声: "聲", 读: "讀", 写: "寫", 码: "碼",
    号: "號", 证: "證", 试: "試", 验: "驗", 护: "護", 险: "險", 伤: "傷", 医: "醫",
    药: "藥", 疗: "療", 养: "養", 饭: "飯", 馆: "館", 厅: "廳", 楼: "樓", 广: "廣",
    园: "園", 树: "樹", 叶: "葉", 鸟: "鳥", 鱼: "魚", 兽: "獸", 猫: "貓", 实: "實",
    质: "質", 标: "標", 准: "準", 权: "權", 务: "務", 义: "義", 联: "聯", 网: "網",
    络: "絡", 台: "臺", 里: "裡", 体: "體", 积: "積", 状: "狀", 态: "態", 况: "況",
    势: "勢", 导: "導", 师: "師", 妇: "婦", 龄: "齡", 岁: "歲", 钟: "鐘", 热: "熱",
    湿: "濕", 干: "乾", 云: "雲", 电: "電", 红: "紅", 绿: "綠", 蓝: "藍", 黄: "黃",
    铁: "鐵", 铜: "銅", 银: "銀", 钢: "鋼", 击: "擊", 抛: "拋", 败: "敗", 赢: "贏",
    输: "輸", 却: "卻", 须: "須", 愿: "願", 欢: "歡", 惊: "驚", 兴: "興", 虑: "慮",
    决: "決", 舍: "捨", 弃: "棄", 摆: "擺", 暂: "暫", 虽: "雖", 论: "論", 显: "顯",
    极: "極", 较: "較", 够: "夠", 绝: "絕", 毕: "畢", 总: "總", 么: "麼", 据: "據",
    围: "圍", 观: "觀", 库: "庫", 种: "種", 子: "子", 坑: "坑", 位: "位", 清: "清",
    点: "點", 较: "較", 多: "多", 者: "者", 胜: "勝", 先: "先", 得: "得", 到: "到",
    五: "五", 球: "球", 分: "分", 轮: "輪", 对: "對", 答: "答", 不可: "不可", 瞄准: "瞄準",
    人: "人", 或: "或", 动物: "動物", 在: "在", 电线: "電線", 机场: "機場", 暴风雨: "暴風雨",
    附近: "附近", 放飞: "放飛", 遵守: "遵守", 出牌: "出牌", 行动: "行動", 顺序: "順序",
    以及: "以及", 开局: "開局", 前: "前", 大家: "大家", 同意: "同意", 的: "的", 约定: "約定",
    器具: "器具", 损坏: "損壞", 有人: "有人", 受伤: "受傷", 风险: "風險", 时: "時", 立即: "立即",
    停止: "停止", 无: "無", 竞技: "競技", 计分: "計分", 安全: "安全", 地: "地", 按: "按",
    步骤: "步驟", 完成: "完成", 预定: "預定", 玩法: "玩法", 即: "即", 算: "算", 成功: "成功",
    既定: "既定", 目标: "目標", 回合: "回合", 结束: "結束", 保持: "保持", 最高: "最高",
    将死: "將死", 对方: "對方", 王: "王", 被: "被", 攻击: "攻擊", 且: "且", 无法: "無法",
    合法: "合法", 躲避: "躲避", 垫将: "墊將", 吃子: "吃子", 解将: "解將", 己方: "己方",
    处于: "處於", 将军: "將軍", 状态: "狀態", 每枚: "每枚", 棋子: "棋子", 只能: "只能",
    规则: "規則", 走法: "走法", 移动: "移動", 含: "含", 王车: "王車", 易位: "易位",
    与: "與", 吃过路兵: "吃過路兵", 条件: "條件", 双方: "雙方", 轮流: "輪流", 走子: "走子",
    白方: "白方", 先行: "先行", 把: "把", 中线: "中線", 标记: "標記", 拉过: "拉過",
    端线: "端線", 竞技: "競技", 下: "下", 勿: "勿", 绳: "繩", 缠绕: "纏繞", 肢体: "肢體",
    站在: "站在", 犯规线: "犯規線", 之后: "之後", 危险: "危險", 滑倒: "滑倒", 成为: "成為",
    最后: "最後", 一个: "一個", 尚未: "尚未", 破产: "破產", 的: "的", 玩家: "玩家",
    推倒: "推倒", 塔楼: "塔樓", 判负: "判負", 或按: "或按", 上一家: "上一家", 获胜: "獲勝",
    每回: "每回", 合: "合", 只: "只", 抽: "抽", 一块: "一塊", 位于: "位於", 未完成: "未完成",
    顶层: "頂層", 之下: "之下", 木块: "木塊", 抽取: "抽取", 叠放: "疊放", 只用: "只用",
    一只手: "一隻手", 不得: "不得", 用: "用", 另一只: "另一隻", 手: "手", 扶塔: "扶塔",
    最先: "最先", 四枚: "四枚", 全部: "全部", 送回: "送回", 家: "家", 一方: "一方",
    空后: "空後", 清点: "清點", 库中: "庫中", 种子: "種子", 较多者: "較多者", 胜: "勝",
  };
  let out = "";
  for (const ch of hans) out += table[ch] || ch;
  return out
    .replaceAll("游戏", "遊戲")
    .replaceAll("规则", "規則")
    .replaceAll("获胜", "獲勝")
    .replaceAll("将军", "將軍")
    .replaceAll("计分", "計分");
}

const enCur = load("curated-en.json");
const enArch = load("archetypes-en.json");
const curI18n = load("curated-i18n.json");
const archI18n = load("archetypes-i18n.json");

let curatedBuilt = 0;
for (const [id, entry] of Object.entries(enCur)) {
  const pack =
    CURATED_OVERRIDE[id] ||
    deriveFromSteps(entry.howToPlay, {
      name: entry.name,
      category: entry.category,
    });
  entry.howToWin = pack.howToWin;
  entry.rulesNotToBreak = pack.rulesNotToBreak;
  curatedBuilt++;
}

let archBuilt = 0;
for (const [key, entry] of Object.entries(enArch)) {
  const pack = ARCHETYPE[key];
  if (!pack) throw new Error(`Missing archetype win/rules for ${key}`);
  entry.howToWin = pack.howToWin;
  entry.rulesNotToBreak = pack.rulesNotToBreak;
  archBuilt++;
}

save("curated-en.json", enCur);
save("archetypes-en.json", enArch);

const LOCALES = Object.keys(curI18n);
for (const loc of LOCALES) {
  for (const [id, entry] of Object.entries(curI18n[loc])) {
    const en = enCur[id];
    if (!en) continue;
    if (loc === "zh-Hans") {
      entry.howToWin = en.howToWin.map(toZhHans);
      entry.rulesNotToBreak = en.rulesNotToBreak.map(toZhHans);
    } else if (loc === "zh-Hant") {
      entry.howToWin = en.howToWin.map((s) => toZhHant(toZhHans(s)));
      entry.rulesNotToBreak = en.rulesNotToBreak.map((s) => toZhHant(toZhHans(s)));
    } else {
      // Keep English until locale packs are authored; preferCompleteText still works.
      entry.howToWin = [...en.howToWin];
      entry.rulesNotToBreak = [...en.rulesNotToBreak];
    }
  }
  for (const [key, entry] of Object.entries(archI18n[loc])) {
    const en = enArch[key];
    if (!en) continue;
    if (loc === "zh-Hans") {
      entry.howToWin = en.howToWin.map(toZhHans);
      entry.rulesNotToBreak = en.rulesNotToBreak.map(toZhHans);
    } else if (loc === "zh-Hant") {
      entry.howToWin = en.howToWin.map((s) => toZhHant(toZhHans(s)));
      entry.rulesNotToBreak = en.rulesNotToBreak.map((s) => toZhHant(toZhHans(s)));
    } else {
      entry.howToWin = [...en.howToWin];
      entry.rulesNotToBreak = [...en.rulesNotToBreak];
    }
  }
}

save("curated-i18n.json", curI18n);
save("archetypes-i18n.json", archI18n);

// Export helper map for generate-collection.mjs
writeFileSync(
  join(__dirname, "win-rules-en.json"),
  JSON.stringify(
    {
      archetypes: Object.fromEntries(
        Object.entries(enArch).map(([k, v]) => [
          k,
          { howToWin: v.howToWin, rulesNotToBreak: v.rulesNotToBreak },
        ]),
      ),
      curatedByName: Object.fromEntries(
        Object.entries(enCur).map(([, v]) => [
          v.name,
          { howToWin: v.howToWin, rulesNotToBreak: v.rulesNotToBreak },
        ]),
      ),
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `Built win/rules for ${curatedBuilt} curated + ${archBuilt} archetypes; patched all ${LOCALES.length} locale overlays.`,
);
