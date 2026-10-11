#!/usr/bin/env node
/**
 * Build scripts/data/extra-category-seeds.json for new Seen shelves.
 * Brand rows: id|Name|Origin|tag1+tag2|alias1+alias2
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "data");

function parse(block) {
  const out = [];
  const seen = new Set();
  for (const raw of block.trim().split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [id, name, origin, tags, aliases] = line.split("|");
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    const seed = { id, name };
    if (origin) seed.origin = origin;
    if (tags) seed.tags = tags.split("+").filter(Boolean);
    if (aliases) seed.aliases = aliases.split("+").filter(Boolean);
    out.push(seed);
  }
  return out;
}

function cat(id, label, blurb, kind, block) {
  return { id, label, blurb, kind, items: parse(block) };
}

const softdrinks = cat(
  "softdrinks",
  "Soft drinks",
  "Sodas, juices, waters, and energy drinks still on cold shelves.",
  "brand",
  `
coca-cola|Coca-Cola|USA|soda|coke+coca cola
pepsi|Pepsi|USA|soda
sprite|Sprite|USA|soda
fanta|Fanta|Germany|soda
7up|7UP|USA|soda|seven up
dr-pepper|Dr Pepper|USA|soda
mountain-dew|Mountain Dew|USA|soda
schweppes|Schweppes|Switzerland|mixer
perrier|Perrier|France|water
evian|Évian|France|water|evian
san-pellegrino|S.Pellegrino|Italy|water
red-bull|Red Bull|Austria|energy
monster|Monster Energy|USA|energy
gatorade|Gatorade|USA|sports
powerade|Powerade|USA|sports
vitaminwater|vitaminwater|USA|water
tropicana|Tropicana|USA|juice
minute-maid|Minute Maid|USA|juice
snapple|Snapple|USA|juice
innocent|Innocent|UK|juice
ribena|Ribena|UK|juice
lucozade|Lucozade|UK|sports
irn-bru|Irn-Bru|Scotland|soda
oasis-uk|Oasis|UK|juice
tango|Tango|UK|soda
vimto|Vimto|UK|soda
appletiser|Appletiser|South Africa|juice
sparletta|Sparletta|South Africa|soda
stoney|Stoney|South Africa|soda
orangina|Orangina|France|soda
badoit|Badoit|France|water
vittel|Vittel|France|water
volvic|Volvic|France|water
contrex|Contrex|France|water
cristaline|Cristaline|France|water
lipton-ice|Lipton Ice Tea|USA|tea
nestea|Nestea|Switzerland|tea
fuzetea|Fuze Tea|USA|tea
arizona|AriZona|USA|tea
calpis|Calpis|Japan|drink|カルピス+calpico
pocari|Pocari Sweat|Japan|sports
ramune|Ramune|Japan|soda
oishi|Oishi|Thailand|drink
vitasoy|Vitasoy|Hong Kong|soy|维他奶
wanglaoji|Wong Lo Kat|China|herbal|王老吉
kangshifu-drink|Master Kong Drink|China|tea
uni-president-drink|Uni-President Drink|Taiwan|tea
milo|Milo|Australia|malt
solo|Solo|Australia|soda
bundaberg|Bundaberg|Australia|ginger
kirks|Kirks|Australia|soda
passiona|Passiona|Australia|soda
l-and-p|L&P|New Zealand|soda
c2|C2|Philippines|tea
zesto|Zesto|Philippines|juice
wilkins|Wilkins|Philippines|water
sarsi|Sarsi|Philippines|soda
royal-ph|Royal|Philippines|soda
mirinda|Mirinda|USA|soda
sting|Sting|Philippines|energy
coke-zero|Coca-Cola Zero|USA|soda
diet-coke|Diet Coke|USA|soda
pepsi-max|Pepsi Max|USA|soda
aquarius|Aquarius|Japan|sports
ilohas|I Lohas|Japan|water
ayataka|Ayataka|Japan|tea
georgia-can|Georgia|Japan|coffee-can
boss-can|BOSS|Japan|coffee-can
cclemon|C.C. Lemon|Japan|soda
mitsuya|Mitsuya Cider|Japan|soda
oronamin|Oronamin C|Japan|energy
lipovitan|Lipovitan|Japan|energy
real-gold|Real Gold|Japan|energy
itoen-drink|Ito En Soft|Japan|tea
gogo-no-kocha|Gogo no Kocha|Japan|tea
apple-sidra|Apple Sidra|Taiwan|soda
hey-song|HeySong|Taiwan|soda|黑松
maaza|Maaza|India|juice
frooti|Frooti|India|juice
slice|Slice|India|juice
thums-up|Thums Up|India|soda
limca|Limca|India|soda
campa|Campa Cola|India|soda
bisleri|Bisleri|India|water
kinley|Kinley|India|water
aquafina|Aquafina|USA|water
paper-boat|Paper Boat|India|juice
appy|Appy Fizz|India|soda
hell-energy|Hell Energy|Hungary|energy
burn|Burn|Austria|energy
rockstar|Rockstar|USA|energy
bang|Bang Energy|USA|energy
celsius|Celsius|USA|energy
prime|Prime|USA|sports
bodyarmor|BODYARMOR|USA|sports
smartwater|smartwater|USA|water
fiji-water|FIJI Water|Fiji|water
voss|Voss|Norway|water
icelandic-glacial|Icelandic Glacial|Iceland|water
san-benedetto|San Benedetto|Italy|water
ferrarelle|Ferrarelle|Italy|water
chinotto|Chinotto|Italy|soda
crodino|Crodino|Italy|aperitivo
estathe|Estathé|Italy|tea
santal|Santal|Italy|juice
rauch|Rauch|Austria|juice
almdudler|Almdudler|Austria|soda
kofola|Kofola|Czechia|soda
vinea|Vinea|Slovakia|soda
mattoni|Mattoni|Czechia|water
rajec|Rajec|Slovakia|water
jana|Jana|Croatia|water
cedevita-soft|Cedevita|Croatia|drink
cockta|Cockta|Slovenia|soda
knjaz-soft|Knjaz Miloš|Serbia|water
next-rs|Next|Serbia|juice
borjomi-soft|Borjomi|Georgia|water
nabeghlavi-soft|Nabeghlavi|Georgia|water
natakhtari-soft|Natakhtari|Georgia|soda
tarhun|Tarhun|Russia|soda
baikal|Baikal|Russia|soda
morshynska|Morshynska|Ukraine|water
bonaqua|Bonaqua|Germany|water
gerolsteiner|Gerolsteiner|Germany|water
selters|Selters|Germany|water
fritz-kola|Fritz-Kola|Germany|soda
club-mate|Club-Mate|Germany|soda
bionade|Bionade|Germany|soda
afri-cola|Afri-Cola|Germany|soda
spezi|Spezi|Germany|soda
mezzo-mix|Mezzo Mix|Germany|soda
capri-sun|Capri-Sun|Germany|juice
hohes-c|Hohes C|Germany|juice
granini|Granini|Germany|juice
sinalco|Sinalco|Germany|soda
rivella|Rivella|Switzerland|soda
henniez|Henniez|Switzerland|water
valser|Valser|Switzerland|water
kas|Kas|Spain|soda
la-casera|La Casera|Spain|soda
don-simon|Don Simón|Spain|juice
font-vella|Font Vella|Spain|water
lanjaron|Lanjarón|Spain|water
solan|Solán de Cabras|Spain|water
sumol|Sumol|Portugal|soda
compal|Compal|Portugal|juice
luso|Luso|Portugal|water
pedras|Pedras|Portugal|water
guarana-antarctica|Guaraná Antarctica|Brazil|soda
guarana-jesus|Guaraná Jesus|Brazil|soda
sukita|Sukita|Brazil|soda
dolly|Dolly|Brazil|soda
kuat|Kuat|Brazil|soda
crystal-br|Crystal|Brazil|water
bonafont|Bonafont|Mexico|water
epura|ePura|Mexico|water
ciel|Ciel|Mexico|water
penafiel|Peñafiel|Mexico|water
topo-chico|Topo Chico|Mexico|water
jarritos|Jarritos|Mexico|soda
sidral|Sidral Mundet|Mexico|soda
boing|Boing|Mexico|juice
jumex|Jumex|Mexico|juice
del-valle|Del Valle|Mexico|juice
squirt|Squirt|Mexico|soda
fresca|Fresca|Mexico|soda
manzanita|Manzanita Sol|Mexico|soda
bilz|Bilz|Chile|soda
pap|Pap|Chile|soda
kem|Kem|Chile|soda
cachantun|Cachantún|Chile|water
inca-kola|Inca Kola|Peru|soda
triple-kola|Triple Kola|Peru|soda
san-luis|San Luis|Peru|water
socosani|Socosani|Peru|water
postobon|Postobón|Colombia|soda
colombiana|Colombiana|Colombia|soda
manzana-postobon|Manzana Postobón|Colombia|soda
hit|Hit|Colombia|juice
brisa|Brisa|Colombia|water
la-croix|La Croix|USA|water
bubly|bubly|USA|water
spindrift|Spindrift|USA|water
polar|Polar|USA|soda
boylan|Boylan|USA|soda
juhayna-juice|Juhayna Juice|Egypt|juice
fayrouz|Fayrouz|Egypt|soda
baraka-water|Baraka|Egypt|water
hayat|Hayat|Egypt|water
maltina|Maltina|Nigeria|malt
amstel-malta|Amstel Malta|Nigeria|malt
lucozade-ng|Lucozade Nigeria|Nigeria|sports
fearless|Fearless|Nigeria|energy
eva-water|Eva Water|Nigeria|water
chivita|Chivita|Nigeria|juice
voltic|Voltic|Ghana|water
alvaro|Alvaro|Ghana|malt
brookside-juice|Brookside Juice|Kenya|juice
afya|Afya|Kenya|juice
almarai-juice|Almarai Juice|Saudi Arabia|juice
moussy|Moussy|Saudi Arabia|malt
barbican|Barbican|UAE|malt
al-ain-water|Al Ain Water|UAE|water
mai-dubai|Mai Dubai|UAE|water
masafi|Masafi|UAE|water
lacnor|Lacnor|UAE|juice
alpro-drink|Alpro|Belgium|plant
oatly-drink|Oatly|Sweden|plant
silk|Silk|USA|plant
califia|Califia Farms|USA|plant
mount-franklin|Mount Franklin|Australia|water
pump|Pump|Australia|water
deep-spring|Deep Spring|Australia|soda
golden-circle|Golden Circle|Australia|juice
berri|Berri|Australia|juice
nudie|Nudie|Australia|juice
so-good|So Good|Australia|plant
hamoud|Hamoud Boualem|Algeria|soda
ifri|Ifri|Algeria|water
boga|Boga|Tunisia|soda
oulmes|Oulmès|Morocco|water
ain-saiss|Aïn Saïss|Morocco|water
tannourine|Tannourine|Lebanon|water
sannine|Sannine|Lebanon|water
bonjus|Bonjus|Lebanon|juice
ting|Ting|Jamaica|soda
dg-soft|D&G Soft Drinks|Jamaica|soda
tukola|TuKola|Cuba|soda
ciego-montero|Ciego Montero|Cuba|water
kerns|Kern's|Guatemala|juice
salvavidas|Salvavidas|Guatemala|water
yippy|Yippy|El Salvador|soda
sula|Sula|Honduras|juice
tropical-cr|Tropical|Costa Rica|soda
dos-pinos-drink|Dos Pinos Drink|Costa Rica|drink
vital-bo|Vital Soft|Bolivia|water
pulp|Pulp|Paraguay|juice
asu|ASU|Kazakhstan|water
tassay|Tassay|Kazakhstan|water
sirab|Sirab|Azerbaijan|water
badamli|Badamlı|Azerbaijan|water
bjni|Bjni|Armenia|water
noyan|Noyan|Armenia|juice
zamzam|Zamzam|Iran|soda
ambo|Ambo Mineral Water|Ethiopia|water
azam-drink|Azam Soft|Tanzania|drink
riham|Riham|Uganda|soda
mazowe|Mazowe|Zimbabwe|juice
kirene|Kirène|Senegal|water
vita-malt|Vita Malt|Senegal|malt
kinnie|Kinnie|Malta|soda
keo-soft|KEO Soft|Cyprus|drink
farsons-soft|Farsons Soft|Malta|drink
skani|Skånemejerier Soft|Sweden|drink
lorina|Lorina|France|soda
oasis-fr|Oasis France|France|juice
pulco|Pulco|France|juice
canette|Canette|France|soda
pamplemousse|Schweppes Agrum|France|mixer
lipton-fr|Lipton France|France|tea
maytea|MayTea|France|tea
tipco|Tipco|Thailand|juice
dutch-mill-drink|Dutch Mill Soft|Thailand|drink
ichitan|Ichitan|Thailand|tea
est|EST|Thailand|energy
m-150|M-150|Thailand|energy
red-bull-th|Red Bull Thailand|Thailand|energy
singha-water|Singha Water|Thailand|water
namthip|Namthip|Thailand|water
crystal-th|Crystal Thailand|Thailand|water
kratingdaeng|Krating Daeng|Thailand|energy
yen-yen|Yen Yen|Vietnam|drink
number-one|Number One|Vietnam|energy
sting-vn|Sting Vietnam|Vietnam|energy
aquafina-vn|Aquafina Vietnam|Vietnam|water
lavie|La Vie|Vietnam|water
sapuwa|Sapuwa|Vietnam|water
revive|Revive|Vietnam|sports
tra-xanh|Trà Xanh Không Độ|Vietnam|tea
c2-vn|C2 Vietnam|Vietnam|tea
good-mood|Good Mood|Vietnam|tea
tegu|Tegu|Indonesia|tea
teh-botol|Teh Botol Sosro|Indonesia|tea
frestea|Frestea|Indonesia|tea
mizone|Mizone|Indonesia|sports
adas|Adem Sari|Indonesia|drink
extra-joss|Extra Joss|Indonesia|energy
kratingdaeng-id|Kratingdaeng Indonesia|Indonesia|energy
le-minerale|Le Minerale|Indonesia|water
aqua|Aqua|Indonesia|water
club-id|Club|Indonesia|water
vit|Vit|Indonesia|water
cleo|Cleo|Indonesia|water
pristine|Pristine|Indonesia|water
you-c1000|You C1000|Indonesia|drink
pocari-id|Pocari Indonesia|Indonesia|sports
fruit-tea|Fruit Tea|Indonesia|tea
nu|NU|Indonesia|tea
icha|Ichitan Indonesia|Indonesia|tea
ultrajaya-drink|Ultra Jaya Soft|Indonesia|drink
indomilk-drink|Indomilk Soft|Indonesia|drink
milo-id|Milo Indonesia|Indonesia|malt
nescafe-rtb|Nescafé RTD|Switzerland|coffee
starbucks-doubleshot|Starbucks Doubleshot|USA|coffee
java-monster|Java Monster|USA|coffee
reign|Reign|USA|energy
ghost|Ghost Energy|USA|energy
alani|Alani Nu|USA|energy
zoa|ZOA|USA|energy
c4|C4 Energy|USA|energy
guronsan|Guronsan|Japan|drink
ribena-sg|Ribena Singapore|Singapore|juice
yeos-drink|Yeo's Soft|Singapore|drink
marigold-peel|Marigold Peel Fresh|Singapore|juice
fraser|Fraser and Neave|Singapore|soda
100plus|100PLUS|Malaysia|sports
seasons|Seasons|Malaysia|tea
yeos-my|Yeo's Malaysia|Malaysia|drink
dutch-lady-drink|Dutch Lady Soft|Malaysia|drink
spritzer|Spritzer|Malaysia|water
cactus|Cactus|Malaysia|water
ice-mountain|Ice Mountain|Malaysia|water
f-and-n|F&N|Malaysia|soda
exotica|Exotica|Malaysia|juice
nutriplus|Nutriplus|Malaysia|juice
olivario|Olivio Soft|Italy|drink
sanbitter|Sanbittèr|Italy|aperitivo
chinotto-nadi|Chinotto Neri|Italy|soda
spuma-nadi|Spuma Neri|Italy|soda
gazzosa|Gazzosa|Italy|soda
lemonsoda|Lemonsoda|Italy|soda
oransoda|Oransoda|Italy|soda
pelmosoda|Pelmosoda|Italy|soda
bibite|Bibite San Pellegrino|Italy|soda
chinotto-campari|Campari Soda Soft|Italy|aperitivo
`,
);

const snacks = cat(
  "snacks",
  "Snacks & confectionery",
  "Chips, biscuits, candy, and confectionery still shared from bags and tins.",
  "brand",
  `
lays|Lay's|USA|chips|lays
doritos|Doritos|USA|chips
pringles|Pringles|USA|chips
cheetos|Cheetos|USA|chips
ruffles|Ruffles|USA|chips
tostitos|Tostitos|USA|chips
fritos|Fritos|USA|chips
sun-chips|Sun Chips|USA|chips
takes|Takis|Mexico|chips
barcel|Barcel|Mexico|chips
sabritas|Sabritas|Mexico|chips
chips-ahoy|Chips Ahoy|USA|cookies
oreo|Oreo|USA|cookies
nutter-butter|Nutter Butter|USA|cookies
newtons|Newtons|USA|cookies
nilla|Nilla|USA|cookies
triscuit|Triscuit|USA|crackers
wheat-thins|Wheat Thins|USA|crackers
ritz|Ritz|USA|crackers
cheez-it|Cheez-It|USA|crackers
goldfish|Goldfish|USA|crackers
club-crackers|Club Crackers|USA|crackers
saltines|Saltines|USA|crackers
twinkies|Twinkies|USA|cake
hostess|Hostess|USA|cake
little-debbie|Little Debbie|USA|cake
snickers|Snickers|USA|chocolate
kitkat|KitKat|UK|chocolate
mars-bar|Mars|UK|chocolate
twix|Twix|UK|chocolate
milky-way|Milky Way|USA|chocolate
m-and-ms|M&M's|USA|chocolate
skittles|Skittles|USA|candy
starburst|Starburst|USA|candy
haribo|Haribo|Germany|candy
toblerone|Toblerone|Switzerland|chocolate
milka|Milka|Switzerland|chocolate
lindt|Lindt|Switzerland|chocolate
ferrero|Ferrero Rocher|Italy|chocolate
kinder|Kinder|Italy|chocolate
nutella-snack|Nutella B-Ready|Italy|snack
chupa-chups|Chupa Chups|Spain|candy
cadbury|Cadbury|UK|chocolate
galaxy|Galaxy|UK|chocolate
maltesers|Maltesers|UK|chocolate
wispa|Wispa|UK|chocolate
crunchie|Crunchie|UK|chocolate
flake|Flake|UK|chocolate
double-decker|Double Decker|UK|chocolate
topic|Topic|UK|chocolate
aero|Aero|UK|chocolate
yorkie|Yorkie|UK|chocolate
walkers|Walkers|UK|chips
quavers|Quavers|UK|chips
wotsits|Wotsits|UK|chips
monster-munch|Monster Munch|UK|chips
space-raiders|Space Raiders|UK|chips
hula-hoops|Hula Hoops|UK|chips
mccoys|McCoy's|UK|chips
kettle|Kettle|UK|chips
tyrells|Tyrrells|UK|chips
propercorn|Propercorn|UK|popcorn
butterkist|Butterkist|UK|popcorn
mcvities|McVitie's|UK|biscuits
digestive|Digestive|UK|biscuits
jaffa-cakes|Jaffa Cakes|UK|biscuits
hobnobs|Hobnobs|UK|biscuits
rich-tea|Rich Tea|UK|biscuits
custard-creams|Custard Creams|UK|biscuits
bourbon-uk|Bourbon|UK|biscuits
penguins|Penguins|UK|biscuits
club-uk|Club|UK|biscuits
kit-kat-chunky|KitKat Chunky|UK|chocolate
pocky|Pocky|Japan|snack|ポッキー
hi-chew|Hi-Chew|Japan|candy|ハイチュウ
meiji-chocolate|Meiji Chocolate|Japan|chocolate
glico|Glico|Japan|snack|グリコ
bourbon-jp|Bourbon|Japan|biscuits|ブルボン
morinaga|Morinaga|Japan|candy|森永
lotte-ghana|Ghana Chocolate|Japan|chocolate|ガーナ
koala-march|Koala's March|Japan|cookies
jagariko|Jagariko|Japan|snack|じゃがりこ
calbee|Calbee|Japan|chips
potato-chips-calbee|Calbee Potato Chips|Japan|chips
jagabee|Jagabee|Japan|snack
sappa|Sappa|Japan|snack
kabaya|Kabaya|Japan|candy
fujiya|Fujiya|Japan|candy
kasugai|Kasugai|Japan|candy
nissin-ciscorn|Ciscorn|Japan|snack
orion-choco|Choco Pie|South Korea|cake
lotte-pepero|Pepero|South Korea|snack
lotte-yeah|Yeah|South Korea|snack
nongshim-shrimp|Shrimp Crackers|South Korea|snack
haitai|Haitai|South Korea|candy
crown|Crown|South Korea|biscuits
samyang-snack|Samyang Snack|South Korea|snack
ottogi-snack|Ottogi Snack|South Korea|snack
want-want|Want Want|China|snack|旺旺
three-squirrels|Three Squirrels|China|nuts|三只松鼠
bestore|Bestore|China|snack|良品铺子
be-be-joy|Be&Cheery|China|snack|百草味
hsing|Hsu Fu Chi|China|candy|徐福记
dove-cn|Dove China|China|chocolate
daredream|Daredream|China|candy
liangpin|Liangpinpuzi|China|snack
yida|Yida|China|gum
white-rabbit|White Rabbit|China|candy|大白兔
huangfeihong|Huang Fei Hong|China|peanuts
indomie-snack|Indomie Snack|Indonesia|snack
qtela|Qtela|Indonesia|chips
chitato|Chitato|Indonesia|chips
lays-id|Lay's Indonesia|Indonesia|chips
tango-id|Tango|Indonesia|snack
beng-beng|Beng-Beng|Indonesia|chocolate
silverqueen|SilverQueen|Indonesia|chocolate
dangke|Delfi|Indonesia|chocolate
nextar|Nextar|Indonesia|biscuits
roma|Roma|Indonesia|biscuits
khong-guan|Khong Guan|Indonesia|biscuits
gery|Gery|Indonesia|biscuits
better|Better|Indonesia|biscuits
monde|Monde|Indonesia|biscuits
oris|Oris|Indonesia|chips
japota|Japota|Indonesia|chips
kusuka|Kusuka|Indonesia|chips
piattos|Piattos|Philippines|chips
boy-bawang|Boy Bawang|Philippines|snack
oishi-ph|Oishi Philippines|Philippines|snack
jack-n-jill|Jack 'n Jill|Philippines|snack
nova-ph|Nova|Philippines|chips
chippy|Chippy|Philippines|chips
roll|Roll|Philippines|snack
presto|Presto|Philippines|cream
cream-o|Cream-O|Philippines|cookies
fudgee-barr|Fudgee Barr|Philippines|cake
rebisco|Rebisco|Philippines|biscuits
hansel|Hansel|Philippines|biscuits
skyflakes|SkyFlakes|Philippines|crackers
magic-flakes|Magic Flakes|Philippines|crackers
doña-pancha|Doña Pancha|Guatemala|snack
diana|Diana|El Salvador|chips
yoki|Yoki|Brazil|snack
elma-chips|Elma Chips|Brazil|chips
ruffles-br|Ruffles Brazil|Brazil|chips
cheetos-br|Cheetos Brazil|Brazil|chips
torcida|Torcida|Brazil|chips
baconzitos|Baconzitos|Brazil|snack
fandangos|Fandangos|Brazil|chips
cebolitos|Cebolitos|Brazil|chips
piraque|Piraquê|Brazil|biscuits
bauducco|Bauducco|Brazil|biscuits
marilan|Marilan|Brazil|biscuits
nestle-br|Nestlé Brazil Confection|Brazil|chocolate
garoto|Garoto|Brazil|chocolate
lacta|Lacta|Brazil|chocolate
arcor|Arcor|Argentina|candy
bagley|Bagley|Argentina|biscuits
terrabusi|Terrabusi|Argentina|biscuits
bonafide|Bonafide|Argentina|chocolate
georgalos|Georgalos|Argentina|candy
toggi|Toggi|Argentina|chips
krachitos|Krachitos|Argentina|chips
lays-ar|Lay's Argentina|Argentina|chips
evercrisp|Evercrisp|Chile|chips
ramitas|Ramitas|Chile|snack
dos-en-uno|Dos en Uno|Chile|candy
ambrosoli|Ambrosoli|Chile|candy
costa|Costa|Chile|biscuits
mckay|McKay|Chile|biscuits
super-8|Super 8|Chile|chocolate
sahne-nuss|Sahne Nuss|Chile|chocolate
incaola|Incaola|Peru|snack
free|Free|Peru|chips
nacho-peru|Nacho|Peru|chips
field|Field|Peru|biscuits
victoria|Victoria|Peru|biscuits
san-jorge|San Jorge|Peru|biscuits
casino|Casino|Peru|cookies
margarita|Margarita|Colombia|chips
detodito|Detodito|Colombia|chips
natuchips|Natuchips|Colombia|chips
choclitos|Choclitos|Colombia|snack
jet|Jet|Colombia|chocolate
nacional-de|Nacional de Chocolates|Colombia|chocolate
super-coco|Super Coco|Colombia|candy
bon-bon-bum|Bon Bon Bum|Colombia|candy
simba|Simba|South Africa|chips
niknaks|Nik Naks|South Africa|chips
willards|Willards|South Africa|chips
bakers|Bakers|South Africa|biscuits
tennis|Tennis Biscuits|South Africa|biscuits
romany-creams|Romany Creams|South Africa|biscuits
beacon|Beacon|South Africa|chocolate
lunch-bar|Lunch Bar|South Africa|chocolate
pex|Pex|South Africa|candy
black-cat|Black Cat|South Africa|peanut
big-corn|Big Corn|South Africa|snack
maynards|Maynards|South Africa|candy
cadbury-za|Cadbury South Africa|South Africa|chocolate
smiths|Smith's|Australia|chips
thins|Thins|Australia|chips
cc-au|CC's|Australia|chips
doritos-au|Doritos Australia|Australia|chips
shapes|Shapes|Australia|crackers
jatz|Jatz|Australia|crackers
sao|SAO|Australia|crackers
tim-tam|Tim Tam|Australia|biscuits
violet-crumble|Violet Crumble|Australia|chocolate
cherry-ripe|Cherry Ripe|Australia|chocolate
freddo|Freddo|Australia|chocolate
picnic|Picnic|Australia|chocolate
boost|Boost|Australia|chocolate
crunchie-au|Crunchie Australia|Australia|chocolate
fantales|Fantales|Australia|candy
allen|Allen's|Australia|candy
pascall|Pascall|Australia|candy
minties|Minties|Australia|candy
red-skins|Red Skins|Australia|candy
bluebird|Bluebird|New Zealand|chips
eta|ETA|New Zealand|chips
griffin|Griffin's|New Zealand|biscuits
cookie-time|Cookie Time|New Zealand|cookies
whittakers|Whittaker's|New Zealand|chocolate
giantt|Giant|New Zealand|chocolate
pineapple-lumps|Pineapple Lumps|New Zealand|candy
l-and-p-candy|L&P Candy|New Zealand|candy
funny-frisch|Funny-Frisch|Germany|chips
chio|Chio|Germany|chips
lorenz|Lorenz|Germany|chips
ubben|Ültje|Germany|nuts
seeberger|Seeberger|Germany|nuts
bahlsen|Bahlsen|Germany|biscuits
leibniz|Leibniz|Germany|biscuits
prinzenrolle|Prinzenrolle|Germany|biscuits
knoppers|Knoppers|Germany|wafer
hanuta|Hanuta|Germany|wafer
duplo|Duplo|Germany|chocolate
kinderschokolade|Kinderschokolade|Germany|chocolate
ritter-sport|Ritter Sport|Germany|chocolate
storck|Storck|Germany|candy
werthers|Werther's|Germany|candy
trolli|Trolli|Germany|candy
katjes|Katjes|Germany|candy
nimm2|Nimm2|Germany|candy
maoam|Maoam|Germany|candy
vivil|Vivil|Germany|candy
mentos|Mentos|Netherlands|candy
vina|Vina|Netherlands|chips
lays-nl|Lay's Netherlands|Netherlands|chips
croky|Croky|Belgium|chips
lu|LU|France|biscuits
bn|BN|France|biscuits
st-michel|St Michel|France|biscuits
gerble|Gerblé|France|biscuits
belvita|Belvita|France|biscuits
prince|Prince|France|biscuits
mikado|Mikado|France|biscuits
pims|Pim's|France|biscuits
granola|Granola|France|biscuits
petit-ecolier|Petit Écolier|France|biscuits
cote-dor|Côte d'Or|Belgium|chocolate
leonidas|Leonidas|Belgium|chocolate
neuhaus|Neuhaus|Belgium|chocolate
godiva|Godiva|Belgium|chocolate
guylian|Guylian|Belgium|chocolate
callebaut|Callebaut|Belgium|chocolate
tony|Tony's Chocolonely|Netherlands|chocolate
verkaade|Verkade|Netherlands|biscuits
bolletje|Bolletje|Netherlands|biscuits
dulcesol|Dulcesol|Spain|pastry
artiach|Artiach|Spain|biscuits
fontaneda|Fontaneda|Spain|biscuits
cuetara|Cuétara|Spain|biscuits
gullon|Gullón|Spain|biscuits
marabou|Marabou|Sweden|chocolate
dumle|Dumle|Sweden|candy
polly|Polly|Sweden|candy
ahlgrens|Ahlgrens bilar|Sweden|candy
olw|OLW|Sweden|chips
estar|Estrella|Sweden|chips
kims|KiMs|Denmark|chips
toms|Toms|Denmark|chocolate
freia|Freia|Norway|chocolate
nidar|Nidar|Norway|chocolate
kims-no|KiMs Norway|Norway|chips
fazermint|Fazer|Finland|chocolate
dumle-fi|Dumle Finland|Finland|candy
tupla|Tupla|Finland|chocolate
geisha|Geisha|Finland|chocolate
sultan|Sultan|Turkey|biscuits
eti|Eti|Turkey|biscuits
ulker|Ülker|Turkey|biscuits
albeni|Albeni|Turkey|chocolate
hobby|Hobby|Turkey|chocolate
metro|Metro|Turkey|chocolate
cokokrem|Çokokrem|Turkey|spread
ruffles-tr|Ruffles Turkey|Turkey|chips
lays-tr|Lay's Turkey|Turkey|chips
doritos-tr|Doritos Turkey|Turkey|chips
crax|Crax|Turkey|chips
komili|Komili Snack|Turkey|snack
pocky-th|Pocky Thailand|Thailand|snack
tao-kae-noi|Tao Kae Noi|Thailand|seaweed
mammos|Mammos|Thailand|snack
koh-kae|Koh-Kae|Thailand|peanuts
irvin|Irvin|Singapore|snack
bengawan|Bengawan Solo|Singapore|pastry
khong-guan-sg|Khong Guan Singapore|Singapore|biscuits
julies|Julie's|Malaysia|biscuits
muni|Munchy's|Malaysia|biscuits
halla|Hacks|Malaysia|candy
bika|Bika|Malaysia|snack
super|Super Ring|Malaysia|snack
jacker|Jacker|Malaysia|chips
prawn-crackers|prawn crackers brand|Malaysia|snack
parle-g|Parle-G|India|biscuits
britannia|Britannia|India|biscuits
sunfeast|Sunfeast|India|biscuits
hide-seek|Hide & Seek|India|cookies
bourbon-in|Bourbon India|India|biscuits
good-day|Good Day|India|cookies
marie-gold|Marie Gold|India|biscuits
monaco|Monaco|India|crackers
fifty-fifty|Fifty Fifty|India|crackers
krackjack|Krackjack|India|crackers
haldiram|Haldiram's|India|snack
bikano|Bikano|India|snack
balaji|Balaji|India|chips
uncle-chips|Uncle Chipps|India|chips
bingo|Bingo|India|chips
kurkure|Kurkure|India|snack
too-yum|Too Yumm|India|chips
yogurt|Yogurtland Snack|India|snack
amul-chocolate|Amul Chocolate|India|chocolate
dairy-milk|Dairy Milk India|India|chocolate
5-star|5 Star|India|chocolate
perk|Perk|India|chocolate
munch|Munch|India|chocolate
kiss-me|Kiss Me|India|candy
pulse|Pulse|India|candy
alpenliebe|Alpenliebe|India|candy
center-fresh|Center Fresh|India|gum
center-fruit|Center Fruit|India|gum
hajmola|Hajmola|India|candy
pochuc|Poiana|Romania|chocolate
rom|ROM|Romania|chocolate
eugenia|Eugenia|Romania|biscuits
gyori|Győri Édes|Hungary|biscuits
tibi|Tibi|Hungary|chocolate
sport-szelet|Sport szelet|Hungary|chocolate
boci|Boci|Hungary|chocolate
pick-snack|Pick Snack|Hungary|snack
horalky|Horalky|Slovakia|wafer
tatranky|Tatranky|Slovakia|wafer
figaro-sk|Figaro|Slovakia|chocolate
kras|Kraš|Croatia|chocolate
bajadera|Bajadera|Croatia|chocolate
dorina|Dorina|Croatia|chocolate
gorenjka|Gorenjka|Slovenia|chocolate
stark|Štark|Serbia|chocolate
plazma|Plazma|Serbia|biscuits
najlepse|Najlepše želje|Serbia|chocolate
banini|Banini|Serbia|biscuits
kalev|Kalev|Estonia|chocolate
laima|Laima|Latvia|chocolate
selga|Selga|Latvia|biscuits
pergale|Pergalė|Lithuania|chocolate
ruta|Rūta|Lithuania|chocolate
freyja|Freyja|Iceland|chocolate
noi-sirius|Nói Síríus|Iceland|chocolate
omnom|Omnom|Iceland|chocolate
grand-candy|Grand Candy|Armenia|candy
barambo|Barambo|Georgia|chocolate
rakhat|Rakhat|Kazakhstan|chocolate
bayan-sulu|Bayan Sulu|Kazakhstan|chocolate
bamba|Bamba|Israel|snack
bisli|Bisli|Israel|snack
elite|Elite|Israel|chocolate
osem-snack|Osem Snack|Israel|snack
chipsi|Chipsi|Egypt|chips
corona-eg|Corona|Egypt|chips
molto|Molto|Egypt|cake
todo|Todo|Egypt|cake
edita|Edita|Egypt|pastry
gala|Gala|Nigeria|snack
nasco-snack|NASCO Snack|Nigeria|biscuits
fansnack|Fan Milk Snack|Ghana|snack
trade-kings|Trade Kings|Zambia|candy
proton|Proton Foods|Zimbabwe|snack
bimo|BIMO|Algeria|biscuits
saida|Saïda|Algeria|biscuits
landor|Landor|Tunisia|biscuits
pops|Pops|Lebanon|chips
masterpiece-lb|Masterpiece|Lebanon|chocolate
cortas-snack|Cortas Snack|Lebanon|snack
grace-snack|Grace Snack|Jamaica|snack
walkerswood-snack|Walkerswood|Jamaica|condiment
wisynco-snack|Wisynco Snack|Jamaica|snack
chicky|Chicky|Paraguay|snack
delizia-snack|Delizia|Bolivia|snack
`,
);

writeFileSync(join(root, "_partial.json"), JSON.stringify({ softdrinks, snacks }));
console.log("softdrinks", softdrinks.items.length, "snacks", snacks.items.length);
