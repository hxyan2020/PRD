/**
 * Curated short YouTube intros for every Fatum Atlas rite.
 * Shown on the studio intro page (before About / How to play).
 * IDs validated via YouTube oEmbed; captions are short teaching labels.
 */
(function () {
  "use strict";

  const VIDEOS = {
    "abjad": {
      youtubeId: "A19m2V7n6RU",
      caption: "Intro: Abjad Ilm al-Huroof",
      captionZh: "简介：阿布贾德数字命理如何运作",
      captionHant: "簡介：阿布賈德數字命理如何運作"
    },
    "aboriginal-sky": {
      youtubeId: "aqiISsDkcPc",
      caption: "Intro: Indigenous elders stars",
      captionZh: "简介：原住民天空知识如何运作",
      captionHant: "簡介：原住民天空知识如何運作"
    },
    "afa": {
      youtubeId: "gt6ROIIEfCU",
      caption: "Intro: Igba Afa Igbo",
      captionZh: "简介：阿法占（Igba Afa）如何运作",
      captionHant: "簡介：阿法占（Igba Afa）如何運作"
    },
    "akan-day": {
      youtubeId: "tdHoryj1j8M",
      caption: "Intro: Akan Day Names",
      captionZh: "简介：阿坎日名宿命如何运作",
      captionHant: "簡介：阿坎日名宿命如何運作"
    },
    "andean-wata": {
      youtubeId: "cFE8w7Ut_Lg",
      caption: "Intro: Andean despacho ayni",
      captionZh: "简介：安第斯瓦塔占如何运作",
      captionHant: "簡介：安第斯瓦塔占如何運作"
    },
    "angel-numbers": {
      youtubeId: "IrZknLLYp-A",
      caption: "Intro: What Are Angel Numbers and Where Do They Come From? | SymbolSage",
      captionZh: "简介：天使数字如何运作",
      captionHant: "簡介：天使數字如何運作"
    },
    "anka-jyotisha": {
      youtubeId: "gR5DH_Us9k4",
      caption: "Intro: Ank jyotish",
      captionZh: "简介：数字占星如何运作",
      captionHant: "簡介：數字占星如何運作"
    },
    "apple-peel": {
      youtubeId: "KyVBlqoYM2Q",
      caption: "Intro: Apple divination to try at the Witches Sabbat of Samhain",
      captionZh: "简介：苹果皮占如何运作",
      captionHant: "簡介：苹果皮占如何運作"
    },
    "ashtamangala": {
      youtubeId: "3wtw8GIJwGo",
      caption: "Intro: Ashtamangala prasna",
      captionZh: "简介：八吉祥占如何运作",
      captionHant: "簡介：八吉祥占如何運作"
    },
    "astragalomancy": {
      youtubeId: "fHsHSGu7TDA",
      caption: "Intro: Hellenic knucklebones",
      captionZh: "简介：距骨占如何运作",
      captionHant: "簡介：距骨占如何運作"
    },
    "astrocartography": {
      youtubeId: "V-nhmF6rmtc",
      caption: "Intro: Astrocartography map",
      captionZh: "简介：星图地理（Astrocartography）如何运作",
      captionHant: "簡介：星圖地理（Astrocartography）如何運作"
    },
    "augury": {
      youtubeId: "NP9FEWE8IKU",
      caption: "Intro: The Mystery of the Roman Augurs: Ancient Insight into Modern Decision-Making",
      captionZh: "简介：鸟占如何运作",
      captionHant: "簡介：鳥占如何運作"
    },
    "aura-reading": {
      youtubeId: "60f2UfDJfYg",
      caption: "Intro: How To See Auras (Step By Step)",
      captionZh: "简介：灵气／气场解读如何运作",
      captionHant: "簡介：靈气／气场解讀如何運作"
    },
    "awdunigist": {
      youtubeId: "_MqstVIQXF4",
      caption: "Intro: Ethiopian Astrology",
      captionZh: "简介：数星占如何运作",
      captionHant: "簡介：數星占如何運作"
    },
    "ayahuasca-vision": {
      youtubeId: "fXkqrVuEl4w",
      caption: "Intro: Ayahuasca - a short film by Bruce Parry",
      captionZh: "简介：死藤水神视（记述）如何运作",
      captionHant: "簡介：死藤水神视（記述）如何運作"
    },
    "aztec-tonalpohualli": {
      youtubeId: "U2qI7z7Z7aA",
      caption: "Intro: Tonalpohualli day count",
      captionZh: "简介：阿兹特克神历如何运作",
      captionHant: "簡介：阿兹特克神历如何運作"
    },
    "bagua": {
      youtubeId: "Bwh9bVi-i7M",
      caption: "Intro: I Ching 3 coin method",
      captionZh: "简介：八卦（铜钱起卦）如何运作",
      captionHant: "簡介：八卦（銅錢起卦）如何運作"
    },
    "baltic-finnic": {
      youtubeId: "wd66KjBFMXo",
      caption: "Intro: Finnish Mythologies: The Magpie",
      captionZh: "简介：波罗的—芬兰民俗占如何运作",
      captionHant: "簡介：波罗的—芬蘭民俗占如何運作"
    },
    "baraja": {
      youtubeId: "_HJfEUBpyRw",
      caption: "Intro: Baraja Espanola",
      captionZh: "简介：西班牙纸牌占如何运作",
      captionHant: "簡介：西班牙紙牌占如何運作"
    },
    "bazhai": {
      youtubeId: "3pe7FTwYhJg",
      caption: "Intro: Eight Mansions Ba Zhai",
      captionZh: "简介：八宅风水如何运作",
      captionHant: "簡介：八宅風水如何運作"
    },
    "bazi": {
      youtubeId: "_TFZEUZhn0k",
      caption: "Intro: BaZi Four Pillars INTRODUCTION",
      captionZh: "简介：八字（四柱命理）如何运作",
      captionHant: "簡介：八字（四柱命理）如何運作"
    },
    "belomancy": {
      youtubeId: "cDVmpgSGjP0",
      caption: "Intro: Arrow Divination",
      captionZh: "简介：箭卜（Belomancy）如何运作",
      captionHant: "簡介：箭卜（Belomancy）如何運作"
    },
    "benge": {
      youtubeId: "mpiRv3r6B_w",
      caption: "Intro: Azande poison oracle",
      captionZh: "简介：本格毒谕（历史记述）如何运作",
      captionHant: "簡介：本格毒谕（历史記述）如何運作"
    },
    "benin-fa": {
      youtubeId: "sVUl3JN8nJs",
      caption: "Intro: Fa Fon Benin",
      captionZh: "简介：丰人法占（Fá）如何运作",
      captionHant: "簡介：丰人法占（Fá）如何運作"
    },
    "benmingnian": {
      youtubeId: "kdZVdcH83Y4",
      caption: "Intro: Ben Ming Nian",
      captionZh: "简介：本命年（犯太岁）如何运作",
      captionHant: "簡介：本命年（犯太歲）如何運作"
    },
    "bibliomancy": {
      youtubeId: "er19-4OGc-o",
      caption: "Intro: Bibliomancy book divination",
      captionZh: "简介：书占（Sortes）如何运作",
      captionHant: "簡介：書占（Sortes）如何運作"
    },
    "biorhythm": {
      youtubeId: "dLbYAEIPqh4",
      caption: "Intro: The Strange Algorithm People Used To Run Their Lives",
      captionZh: "简介：生物节律如何运作",
      captionHant: "簡介：生物節律如何運作"
    },
    "blood-type": {
      youtubeId: "ueS2xdrUPCc",
      caption: "Intro: Blood type personality Japan",
      captionZh: "简介：血型性格如何运作",
      captionHant: "簡介：血型性格如何運作"
    },
    "boi-kieu": {
      youtubeId: "h2A4kDv7JDw",
      caption: "Intro: Boi Kieu",
      captionZh: "简介：咏翘诗占如何运作",
      captionHant: "簡介：詠翹詩占如何運作"
    },
    "buzios": {
      youtubeId: "VAWjknbYNKY",
      caption: "Intro: Jogo de Buzios",
      captionZh: "简介：巴西贝壳占（Búzios）如何运作",
      captionHant: "簡介：巴西貝壳占（Búzios）如何運作"
    },
    "capnomancy": {
      youtubeId: "7nnnaL6pl8M",
      caption: "Intro: smoke/flame scrying",
      captionZh: "简介：烟占如何运作",
      captionHant: "簡介：烟占如何運作"
    },
    "cartomancy": {
      youtubeId: "YuSwu3YELRk",
      caption: "Intro: Playing card cartomancy",
      captionZh: "简介：扑克牌占如何运作",
      captionHant: "簡介：撲克牌占如何運作"
    },
    "celtic-tree": {
      youtubeId: "U75XLfYrxFI",
      caption: "Intro: Celtic Tree Calendar",
      captionZh: "简介：凯尔特树历如何运作",
      captionHant: "簡介：凱爾特樹曆如何運作"
    },
    "ceromancy": {
      youtubeId: "gom6H6T11Z0",
      caption: "Intro: Candle wax in water",
      captionZh: "简介：蜡占如何运作",
      captionHant: "簡介：蜡占如何運作"
    },
    "cezi": {
      youtubeId: "U2PX-wfmmcc",
      caption: "Intro: Cezi character divination",
      captionZh: "简介：测字如何运作",
      captionHant: "簡介：測字如何運作"
    },
    "chabashira": {
      youtubeId: "5pFgKqp93iQ",
      caption: "Intro: Chabashira tea stalk",
      captionZh: "简介：茶柱占如何运作",
      captionHant: "簡介：茶柱占如何運作"
    },
    "chenggu": {
      youtubeId: "vxfQaM_bxd4",
      caption: "Intro: Chenggu weighing bone",
      captionZh: "简介：称骨算命如何运作",
      captionHant: "簡介：称骨算命如何運作"
    },
    "chinese-zodiac": {
      youtubeId: "may2s9j4RLk",
      caption: "Intro: Chinese zodiac TED-Ed",
      captionZh: "简介：生肖（十二属相）如何运作",
      captionHant: "簡介：生肖（十二属相）如何運作"
    },
    "cleromancy": {
      youtubeId: "fHsHSGu7TDA",
      caption: "Intro: Hellenic casting lots",
      captionZh: "简介：抽签术如何运作",
      captionHant: "簡介：抽籤術如何運作"
    },
    "coca-leaves": {
      youtubeId: "YtdW-zl5z1U",
      caption: "Intro: La VERITÀ sulle foglie di COCA",
      captionZh: "简介：古柯叶占如何运作",
      captionHant: "簡介：古柯叶占如何運作"
    },
    "coffee-tasseography": {
      youtubeId: "AHCJu7iLSMo",
      caption: "Intro: Turkish coffee reading",
      captionZh: "简介：土耳其咖啡占如何运作",
      captionHant: "簡介：土耳其咖啡占如何運作"
    },
    "daliuren": {
      youtubeId: "ZxTl7yskZVs",
      caption: "Intro: Da Liu Ren Explained",
      captionZh: "简介：大六壬如何运作",
      captionHant: "簡介：大六壬如何運作"
    },
    "delphi": {
      youtubeId: "_I0-q-uYul4",
      caption: "Intro: Oracle of Delphi",
      captionZh: "简介：德尔斐神谕／皮提亚如何运作",
      captionHant: "簡介：德爾斐神諭／皮提亞如何運作"
    },
    "dene-stars": {
      youtubeId: "zJr6ps9U7hI",
      caption: "Intro: Northern Dene Astronomy",
      captionZh: "简介：德内星象知识如何运作",
      captionHant: "簡介：德内星象知识如何運作"
    },
    "dilogun": {
      youtubeId: "65cukKLY3s4",
      caption: "Intro: Ifa/cowrie process",
      captionZh: "简介：迪洛贡贝壳占如何运作",
      captionHant: "簡介：迪洛贡貝壳占如何運作"
    },
    "dlera": {
      youtubeId: "SipVQ7tE9s4",
      caption: "Intro: Rhumsiki Crab Sorcerer",
      captionZh: "简介：蟹占（Dlera）如何运作",
      captionHant: "簡介：蟹占（Dlera）如何運作"
    },
    "dogon-fox": {
      youtubeId: "AdfnblL86ZA",
      caption: "Intro: Dogon fox tracks",
      captionZh: "简介：多贡狐迹占如何运作",
      captionHant: "簡介：多贡狐迹占如何運作"
    },
    "domino": {
      youtubeId: "fHsHSGu7TDA",
      caption: "Intro: Divination in Hellenism | HELLENISM 101",
      captionZh: "简介：骨牌占如何运作",
      captionHant: "簡介：骨牌占如何運作"
    },
    "dowsing": {
      youtubeId: "LWU2mJJ5Ono",
      caption: "Intro: Pendulum Dowsing",
      captionZh: "简介：卜杖探寻如何运作",
      captionHant: "簡介：卜杖探寻如何運作"
    },
    "dream-interp": {
      youtubeId: "bN-KS2n5fzM",
      caption: "Intro: Why Artemidorus Was Way Ahead of His Time",
      captionZh: "简介：解梦如何运作",
      captionHant: "簡介：解夢如何運作"
    },
    "egyptian-decan": {
      youtubeId: "bRxiV1v6j8k",
      caption: "Intro: Egyptian Decans",
      captionZh: "简介：埃及旬星占如何运作",
      captionHant: "簡介：埃及旬星占如何運作"
    },
    "egyptian-dream": {
      youtubeId: "42fUsF2W7lk",
      caption: "Intro: Egyptian dream temples",
      captionZh: "简介：埃及梦占／寝庙如何运作",
      captionHant: "簡介：埃及夢占／寝庙如何運作"
    },
    "fal-hafez": {
      youtubeId: "cIZMWwHMC9s",
      caption: "Intro: Fal-e Hafez",
      captionZh: "简介：哈菲兹诗占如何运作",
      captionHant: "簡介：哈菲茲詩占如何運作"
    },
    "falak": {
      youtubeId: "eFChQrywc28",
      caption: "Intro: Astrology early Islamicate",
      captionZh: "简介：斯瓦希里星历占如何运作",
      captionHant: "簡介：斯瓦希裡星历占如何運作"
    },
    "fengshui": {
      youtubeId: "Nyq3ZQOCBNg",
      caption: "Intro: Feng Shui Explained",
      captionZh: "简介：风水如何运作",
      captionHant: "簡介：風水如何運作"
    },
    "fijian-draunikau": {
      youtubeId: "JWG1aL3sLOQ",
      caption: "Intro: Taiwan island temple keeps ancient dream-seeking ritual alive",
      captionZh: "简介：斐济草药灵术（记述）如何运作",
      captionHant: "簡介：斐济草藥靈術（記述）如何運作"
    },
    "firdaria": {
      youtubeId: "tir6wzUVs-M",
      caption: "Intro: Firdaria periods",
      captionZh: "简介：菲尔达里亚（波斯时主）如何运作",
      captionHant: "簡介：菲爾達里亞（波斯時主）如何運作"
    },
    "flying-star": {
      youtubeId: "pHnOU1bnw3k",
      caption: "Intro: Flying Stars Feng Shui",
      captionZh: "简介：玄空飞星如何运作",
      captionHant: "簡介：玄空飛星如何運作"
    },
    "futomani": {
      youtubeId: "W0IDNW2nczY",
      caption: "Intro: Futomani Kiboku",
      captionZh: "简介：太占如何运作",
      captionHant: "簡介：太占如何運作"
    },
    "geomancy-west": {
      youtubeId: "ShsWcRIvVG8",
      caption: "Intro: Western Geomancy",
      captionZh: "简介：西方土占如何运作",
      captionHant: "簡介：西方土占如何運作"
    },
    "giriama": {
      youtubeId: "7GTgO_pIjPk",
      caption: "Intro: Giriyama Beliefs",
      captionZh: "简介：吉里亚马灵诊如何运作",
      captionHant: "簡介：吉裡亚馬靈诊如何運作"
    },
    "goralot": {
      youtubeId: "nFqZmmbs1g0",
      caption: "Intro: Goralot lottery",
      captionZh: "简介：犹太签书（Goralot）如何运作",
      captionHant: "簡介：猶太籤書（Goralot）如何運作"
    },
    "graphology": {
      youtubeId: "DF6oJ4I4n-s",
      caption: "Intro: Handwriting graphology",
      captionZh: "简介：笔迹性格学如何运作",
      captionHant: "簡介：笔迹性格學如何運作"
    },
    "gunghap": {
      youtubeId: "OIII9TRMcl0",
      caption: "Intro: Gunghap compatibility",
      captionZh: "简介：宫合（合婚）如何运作",
      captionHant: "簡介：宮合（合婚）如何運作"
    },
    "hakata": {
      youtubeId: "q85cASRpPLM",
      caption: "Intro: Ditaola Hakata bones",
      captionZh: "简介：哈卡塔骨牌如何运作",
      captionHant: "簡介：哈卡塔骨牌如何運作"
    },
    "haruspicy": {
      youtubeId: "oxqarfZ5OQc",
      caption: "Intro: Haruspicy entrails",
      captionZh: "简介：脏卜（伊特鲁里亚／罗马）如何运作",
      captionHant: "簡介：臟卜（伊特魯里亞／羅馬）如何運作"
    },
    "hawaiian-kilo": {
      youtubeId: "m8bDCaPhOek",
      caption: "Intro: How did Polynesian wayfinders navigate the Pacific Ocean? - Alan Tamayose and Shantell …",
      captionZh: "简介：夏威夷观天（Kilo）如何运作",
      captionHant: "簡介：夏威夷觀天（Kilo）如何運作"
    },
    "horary": {
      youtubeId: "NM4OoqmmTEQ",
      caption: "Intro: Horary Astrology Lee Lehman",
      captionZh: "简介：问事占星（Horary）如何运作",
      captionHant: "簡介：問事占星（Horary）如何運作"
    },
    "human-design": {
      youtubeId: "wUDDy1EP-eI",
      caption: "Intro: Human Design basics",
      captionZh: "简介：人类图如何运作",
      captionHant: "簡介：人類圖如何運作"
    },
    "hydromancy": {
      youtubeId: "dQKQsrgNA3w",
      caption: "Intro: water scrying",
      captionZh: "简介：水占如何运作",
      captionHant: "簡介：水占如何運作"
    },
    "iching": {
      youtubeId: "wef79-md0tM",
      caption: "Intro: I-Ching under 5 minutes",
      captionZh: "简介：周易／易经如何运作",
      captionHant: "簡介：周易／易经如何運作"
    },
    "ifa": {
      youtubeId: "k9lGVF6jYN4",
      caption: "Intro: The Ifa Divination System UNESCO",
      captionZh: "简介：伊法神谕如何运作",
      captionHant: "簡介：伊法神谕如何運作"
    },
    "ifa-cuba": {
      youtubeId: "FIpoEy1lWWY",
      caption: "Intro: Ifa reading consultation",
      captionZh: "简介：古巴伊法如何运作",
      captionHant: "簡介：古巴伊法如何運作"
    },
    "ikhtiyarat": {
      youtubeId: "bnsCcqY5kVI",
      caption: "Intro: Electional Astrology",
      captionZh: "简介：择时星占（Ikhtiyārāt）如何运作",
      captionHant: "簡介：擇時星占（Ikhtiyārāt）如何運作"
    },
    "ilm-al-raml-africa": {
      youtubeId: "yFcuysu9qi4",
      caption: "Intro: Ilm al-Raml geomancy",
      captionZh: "简介：沙土占（伊尔姆·拉姆勒）如何运作",
      captionHant: "簡介：沙土占（伊尔姆·拉姆勒）如何運作"
    },
    "innu-scapula": {
      youtubeId: "W4o99n0-YSM",
      caption: "Intro: Naskapi Innu hunting dreams",
      captionZh: "简介：因努灼骨占如何运作",
      captionHant: "簡介：因努灼骨占如何運作"
    },
    "islamic-astrology": {
      youtubeId: "-8jT4UO-6TY",
      caption: "Intro: Abu Mashar Islamic astrology",
      captionZh: "简介：伊斯兰占星如何运作",
      captionHant: "簡介：伊斯蘭占星如何運作"
    },
    "isopsephy": {
      youtubeId: "SHtFCfMEyUk",
      caption: "Intro: Gematria/isopsephy",
      captionZh: "简介：字母数值占（Isopsephy）如何运作",
      captionHant: "簡介：字母數值占（Isopsephy）如何運作"
    },
    "istikhara": {
      youtubeId: "1w3pZ2pXn3o",
      caption: "Intro: Istikhara Explained",
      captionZh: "简介：求签祈导（Istikhāra）如何运作",
      captionHant: "簡介：求籤祈導（Istikhāra）如何運作"
    },
    "jafr": {
      youtubeId: "nDgBMlB6RMs",
      caption: "Intro: Ilm-E-Jafr",
      captionZh: "简介：贾弗尔字母学如何运作",
      captionHant: "簡介：賈弗爾字母學如何運作"
    },
    "jiaobei": {
      youtubeId: "M32hx7b-6K0",
      caption: "Intro: Jiaobei Moon Blocks",
      captionZh: "简介：筊杯如何运作",
      captionHant: "簡介：筊杯如何運作"
    },
    "jyotish": {
      youtubeId: "vjfmlMvsrOY",
      caption: "Intro: What Is Jyotish",
      captionZh: "简介：吠陀占星（乔蒂什）如何运作",
      captionHant: "簡介：吠陀占星（喬蒂什）如何運作"
    },
    "kabbalah-numerology": {
      youtubeId: "Xl9C37aGOlM",
      caption: "Intro: Gematria Explained",
      captionZh: "简介：卡巴拉数字／字母数值如何运作",
      captionHant: "簡介：卡巴拉數字／字母數值如何運作"
    },
    "kaso": {
      youtubeId: "rA3DhgKKP4Q",
      caption: "Intro: Kaso house geomancy",
      captionZh: "简介：家相如何运作",
      captionHant: "簡介：家相如何運作"
    },
    "kau-chim": {
      youtubeId: "zFoMx2GxHmE",
      caption: "Intro: Kau-chim How it Works",
      captionZh: "简介：求签／签诗如何运作",
      captionHant: "簡介：求签／籤詩如何運作"
    },
    "khmer-hora": {
      youtubeId: "IczqChbtBNE",
      caption: "Intro: Khmer Horoscope",
      captionZh: "简介：高棉星命如何运作",
      captionHant: "簡介：高棉星命如何運作"
    },
    "kiboku": {
      youtubeId: "gaPYKNi_pKY",
      caption: "Intro: Kiboku tortoise",
      captionZh: "简介：灼骨龟卜如何运作",
      captionHant: "簡介：灼骨龜卜如何運作"
    },
    "kipper": {
      youtubeId: "tgmjbhQgrIk",
      caption: "Intro: Kipper Grand Tableau",
      captionZh: "简介：基普牌如何运作",
      captionHant: "簡介：基普牌如何運作"
    },
    "kp-astrology": {
      youtubeId: "SxWI03MKoxc",
      caption: "Intro: KP Krishnamurti",
      captionZh: "简介：KP占星如何运作",
      captionHant: "簡介：KP占星如何運作"
    },
    "lao-calendar": {
      youtubeId: "QqQ-zd5Su8c",
      caption: "Intro: Lao calendar",
      captionZh: "简介：老挝历算如何运作",
      captionHant: "簡介：老撾曆算如何運作"
    },
    "lenormand": {
      youtubeId: "oeaL8AnwdtY",
      caption: "Intro: What is Lenormand?",
      captionZh: "简介：雷诺曼牌如何运作",
      captionHant: "簡介：雷諾曼牌如何運作"
    },
    "lingqijing": {
      youtubeId: "LVh7iN8yrs8",
      caption: "Intro: Ling Qi Jing",
      captionZh: "简介：灵棋经如何运作",
      captionHant: "簡介：靈棋经如何運作"
    },
    "liuyao": {
      youtubeId: "5xQ8kx-ITjc",
      caption: "Intro: Liu Yao six lines",
      captionZh: "简介：六爻纳甲如何运作",
      captionHant: "簡介：六爻纳甲如何運作"
    },
    "mahabote": {
      youtubeId: "ev0ImCMLHNk",
      caption: "Intro: Mahabote Myanmar",
      captionZh: "简介：缅甸星命如何运作",
      captionHant: "簡介：緬甸星命如何運作"
    },
    "maize-casting": {
      youtubeId: "qgknQN9A1Ww",
      caption: "Intro: El Mito del Dios Maíz",
      captionZh: "简介：玉米粒占如何运作",
      captionHant: "簡介：玉米粒占如何運作"
    },
    "mambila-nggam": {
      youtubeId: "zlrlmK-U7Dk",
      caption: "Intro: Mambila Spider Divination",
      captionZh: "简介：蜘蛛／蟹叶牌占（Nggàm）如何运作",
      captionHant: "簡介：蜘蛛／蟹叶牌占（Nggàm）如何運作"
    },
    "manazil": {
      youtubeId: "OjabJk1Whyg",
      caption: "Intro: 28 Moon Mansions",
      captionZh: "简介：月宿（Manāzil）如何运作",
      captionHant: "簡介：月宿（Manāzil）如何運作"
    },
    "maori-moon": {
      youtubeId: "HJqFG1RDNZQ",
      caption: "Intro: Maramataka Maori calendar",
      captionZh: "简介：毛利月历如何运作",
      captionHant: "簡介：毛利月历如何運作"
    },
    "mapuche-peuma": {
      youtubeId: "bN-KS2n5fzM",
      caption: "Intro: Why Artemidorus Was Way Ahead of His Time",
      captionZh: "简介：马普切梦兆如何运作",
      captionHant: "簡介：馬普切夢兆如何運作"
    },
    "mayan-tzolkin": {
      youtubeId: "2VNhPEMqSv8",
      caption: "Intro: Maya calendar Dresden",
      captionZh: "简介：玛雅卓尔金历如何运作",
      captionHant: "簡介：玛雅卓尔金历如何運作"
    },
    "mazalot": {
      youtubeId: "hxLrqlXSkaY",
      caption: "Intro: Mazalot Jewish astrology",
      captionZh: "简介：希伯来黄道（Mazalot）如何运作",
      captionHant: "簡介：希伯來黃道（Mazalot）如何運作"
    },
    "mazatec-curandero": {
      youtubeId: "rQFCOFPgtUc",
      caption: "Intro: R. Gordon Wasson, María Sabina, & the Sacred Mushroom: Hidden Origins of the Psychedeli…",
      captionZh: "简介：马萨特克疗愈神视如何运作",
      captionHant: "簡介：馬萨特克療愈神视如何運作"
    },
    "mbti": {
      youtubeId: "gBkIyJ7kf_I",
      caption: "Intro: MBTI What's Your Type TEDx",
      captionZh: "简介：MBTI 性格命运如何运作",
      captionHant: "簡介：MBTI 性格命運如何運作"
    },
    "meihua": {
      youtubeId: "dVg2tML81es",
      caption: "Intro: Plum Blossom Divination",
      captionZh: "简介：梅花易数如何运作",
      captionHant: "簡介：梅花易數如何運作"
    },
    "merindinlogun": {
      youtubeId: "SVvpI-NWnzE",
      caption: "Intro: Eerindinlogun Sixteen Cowries",
      captionZh: "简介：十六贝壳占（梅林丁洛贡）如何运作",
      captionHant: "簡介：十六貝壳占（梅林丁洛贡）如何運作"
    },
    "mesopotamian-dream": {
      youtubeId: "bN-KS2n5fzM",
      caption: "Intro: Why Artemidorus Was Way Ahead of His Time",
      captionZh: "简介：美索不达米亚梦书如何运作",
      captionHant: "簡介：美索不達米亞夢書如何運作"
    },
    "mesopotamian-extispicy": {
      youtubeId: "Yn3c83C941g",
      caption: "Intro: Babylonian haruspicy",
      captionZh: "简介：美索不达米亚脏卜如何运作",
      captionHant: "簡介：美索不達米亞臟卜如何運作"
    },
    "metoposcopy": {
      youtubeId: "55czI5UggWA",
      caption: "Intro: Forehead face reading",
      captionZh: "简介：额纹相如何运作",
      captionHant: "簡介：额纹相如何運作"
    },
    "mianxiang": {
      youtubeId: "hLowZaFzKBA",
      caption: "Intro: Chinese Face Reading",
      captionZh: "简介：面相如何运作",
      captionHant: "簡介：面相如何運作"
    },
    "micronesian-stars": {
      youtubeId: "moJ1cNEpvSo",
      caption: "Intro: Our Watery World: The Stick Charts of Micronesia | Great Maps Explained",
      captionZh: "简介：密克罗尼西亚星航如何运作",
      captionHant: "簡介：密克罗尼西亚星航如何運作"
    },
    "midewiwin": {
      youtubeId: "6EngUOR67yw",
      caption: "Intro: The Prophecy of the 7 Fires",
      captionZh: "简介：米德威温医社仪式如何运作",
      captionHant: "簡介：米德威温醫社儀式如何運作"
    },
    "mo-dice": {
      youtubeId: "bKj64Ot1KNc",
      caption: "Intro: Tibetan Mo dice",
      captionZh: "简介：西藏骰占（Mo）如何运作",
      captionHant: "簡介：西藏骰占（Mo）如何運作"
    },
    "mogu": {
      youtubeId: "L40trj52gr0",
      caption: "Intro: Mogu bone-feeling",
      captionZh: "简介：摸骨算命如何运作",
      captionHant: "簡介：摸骨算命如何運作"
    },
    "mole-reading": {
      youtubeId: "79pxe7pFnvY",
      caption: "Intro: WHAT IS THE SPIRITUAL SIGNIFICANCE OF THE MOLES & MARKS ON YOUR FACE?",
      captionZh: "简介：痣相如何运作",
      captionHant: "簡介：痣相如何運作"
    },
    "molybdomancy-tr": {
      youtubeId: "zwCJZX9Z5Lk",
      caption: "Intro: Kursun Dokme",
      captionZh: "简介：浇铅占（Kurşun Dökme）如何运作",
      captionHant: "簡介：澆鉛占（Kurşun Dökme）如何運作"
    },
    "mordovian": {
      youtubeId: "gom6H6T11Z0",
      caption: "Intro: marriage wax folk",
      captionZh: "简介：莫尔多瓦民俗占如何运作",
      captionHant: "簡介：莫尔多瓦民俗占如何運作"
    },
    "nephomancy": {
      youtubeId: "ae47bQnxeb8",
      caption: "Intro: What is Nephomancy? ☁️",
      captionZh: "简介：云占如何运作",
      captionHant: "簡介：雲占如何運作"
    },
    "ngombo": {
      youtubeId: "_gXd5hj3z9o",
      caption: "Intro: Chokwe ngombo",
      captionZh: "简介：恩贡博掷骨如何运作",
      captionHant: "簡介：恩贡博掷骨如何運作"
    },
    "nine-star-ki": {
      youtubeId: "CNNCUQCVXnM",
      caption: "Intro: Nine Star Ki Introduction",
      captionZh: "简介：九星气学如何运作",
      captionHant: "簡介：九星氣學如何運作"
    },
    "numerology-west": {
      youtubeId: "uvhGJuRW-18",
      caption: "Intro: Life Path Number",
      captionZh: "简介：西方数字命理如何运作",
      captionHant: "簡介：西方數字命理如何運作"
    },
    "obi": {
      youtubeId: "HI91Q4lGI80",
      caption: "Intro: West African Divination Obi",
      captionZh: "简介：柯拉果占（Obi）如何运作",
      captionHant: "簡介：柯拉果占（Obi）如何運作"
    },
    "ogham": {
      youtubeId: "b0COfjMUJ8s",
      caption: "Intro: Ogham divination beginners",
      captionZh: "简介：欧甘占如何运作",
      captionHant: "簡介：歐甘占如何運作"
    },
    "omikuji": {
      youtubeId: "3CsCdGF1rTU",
      caption: "Intro: Omikuji fortune slips",
      captionZh: "简介：御神签如何运作",
      captionHant: "簡介：御神籤如何運作"
    },
    "onmyodo": {
      youtubeId: "LNHrQy8w9kQ",
      caption: "Intro: Onmyodo history",
      captionZh: "简介：阴阳道通书如何运作",
      captionHant: "簡介：陰陽道通書如何運作"
    },
    "onychomancy": {
      youtubeId: "aHrpTdSd54U",
      caption: "Intro: Half Moon on Middle Finger's Nail in Palmistry",
      captionZh: "简介：指甲占如何运作",
      captionHant: "簡介：指甲占如何運作"
    },
    "oomancy": {
      youtubeId: "GlGkvXUYZKI",
      caption: "Intro: How to Read an Egg Cleanse",
      captionZh: "简介：卵占如何运作",
      captionHant: "簡介：卵占如何運作"
    },
    "oracle-bones": {
      youtubeId: "C1rWYXf0e_w",
      caption: "Intro: Shang oracle bones",
      captionZh: "简介：甲骨占卜如何运作",
      captionHant: "簡介：甲骨占卜如何運作"
    },
    "oracle-cards": {
      youtubeId: "F_oK_qWL_hw",
      caption: "Intro: How to use oracle cards",
      captionZh: "简介：神谕卡如何运作",
      captionHant: "簡介：神諭卡如何運作"
    },
    "palmistry": {
      youtubeId: "qPY3u9rMaMg",
      caption: "Intro: What is Chiromancy",
      captionZh: "简介：手相（西式）如何运作",
      captionHant: "簡介：手相（西式）如何運作"
    },
    "panchanga": {
      youtubeId: "epS31kkqSJc",
      caption: "Intro: Panchang Explained",
      captionZh: "简介：五历（Panchanga）如何运作",
      captionHant: "簡介：五曆（Panchanga）如何運作"
    },
    "parrot-astrology": {
      youtubeId: "3562fgnUJn0",
      caption: "Intro: Kili Josiyam",
      captionZh: "简介：鹦鹉占星如何运作",
      captionHant: "簡介：鸚鵡占星如何運作"
    },
    "pawukon": {
      youtubeId: "SkSWE8e6eys",
      caption: "Intro: Balinese Pawukon",
      captionZh: "简介：巴厘帕乌贡历如何运作",
      captionHant: "簡介：峇里帕烏貢曆如何運作"
    },
    "physiognomy-eu": {
      youtubeId: "eGa9pMh30MM",
      caption: "Intro: Physiognomy discipline",
      captionZh: "简介：面相（欧洲）如何运作",
      captionHant: "簡介：面相（欧洲）如何運作"
    },
    "png-smoke": {
      youtubeId: "7nnnaL6pl8M",
      caption: "Intro: smoke/fire oracle style",
      captionZh: "简介：巴布亚新几内亚烟占如何运作",
      captionHant: "簡介：巴布亚新几内亚烟占如何運作"
    },
    "pyromancy": {
      youtubeId: "7nnnaL6pl8M",
      caption: "Intro: fire scrying",
      captionZh: "简介：火占如何运作",
      captionHant: "簡介：火占如何運作"
    },
    "qimen": {
      youtubeId: "wAKK1LQP-Zs",
      caption: "Intro: Qi Men Dun Jia Lesson 1",
      captionZh: "简介：奇门遁甲如何运作",
      captionHant: "簡介：奇門遁甲如何運作"
    },
    "qizheng": {
      youtubeId: "02sWLX0v-FQ",
      caption: "Intro: Qizheng Siyu",
      captionZh: "简介：七政四余如何运作",
      captionHant: "簡介：七政四余如何運作"
    },
    "quechua-despacho": {
      youtubeId: "cFE8w7Ut_Lg",
      caption: "Intro: Despacho ceremony",
      captionZh: "简介：克丘亚祭礼包如何运作",
      captionHant: "簡介：克丘亚祭禮包如何運作"
    },
    "ramala": {
      youtubeId: "g_oOxqfyQuk",
      caption: "Intro: Ramala Shastra",
      captionZh: "简介：拉玛拉土占如何运作",
      captionHant: "簡介：拉瑪拉土占如何運作"
    },
    "rokuyo": {
      youtubeId: "UZap1YLmLS8",
      caption: "Intro: Rokuyo six-day",
      captionZh: "简介：六曜如何运作",
      captionHant: "簡介：六曜如何運作"
    },
    "runes-futhorc": {
      youtubeId: "zn9xn0QyC7w",
      caption: "Intro: Anglo-Frisian Futhorc",
      captionZh: "简介：盎格鲁－撒克逊弗索克如何运作",
      captionHant: "簡介：盎格魯－撒克遜弗索克如何運作"
    },
    "runes-younger": {
      youtubeId: "764hz8_PHeM",
      caption: "Intro: Younger Futhark Viking Age",
      captionZh: "简介：小弗萨克卢恩如何运作",
      captionHant: "簡介：小弗薩克盧恩如何運作"
    },
    "russian-svyatki": {
      youtubeId: "gom6H6T11Z0",
      caption: "Intro: wax water Svyatki-style",
      captionZh: "简介：俄罗斯圣周期间占如何运作",
      captionHant: "簡介：俄罗斯聖周期间占如何運作"
    },
    "saju": {
      youtubeId: "Lc8vtA4KJTw",
      caption: "Intro: Korean Saju 101",
      captionZh: "简介：四柱（韩国）如何运作",
      captionHant: "簡介：四柱（韓國）如何運作"
    },
    "samoan-tofa": {
      youtubeId: "MU8tt8jMxXU",
      caption: "Intro: Old Religion of Samoa (Old Samoa, John B. Stair) | Polynesian Myth | Samoan Gods",
      captionZh: "简介：萨摩亚托法智慧如何运作",
      captionHant: "簡介：萨摩亚托法智慧如何運作"
    },
    "samudrika": {
      youtubeId: "JkJQPTClTqY",
      caption: "Intro: Samudrika Shastra",
      captionZh: "简介：相学（萨穆德里卡）如何运作",
      captionHant: "簡介：相學（薩穆德里卡）如何運作"
    },
    "sanmeigaku": {
      youtubeId: "yuWcm8_cw8g",
      caption: "Intro: Sanmeigaku overview",
      captionZh: "简介：算命学（日本）如何运作",
      captionHant: "簡介：算命學（日本）如何運作"
    },
    "sarvatobhadra": {
      youtubeId: "veC51iriewY",
      caption: "Intro: Sarvatobhadra Chakra",
      captionZh: "简介：全方位吉凶盘如何运作",
      captionHant: "簡介：全方位吉凶盤如何運作"
    },
    "scapulimancy-asia": {
      youtubeId: "C1rWYXf0e_w",
      caption: "Intro: Oracle bones scapulimancy",
      captionZh: "简介：灼骨占（中亚）如何运作",
      captionHant: "簡介：灼骨占（中亞）如何運作"
    },
    "scrying": {
      youtubeId: "dQKQsrgNA3w",
      caption: "Intro: Scrying for Beginners",
      captionZh: "简介：水晶／镜观视如何运作",
      captionHant: "簡介：水晶／镜觀视如何運作"
    },
    "seimei": {
      youtubeId: "kxB7_gLwTm4",
      caption: "Intro: Seimei five-grid name",
      captionZh: "简介：姓名判断如何运作",
      captionHant: "簡介：姓名判斷如何運作"
    },
    "shagai": {
      youtubeId: "YCDbQAH_RzU",
      caption: "Intro: Shagai knuckle bones",
      captionZh: "简介：羊踝骨占（沙盖）如何运作",
      captionHant: "簡介：羊踝骨占（沙蓋）如何運作"
    },
    "shaking-tent": {
      youtubeId: "W4o99n0-YSM",
      caption: "Intro: Naskapi Innu spirituality",
      captionZh: "简介：晃帐篷仪式如何运作",
      captionHant: "簡介：晃帐篷儀式如何運作"
    },
    "shichu": {
      youtubeId: "cLceiJ80kOU",
      caption: "Intro: Shichu Suimei 3 min",
      captionZh: "简介：四柱推命如何运作",
      captionHant: "簡介：四柱推命如何運作"
    },
    "shouxiang": {
      youtubeId: "tCHbXlB0crY",
      caption: "Intro: Chinese Palmistry",
      captionZh: "简介：手相（中式）如何运作",
      captionHant: "簡介：手相（中式）如何運作"
    },
    "sibilla": {
      youtubeId: "0LmvwHMKZhE",
      caption: "Intro: Sibilla Primer",
      captionZh: "简介：西比拉牌如何运作",
      captionHant: "簡介：西比拉牌如何運作"
    },
    "sikidy": {
      youtubeId: "KWaVqlARxgo",
      caption: "Intro: Sikidy Madagascar",
      captionZh: "简介：西基迪占如何运作",
      captionHant: "簡介：西基迪占如何運作"
    },
    "sinhala-nekath": {
      youtubeId: "FS49zZ9aFH4",
      caption: "Intro: Sinhala Nekath",
      captionZh: "简介：僧伽罗择时如何运作",
      captionHant: "簡介：僧伽羅擇時如何運作"
    },
    "slavic-folk": {
      youtubeId: "gom6H6T11Z0",
      caption: "Intro: wax water folk (Slavic-style)",
      captionZh: "简介：斯拉夫民俗占如何运作",
      captionHant: "簡介：斯拉夫民俗占如何運作"
    },
    "sukuyo": {
      youtubeId: "Gwiqkv0tdaA",
      caption: "Intro: Sukuyo 27 mansions",
      captionZh: "简介：宿曜如何运作",
      captionHant: "簡介：宿曜如何運作"
    },
    "svarasastra": {
      youtubeId: "5CehUSA0SBE",
      caption: "Intro: Svara breath prediction",
      captionZh: "简介：息相学如何运作",
      captionHant: "簡介：息相學如何運作"
    },
    "tahitian-moon": {
      youtubeId: "ZiNdmSGvQLU",
      caption: "Intro: Polynesian moon calendar",
      captionZh: "简介：塔希提月历如何运作",
      captionHant: "簡介：塔希提月历如何運作"
    },
    "taiyi": {
      youtubeId: "MGjUAri1MX4",
      caption: "Intro: Tai Yi Shen Shu",
      captionZh: "简介：太乙神数如何运作",
      captionHant: "簡介：太乙神數如何運作"
    },
    "taksa": {
      youtubeId: "Xytxrh08tsU",
      caption: "Intro: Taksa naming",
      captionZh: "简介：泰式命名占星如何运作",
      captionHant: "簡介：泰式命名占星如何運作"
    },
    "tamil-numerology": {
      youtubeId: "QEOVz_Rg22U",
      caption: "Intro: Tamil Numerology",
      captionZh: "简介：泰米尔数字命理如何运作",
      captionHant: "簡介：泰米爾數字命理如何運作"
    },
    "tarot": {
      youtubeId: "hINTWlI05sk",
      caption: "Intro: Meet the Major Arcana",
      captionZh: "简介：塔罗牌（大阿卡纳）如何运作",
      captionHant: "簡介：塔羅牌（大阿卡納）如何運作"
    },
    "tasseography-tea": {
      youtubeId: "1Fs0YPqVLoI",
      caption: "Intro: How To Read Tea Leaves",
      captionZh: "简介：茶叶占如何运作",
      captionHant: "簡介：茶叶占如何運作"
    },
    "thai-horasat": {
      youtubeId: "TTL5rG23aJ0",
      caption: "Intro: Thai Astrology",
      captionZh: "简介：泰式占星如何运作",
      captionHant: "簡介：泰式占星如何運作"
    },
    "thai-weekday": {
      youtubeId: "_YAIoxNKiIQ",
      caption: "Intro: Thai weekday birth",
      captionZh: "简介：泰式星期命运如何运作",
      captionHant: "簡介：泰式星期命運如何運作"
    },
    "tibetan-astro": {
      youtubeId: "mW_u8pWEvyE",
      caption: "Intro: Tibetan Astrology intro",
      captionZh: "简介：藏历占星如何运作",
      captionHant: "簡介：藏曆占星如何運作"
    },
    "tieban": {
      youtubeId: "-4LcJlkqqak",
      caption: "Intro: Tie Ban Shen Shu",
      captionZh: "简介：铁板神数如何运作",
      captionHant: "簡介：鐵板神數如何運作"
    },
    "tojeong": {
      youtubeId: "rcekFFAlp-Y",
      caption: "Intro: Tojeong Bigyeol",
      captionZh: "简介：土亭秘诀如何运作",
      captionHant: "簡介：土亭秘訣如何運作"
    },
    "tongshu": {
      youtubeId: "BdVt5m3fiI0",
      caption: "Intro: Chinese Almanac beginners",
      captionZh: "简介：通书择日如何运作",
      captionHant: "簡介：通書择日如何運作"
    },
    "torres-scintillation": {
      youtubeId: "kkjf0hCKOCE",
      caption: "Intro: Australian Indigenous Astronomy",
      captionZh: "简介：托雷斯海峡星闪观测如何运作",
      captionHant: "簡介：托雷斯海峡星闪觀測如何運作"
    },
    "tu-tru": {
      youtubeId: "dQ5Cv0wFDU4",
      caption: "Intro: Tu Tru bat tu",
      captionZh: "简介：四柱（越南）如何运作",
      captionHant: "簡介：四柱（越南）如何運作"
    },
    "tu-vi": {
      youtubeId: "nhL4V_LIK7M",
      caption: "Intro: Tu Vi Dou So",
      captionZh: "简介：紫微（越南）如何运作",
      captionHant: "簡介：紫微（越南）如何運作"
    },
    "urim-thummim": {
      youtubeId: "lzT8NPHDNZc",
      caption: "Intro: Urim and Thummim",
      captionZh: "简介：乌陵与土明如何运作",
      captionHant: "簡介：烏陵與土明如何運作"
    },
    "vastu": {
      youtubeId: "4lmArdcHtN8",
      caption: "Intro: Vastu Shastra beginners",
      captionZh: "简介：梵宅学如何运作",
      captionHant: "簡介：梵宅學如何運作"
    },
    "wauja-tobacco": {
      youtubeId: "ZS9AVcLsYnk",
      caption: "Intro: Shamanism Documentary: The Sacred Science [OFFICIAL FREE, FULL MOVIE LINK]",
      captionZh: "简介：瓦乌贾烟草仪式如何运作",
      captionHant: "簡介：瓦乌贾烟草儀式如何運作"
    },
    "western-astrology": {
      youtubeId: "iV0W26XDmrk",
      caption: "Intro: Western vs Vedic astrology",
      captionZh: "简介：西方占星如何运作",
      captionHant: "簡介：西方占星如何運作"
    },
    "weton": {
      youtubeId: "ioUS8JB1Rfk",
      caption: "Intro: Weton Javanese",
      captionZh: "简介：爪哇湿日如何运作",
      captionHant: "簡介：爪哇濕日如何運作"
    },
    "xiaoliuren": {
      youtubeId: "Z6H3JmKMSfM",
      caption: "Intro: Xiao Liu Ren",
      captionZh: "简介：小六壬如何运作",
      captionHant: "簡介：小六壬如何運作"
    },
    "zairja": {
      youtubeId: "AhtnW7WuZnE",
      caption: "Intro: Islam Occult Divination",
      captionZh: "简介：扎伊尔贾装置如何运作",
      captionHant: "簡介：扎伊尔贾装置如何運作"
    },
    "zapotec-mixtec": {
      youtubeId: "U2qI7z7Z7aA",
      caption: "Intro: Mesoamerican day count",
      captionZh: "简介：萨波特克／米斯特克历占如何运作",
      captionHant: "簡介：萨波特克／米斯特克历占如何運作"
    },
    "ziwei": {
      youtubeId: "5styDOzEdWU",
      caption: "Intro: Zi Wei Dou Shu beginners",
      captionZh: "简介：紫微斗数如何运作",
      captionHant: "簡介：紫微斗數如何運作"
    },
    "zulu-bones": {
      youtubeId: "fHHKD1lRTLE",
      caption: "Intro: Zulu sangoma bones",
      captionZh: "简介：祖鲁骨卜（Amathambo）如何运作",
      captionHant: "簡介：祖鲁骨卜（Amathambo）如何運作"
    },
    "zurhai": {
      youtubeId: "1fapgXEqD7w",
      caption: "Intro: Mongolian Zurhai",
      captionZh: "简介：蒙古祖尔海如何运作",
      captionHant: "簡介：蒙古祖爾海如何運作"
    },
  };

  function resolveId(methodOrId) {
    if (!methodOrId) return "";
    if (typeof methodOrId === "string") return methodOrId;
    return methodOrId.id || "";
  }

  window.FatumRiteVideos = {
    all: VIDEOS,
    for(methodOrId) {
      const id = resolveId(methodOrId);
      return (id && VIDEOS[id]) || null;
    },
    has(methodOrId) {
      return !!this.for(methodOrId);
    }
  };
})();
