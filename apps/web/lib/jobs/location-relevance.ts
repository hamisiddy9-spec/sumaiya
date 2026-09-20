/**
 * Location reachability for job recommendations.
 *
 * WHY THIS EXISTS
 *   The recommendation score (`lib/job-match.ts`) is pure keyword overlap between
 *   a CV and a job description. A Dar es Salaam warehouse supervisor's CV shares
 *   enough generic terms with a Canada-only logistics posting to clear MIN_SCORE,
 *   even though the user has no realistic way to take that job.
 *
 * WHAT IT REPLACED
 *   The first version returned a MULTIPLIER that was Tanzania-first: same country
 *   1.0, "East African neighbour" (a hardcoded, Tanzania-centric country set) 0.7,
 *   everything else 0.3, remote 1.0. Measured against the live 1,204-row feed it
 *   multiplied 50.5% of every listing by 0.3 — including all of Africa outside the
 *   nine hardcoded neighbours — and it could not express the most important modern
 *   distinction at all: "Remote" and "Remote (US Only)" both scored 1.0, while
 *   "Lagos, Nigeria" and "London, United Kingdom" both scored 0.3. It also only
 *   worked for a user in Tanzania: the country map did not list Nigeria, so a Lagos
 *   user's own country failed to resolve and fell through to a token-overlap guess.
 *
 * THE MODEL (tiers of reachability, not a Tanzania ranking)
 *   A listing's location is resolved to { countries, cities, region groups, remote
 *   flag, remote-restriction } — no geocoding, no network, no AI. The user side is
 *   the same structure. The pair gives exactly one TIER, and the tier gives a
 *   bounded multiplier in [0.86, 1.06]:
 *
 *     same-city               1.06   the user is already there
 *     same-country            1.03   their own country
 *     home-market             1.03   no user location stated; app's default market
 *     remote-worldwide        1.00   available from anywhere (incl. "Worldwide")
 *     unrestricted            1.00   no user location stated — never penalise
 *     location-unknown        1.00   job's location text is unparseable — no basis
 *     same-subregion          0.99   e.g. Tanzania ↔ Kenya (UN sub-region)
 *     same-region             0.96   same continent, different sub-region
 *     remote-region-eligible  0.96   remote, restricted to a region that includes them
 *     remote-region-locked    0.90   "Remote (US Only)" for a non-US user
 *     location-locked         0.86   specific foreign place, not remote
 *
 *   Bounded on purpose. The widest possible geographic gap (1.06 / 0.86 = 1.233) is
 *   smaller than 25%, so a listing with more than ~23% better keyword evidence
 *   always outranks a more local one. Location re-orders near-ties; it does not
 *   decide the list. That is what the owner's "not just tanzania" instruction
 *   requires, and it is the opposite of the 0.3 blanket the first version applied.
 *   It also generalises: the tiers are computed from geography data for ~180
 *   countries, so a user in Nairobi, Lagos, Accra, Cairo, Lisbon or Lima gets the
 *   same model with their own country as "home", not Tanzania's.
 *
 * TWO AXES, NOT ONE — and the second one was found by measuring, not by design
 *   A bounded nudge alone is not enough, and the live feed proved it. Scoring a
 *   Dar es Salaam software engineer's CV showed a San Francisco ON-SITE role that
 *   matched at 58% taking first place (49.9) above every African listing and every
 *   worldwide-remote one — a job they cannot take. So `reachable` is a CLASS, and
 *   `compareByReach` sorts on it BEFORE the score:
 *
 *     1. class   — listings the user can work from (their country, their
 *                  neighbours, their continent, global remote, and region-locked
 *                  remote that includes them) come before listings tied to a
 *                  place they cannot (foreign on-site roles, remote locked away
 *                  from them). `relocate: true` moves everything into class 1.
 *     2. score   — keyword evidence nudged by the bounded multiplier above, so a
 *                  better-matched role wins inside the class.
 *
 *   The class is broad and symmetric — for ANY user it means their own country,
 *   their neighbours, their continent and every remote listing open to them — so
 *   this is not "Tanzania first" wearing a new name, and it is not a filter:
 *   unreachable listings still fill the cache whenever the user has fewer than
 *   TOP_K reachable matches.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   - It never removes a listing. `recommend.ts` gates on the raw keyword score;
 *     the location factor only changes the ORDER. Nothing is silently dropped.
 *   - It never penalises a missing user location. With no stated location there is
 *     no evidence of where the user is, so every non-default-market listing scores
 *     1.00 and the app's default market gets a +3% tailwind. A user must not be
 *     pushed into an empty feed by data we never collected.
 *   - It makes no claim about visa eligibility. "Requires US work authorisation"
 *     is a disclosure for the UI (`reachable: false` + `label`), not a hidden
 *     filter — Indeed's own guidance is that some "Remote-MI" listings are looser
 *     than they look, so the user judges, not the ranker.
 *
 * KNOWN LIMITS (see the tests for pinned behaviour, and the PR description for what
 * to measure next): land-border adjacency is approximated by UN sub-region; "EU"
 * is an explicit country list but "Europe" is the geographic continent (so a UK
 * user reads as eligible for a Europe-region remote role); city names that exist in
 * two countries ("Cambridge", "San Jose") resolve to one; and a free-text location
 * column sometimes holds the EMPLOYER's name, so a place name inside a company name
 * can resolve as if it were the job's location.
 */
import { isRemoteLocation } from "./feed-filter";

// ─── Geography data ─────────────────────────────────────────────────────────
// Compact pipe-separated tables, parsed once at module load into Maps. Kept as
// text so the data is scannable and diffable — this is the only "knowledge" in
// the module and it is deliberately data, not code.

type Continent = "Africa" | "Europe" | "Asia" | "North America" | "South America" | "Oceania";

/** name|iso2|continent|subregion|alt names (comma separated) */
const COUNTRY_TABLE = `
Algeria|DZ|Africa|Northern Africa|algerie
Angola|AO|Africa|Middle Africa
Benin|BJ|Africa|Western Africa
Botswana|BW|Africa|Southern Africa
Burkina Faso|BF|Africa|Western Africa
Burundi|BI|Africa|Eastern Africa
Cabo Verde|CV|Africa|Western Africa|cape verde
Cameroon|CM|Africa|Middle Africa|cameroun
Central African Republic|CF|Africa|Middle Africa
Chad|TD|Africa|Middle Africa
Comoros|KM|Africa|Eastern Africa
Congo (DRC)|CD|Africa|Middle Africa|drc,democratic republic of the congo,congo kinshasa,zaire
Congo (Republic)|CG|Africa|Middle Africa|republic of the congo,congo brazzaville
Cote d Ivoire|CI|Africa|Western Africa|cote d'ivoire,ivory coast
Djibouti|DJ|Africa|Eastern Africa
Egypt|EG|Africa|Northern Africa
Equatorial Guinea|GQ|Africa|Middle Africa
Eritrea|ER|Africa|Eastern Africa
Eswatini|SZ|Africa|Southern Africa|swaziland
Ethiopia|ET|Africa|Eastern Africa
Gabon|GA|Africa|Middle Africa
Gambia|GM|Africa|Western Africa
Ghana|GH|Africa|Western Africa
Guinea|GN|Africa|Western Africa
Guinea-Bissau|GW|Africa|Western Africa
Kenya|KE|Africa|Eastern Africa
Lesotho|LS|Africa|Southern Africa
Liberia|LR|Africa|Western Africa
Libya|LY|Africa|Northern Africa
Madagascar|MG|Africa|Eastern Africa
Malawi|MW|Africa|Eastern Africa
Mali|ML|Africa|Western Africa
Mauritania|MR|Africa|Western Africa
Mauritius|MU|Africa|Eastern Africa
Morocco|MA|Africa|Northern Africa
Mozambique|MZ|Africa|Eastern Africa
Namibia|NA|Africa|Southern Africa
Niger|NE|Africa|Western Africa
Nigeria|NG|Africa|Western Africa
Rwanda|RW|Africa|Eastern Africa
Sao Tome and Principe|ST|Africa|Middle Africa
Senegal|SN|Africa|Western Africa
Seychelles|SC|Africa|Eastern Africa
Sierra Leone|SL|Africa|Western Africa
Somalia|SO|Africa|Eastern Africa
South Africa|ZA|Africa|Southern Africa
South Sudan|SS|Africa|Eastern Africa
Sudan|SD|Africa|Northern Africa
Tanzania|TZ|Africa|Eastern Africa|tanzania united republic of,united republic of tanzania,tanzanian
Togo|TG|Africa|Western Africa
Tunisia|TN|Africa|Northern Africa
Uganda|UG|Africa|Eastern Africa
Zambia|ZM|Africa|Eastern Africa
Zimbabwe|ZW|Africa|Eastern Africa
Albania|AL|Europe|Southern Europe
Andorra|AD|Europe|Southern Europe
Austria|AT|Europe|Western Europe
Belarus|BY|Europe|Eastern Europe
Belgium|BE|Europe|Western Europe
Bosnia and Herzegovina|BA|Europe|Southern Europe
Bulgaria|BG|Europe|Eastern Europe
Croatia|HR|Europe|Southern Europe
Cyprus|CY|Europe|Southern Europe
Czechia|CZ|Europe|Eastern Europe|czech republic
Denmark|DK|Europe|Northern Europe
Estonia|EE|Europe|Northern Europe
Finland|FI|Europe|Northern Europe
France|FR|Europe|Western Europe
Germany|DE|Europe|Western Europe|deutschland
Greece|GR|Europe|Southern Europe
Hungary|HU|Europe|Eastern Europe
Iceland|IS|Europe|Northern Europe
Ireland|IE|Europe|Northern Europe
Italy|IT|Europe|Southern Europe
Kosovo|XK|Europe|Southern Europe
Latvia|LV|Europe|Northern Europe
Liechtenstein|LI|Europe|Western Europe
Lithuania|LT|Europe|Northern Europe
Luxembourg|LU|Europe|Western Europe
Malta|MT|Europe|Southern Europe
Moldova|MD|Europe|Eastern Europe
Monaco|MC|Europe|Western Europe
Montenegro|ME|Europe|Southern Europe
Netherlands|NL|Europe|Western Europe|holland
North Macedonia|MK|Europe|Southern Europe|macedonia
Norway|NO|Europe|Northern Europe
Poland|PL|Europe|Eastern Europe
Portugal|PT|Europe|Southern Europe
Romania|RO|Europe|Eastern Europe
Russia|RU|Europe|Eastern Europe|russian federation
San Marino|SM|Europe|Southern Europe
Serbia|RS|Europe|Southern Europe
Slovakia|SK|Europe|Eastern Europe
Slovenia|SI|Europe|Southern Europe
Spain|ES|Europe|Southern Europe
Sweden|SE|Europe|Northern Europe
Switzerland|CH|Europe|Western Europe
Ukraine|UA|Europe|Eastern Europe
United Kingdom|GB|Europe|Northern Europe|uk,great britain,britain,england,scotland,wales,northern ireland
Vatican City|VA|Europe|Southern Europe
Afghanistan|AF|Asia|Southern Asia
Armenia|AM|Asia|Western Asia
Azerbaijan|AZ|Asia|Western Asia
Bahrain|BH|Asia|Western Asia
Bangladesh|BD|Asia|Southern Asia
Bhutan|BT|Asia|Southern Asia
Brunei|BN|Asia|South-Eastern Asia
Cambodia|KH|Asia|South-Eastern Asia
China|CN|Asia|Eastern Asia|hong kong,macau,prc
Georgia|GE|Asia|Western Asia
India|IN|Asia|Southern Asia
Indonesia|ID|Asia|South-Eastern Asia
Iran|IR|Asia|Southern Asia
Iraq|IQ|Asia|Western Asia
Israel|IL|Asia|Western Asia
Japan|JP|Asia|Eastern Asia
Jordan|JO|Asia|Western Asia
Kazakhstan|KZ|Asia|Central Asia
Kuwait|KW|Asia|Western Asia
Kyrgyzstan|KG|Asia|Central Asia
Laos|LA|Asia|South-Eastern Asia|lao
Lebanon|LB|Asia|Western Asia
Malaysia|MY|Asia|South-Eastern Asia
Maldives|MV|Asia|Southern Asia
Mongolia|MN|Asia|Eastern Asia
Myanmar|MM|Asia|South-Eastern Asia|burma
Nepal|NP|Asia|Southern Asia
North Korea|KP|Asia|Eastern Asia
Oman|OM|Asia|Western Asia
Pakistan|PK|Asia|Southern Asia
Palestine|PS|Asia|Western Asia
Philippines|PH|Asia|South-Eastern Asia
Qatar|QA|Asia|Western Asia
Saudi Arabia|SA|Asia|Western Asia
Singapore|SG|Asia|South-Eastern Asia
South Korea|KR|Asia|Eastern Asia|korea,korea republic of,republic of korea
Sri Lanka|LK|Asia|Southern Asia
Syria|SY|Asia|Western Asia
Taiwan|TW|Asia|Eastern Asia
Tajikistan|TJ|Asia|Central Asia
Thailand|TH|Asia|South-Eastern Asia
Timor-Leste|TL|Asia|South-Eastern Asia
Turkey|TR|Asia|Western Asia|turkiye
Turkmenistan|TM|Asia|Central Asia
United Arab Emirates|AE|Asia|Western Asia|uae,emirates
Uzbekistan|UZ|Asia|Central Asia
Vietnam|VN|Asia|South-Eastern Asia|viet nam
Yemen|YE|Asia|Western Asia
Antigua and Barbuda|AG|North America|Caribbean
Argentina|AR|South America|South America|argentine
Bahamas|BS|North America|Caribbean
Barbados|BB|North America|Caribbean
Belize|BZ|North America|Central America
Bolivia|BO|South America|South America
Brazil|BR|South America|South America|brasil
Canada|CA|North America|Northern America
Chile|CL|South America|South America
Colombia|CO|South America|South America
Costa Rica|CR|North America|Central America
Cuba|CU|North America|Caribbean
Dominica|DM|North America|Caribbean
Dominican Republic|DO|North America|Caribbean
Ecuador|EC|South America|South America
El Salvador|SV|North America|Central America
Grenada|GD|North America|Caribbean
Guatemala|GT|North America|Central America
Guyana|GY|South America|South America
Haiti|HT|North America|Caribbean
Honduras|HN|North America|Central America
Jamaica|JM|North America|Caribbean
Mexico|MX|North America|Central America|mexico city
Nicaragua|NI|North America|Central America
Panama|PA|North America|Central America
Paraguay|PY|South America|South America
Peru|PE|South America|South America
Puerto Rico|PR|North America|Caribbean
Saint Kitts and Nevis|KN|North America|Caribbean
Saint Lucia|LC|North America|Caribbean
Saint Vincent and the Grenadines|VC|North America|Caribbean
Suriname|SR|South America|South America
Trinidad and Tobago|TT|North America|Caribbean
United States|US|North America|Northern America|usa,us,united states of america,united states of america (usa)
Uruguay|UY|South America|South America
Venezuela|VE|South America|South America
Australia|AU|Oceania|Australasia
Fiji|FJ|Oceania|Melanesia
Kiribati|KI|Oceania|Micronesia
Marshall Islands|MH|Oceania|Micronesia
Micronesia|FM|Oceania|Micronesia
Nauru|NR|Oceania|Micronesia
New Zealand|NZ|Oceania|Australasia
Palau|PW|Oceania|Micronesia
Papua New Guinea|PG|Oceania|Melanesia
Samoa|WS|Oceania|Polynesia
Solomon Islands|SB|Oceania|Melanesia
Tonga|TO|Oceania|Polynesia
Tuvalu|TV|Oceania|Polynesia
Vanuatu|VU|Oceania|Melanesia
`;

/** city|Country  — the city-level signal that makes "same-city" possible. */
const CITY_TABLE = `
dar es salaam|Tanzania
dar|Tanzania
dodoma|Tanzania
mwanza|Tanzania
arusha|Tanzania
zanzibar|Tanzania
unguja|Tanzania
pemba|Tanzania
mbeya|Tanzania
morogoro|Tanzania
tanga|Tanzania
moshi|Tanzania
kigoma|Tanzania
tabora|Tanzania
iringa|Tanzania
bukoba|Tanzania
musoma|Tanzania
shinyanga|Tanzania
songea|Tanzania
mtwara|Tanzania
lindi|Tanzania
njombe|Tanzania
geita|Tanzania
singida|Tanzania
kilimanjaro|Tanzania
manyara|Tanzania
babati|Tanzania
kahama|Tanzania
kibaha|Tanzania
bagamoyo|Tanzania
ifakara|Tanzania
tukuyu|Tanzania
pwani|Tanzania
kagera|Tanzania
ruvuma|Tanzania
rukwa|Tanzania
katavi|Tanzania
simiyu|Tanzania
nairobi|Kenya
mombasa|Kenya
kisumu|Kenya
nakuru|Kenya
eldoret|Kenya
thika|Kenya
nyeri|Kenya
kericho|Kenya
kakamega|Kenya
malindi|Kenya
garissa|Kenya
meru|Kenya
machakos|Kenya
naivasha|Kenya
kampala|Uganda
entebbe|Uganda
jinja|Uganda
mbarara|Uganda
gulu|Uganda
kigali|Rwanda
butare|Rwanda
gisenyi|Rwanda
bujumbura|Burundi
gitega|Burundi
lusaka|Zambia
kitwe|Zambia
ndola|Zambia
livingstone|Zambia
lilongwe|Malawi
blantyre|Malawi
mzuzu|Malawi
maputo|Mozambique
beira|Mozambique
nampula|Mozambique
kinshasa|Congo (DRC)
lubumbashi|Congo (DRC)
goma|Congo (DRC)
bukavu|Congo (DRC)
matadi|Congo (DRC)
lagos|Nigeria
abuja|Nigeria
kano|Nigeria
ibadan|Nigeria
port harcourt|Nigeria
benin city|Nigeria
enugu|Nigeria
maiduguri|Nigeria
kaduna|Nigeria
abeokuta|Nigeria
accra|Ghana
kumasi|Ghana
tamale|Ghana
takoradi|Ghana
johannesburg|South Africa
cape town|South Africa
durban|South Africa
pretoria|South Africa
sandton|South Africa
port elizabeth|South Africa
bloemfontein|South Africa
cairo|Egypt
alexandria|Egypt
giza|Egypt
casablanca|Morocco
rabat|Morocco
marrakech|Morocco
tangier|Morocco
addis ababa|Ethiopia
addis|Ethiopia
dire dawa|Ethiopia
hawassa|Ethiopia
dakar|Senegal
abidjan|Cote d Ivoire
yamoussoukro|Cote d Ivoire
douala|Cameroon
yaounde|Cameroon
harare|Zimbabwe
bulawayo|Zimbabwe
luanda|Angola
gaborone|Botswana
windhoek|Namibia
tunis|Tunisia
algiers|Algeria
oran|Algeria
tripoli|Libya
khartoum|Sudan
juba|South Sudan
mogadishu|Somalia
antananarivo|Madagascar
port louis|Mauritius
victoria|Seychelles
libreville|Gabon
brazzaville|Congo (Republic)
freetown|Sierra Leone
monrovia|Liberia
lome|Togo
cotonou|Benin
ouagadougou|Burkina Faso
bamako|Mali
niamey|Niger
ndjamena|Chad
conakry|Guinea
banjul|Gambia
asmara|Eritrea
nouakchott|Mauritania
moroni|Comoros
praia|Cabo Verde
london|United Kingdom
greater london|United Kingdom
manchester|United Kingdom
birmingham|United Kingdom
edinburgh|United Kingdom
glasgow|United Kingdom
bristol|United Kingdom
leeds|United Kingdom
cambridge|United Kingdom
oxford|United Kingdom
belfast|United Kingdom
cardiff|United Kingdom
dublin|Ireland
cork|Ireland
paris|France
lyon|France
marseille|France
toulouse|France
bordeaux|France
lille|France
berlin|Germany
munich|Germany
munchen|Germany
hamburg|Germany
frankfurt|Germany
cologne|Germany
koln|Germany
dusseldorf|Germany
stuttgart|Germany
leipzig|Germany
dresden|Germany
nuremberg|Germany
essen|Germany
dortmund|Germany
bonn|Germany
karlsruhe|Germany
heidelberg|Germany
bavaria|Germany
vienna|Austria
wien|Austria
salzburg|Austria
graz|Austria
zurich|Switzerland
geneva|Switzerland
basel|Switzerland
bern|Switzerland
lausanne|Switzerland
amsterdam|Netherlands
rotterdam|Netherlands
utrecht|Netherlands
eindhoven|Netherlands
the hague|Netherlands
brussels|Belgium
antwerp|Belgium
ghent|Belgium
madrid|Spain
barcelona|Spain
valencia|Spain
seville|Spain
bilbao|Spain
malaga|Spain
lisbon|Portugal
lisboa|Portugal
porto|Portugal
rome|Italy
milan|Italy
milano|Italy
turin|Italy
naples|Italy
florence|Italy
bologna|Italy
warsaw|Poland
krakow|Poland
wroclaw|Poland
gdansk|Poland
poznan|Poland
katowice|Poland
prague|Czechia
brno|Czechia
stockholm|Sweden
gothenburg|Sweden
malmo|Sweden
oslo|Norway
bergen|Norway
trondheim|Norway
copenhagen|Denmark
aarhus|Denmark
helsinki|Finland
espoo|Finland
tampere|Finland
reykjavik|Iceland
tallinn|Estonia
riga|Latvia
vilnius|Lithuania
budapest|Hungary
bucharest|Romania
cluj|Romania
sofia|Bulgaria
athens|Greece
thessaloniki|Greece
zagreb|Croatia
belgrade|Serbia
kyiv|Ukraine
kiev|Ukraine
lviv|Ukraine
istanbul|Turkey
ankara|Turkey
izmir|Turkey
moscow|Russia
saint petersburg|Russia
st petersburg|Russia
dubai|United Arab Emirates
abu dhabi|United Arab Emirates
sharjah|United Arab Emirates
riyadh|Saudi Arabia
jeddah|Saudi Arabia
dammam|Saudi Arabia
doha|Qatar
kuwait city|Kuwait
manama|Bahrain
muscat|Oman
amman|Jordan
beirut|Lebanon
tel aviv|Israel
jerusalem|Israel
haifa|Israel
bangalore|India
bengaluru|India
gurugram|India
gurgaon|India
mumbai|India
new delhi|India
delhi|India
noida|India
hyderabad|India
pune|India
chennai|India
kolkata|India
ahmedabad|India
jaipur|India
kochi|India
karachi|Pakistan
lahore|Pakistan
islamabad|Pakistan
dhaka|Bangladesh
chittagong|Bangladesh
colombo|Sri Lanka
kathmandu|Nepal
beijing|China
shanghai|China
shenzhen|China
guangzhou|China
hangzhou|China
chengdu|China
xian|China
wuhan|China
suzhou|China
tokyo|Japan
osaka|Japan
kyoto|Japan
yokohama|Japan
nagoya|Japan
fukuoka|Japan
seoul|South Korea
busan|South Korea
incheon|South Korea
taipei|Taiwan
kuala lumpur|Malaysia
penang|Malaysia
johor bahru|Malaysia
jakarta|Indonesia
surabaya|Indonesia
bandung|Indonesia
bali|Indonesia
denpasar|Indonesia
bangkok|Thailand
chiang mai|Thailand
phuket|Thailand
hanoi|Vietnam
ho chi minh city|Vietnam
saigon|Vietnam
da nang|Vietnam
manila|Philippines
cebu|Philippines
makati|Philippines
taguig|Philippines
quezon city|Philippines
sydney|Australia
melbourne|Australia
brisbane|Australia
perth|Australia
adelaide|Australia
canberra|Australia
gold coast|Australia
hobart|Australia
auckland|New Zealand
wellington|New Zealand
christchurch|New Zealand
toronto|Canada
vancouver|Canada
montreal|Canada
calgary|Canada
ottawa|Canada
edmonton|Canada
winnipeg|Canada
halifax|Canada
mississauga|Canada
waterloo|Canada
ontario|Canada
quebec|Canada
british columbia|Canada
alberta|Canada
new york|United States
nyc|United States
san francisco|United States
los angeles|United States
chicago|United States
boston|United States
seattle|United States
austin|United States
denver|United States
atlanta|United States
dallas|United States
houston|United States
miami|United States
philadelphia|United States
phoenix|United States
san diego|United States
san jose|United States
santa clara|United States
sunnyvale|United States
mountain view|United States
palo alto|United States
menlo park|United States
redwood city|United States
cupertino|United States
berkeley|United States
oakland|United States
sacramento|United States
portland|United States
minneapolis|United States
detroit|United States
columbus|United States
indianapolis|United States
nashville|United States
charlotte|United States
raleigh|United States
durham|United States
research triangle|United States
pittsburgh|United States
cleveland|United States
cincinnati|United States
st louis|United States
kansas city|United States
salt lake city|United States
las vegas|United States
orlando|United States
tampa|United States
baltimore|United States
washington dc|United States
boulder|United States
ann arbor|United States
madison|United States
arlington|United States
reston|United States
herndon|United States
mclean|United States
california|United States
texas|United States
new york state|United States
massachusetts|United States
illinois|United States
colorado|United States
georgia state|United States
virginia|United States
mexico city|Mexico
guadalajara|Mexico
monterrey|Mexico
tijuana|Mexico
queretaro|Mexico
sao paulo|Brazil
rio de janeiro|Brazil
brasilia|Brazil
belo horizonte|Brazil
porto alegre|Brazil
curitiba|Brazil
recife|Brazil
salvador|Brazil
buenos aires|Argentina
cordoba|Argentina
rosario|Argentina
santiago|Chile
valparaiso|Chile
bogota|Colombia
medellin|Colombia
cali|Colombia
lima|Peru
montevideo|Uruguay
quito|Ecuador
guayaquil|Ecuador
caracas|Venezuela
la paz|Bolivia
santa cruz|Bolivia
asuncion|Paraguay
guatemala city|Guatemala
havana|Cuba
kingston|Jamaica
santo domingo|Dominican Republic
port of spain|Trinidad and Tobago
nassau|Bahamas
bridgetown|Barbados
`;

/**
 * Region/country-group keywords. `continents` = the whole geographic region;
 * `countries` = an explicit membership list where the label is political rather
 * than geographic (EU, EEA, LATAM, Middle East, Nordics…) — a continent test
 * would be wrong for those.
 */
const REGION_GROUPS: Record<string, { continents?: Continent[]; countries?: string[] }> = {
  "worldwide": {}, "anywhere": {}, "global": {}, "world": {},
  "africa": { continents: ["Africa"] },
  "sub-saharan africa": { continents: ["Africa"] },
  "subsaharan africa": { continents: ["Africa"] },
  "ssa": { continents: ["Africa"] },
  "east africa": { continents: ["Africa"] },
  "west africa": { continents: ["Africa"] },
  "central africa": { continents: ["Africa"] },
  "southern africa": { continents: ["Africa"] },
  "north africa": { continents: ["Africa"] },
  "emea": { continents: ["Europe", "Africa", "Asia"] },
  "mena": { continents: ["Africa", "Asia"] },
  "europe": { continents: ["Europe"] },
  "eu": { countries: ["Austria","Belgium","Bulgaria","Croatia","Cyprus","Czechia","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Ireland","Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands","Poland","Portugal","Romania","Slovakia","Slovenia","Spain","Sweden"] },
  "european union": { countries: ["Austria","Belgium","Bulgaria","Croatia","Cyprus","Czechia","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Ireland","Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands","Poland","Portugal","Romania","Slovakia","Slovenia","Spain","Sweden"] },
  "eea": { countries: ["Austria","Belgium","Bulgaria","Croatia","Cyprus","Czechia","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Iceland","Ireland","Italy","Latvia","Liechtenstein","Lithuania","Luxembourg","Malta","Netherlands","Norway","Poland","Portugal","Romania","Slovakia","Slovenia","Spain","Sweden"] },
  "dach": { countries: ["Germany","Austria","Switzerland"] },
  "benelux": { countries: ["Belgium","Netherlands","Luxembourg"] },
  "nordics": { countries: ["Denmark","Finland","Iceland","Norway","Sweden"] },
  "scandinavia": { countries: ["Denmark","Norway","Sweden"] },
  "asia": { continents: ["Asia"] },
  "apac": { continents: ["Asia", "Oceania"] },
  "asia pacific": { continents: ["Asia", "Oceania"] },
  "anz": { countries: ["Australia","New Zealand"] },
  "australasia": { continents: ["Oceania"] },
  "oceania": { continents: ["Oceania"] },
  "latam": { countries: ["Mexico","Guatemala","Belize","El Salvador","Honduras","Nicaragua","Costa Rica","Panama","Cuba","Dominican Republic","Haiti","Jamaica","Puerto Rico","Trinidad and Tobago","Barbados","Bahamas","Colombia","Venezuela","Ecuador","Peru","Bolivia","Brazil","Paraguay","Uruguay","Argentina","Chile","Guyana","Suriname"] },
  "latin america": { countries: ["Mexico","Guatemala","Belize","El Salvador","Honduras","Nicaragua","Costa Rica","Panama","Cuba","Dominican Republic","Haiti","Jamaica","Puerto Rico","Trinidad and Tobago","Barbados","Bahamas","Colombia","Venezuela","Ecuador","Peru","Bolivia","Brazil","Paraguay","Uruguay","Argentina","Chile","Guyana","Suriname"] },
  "north america": { continents: ["North America"] },
  "namer": { continents: ["North America"] },
  "northern america": { continents: ["North America"] },
  "south america": { continents: ["South America"] },
  "central america": { continents: ["North America"] },
  "caribbean": { continents: ["North America"] },
  "americas": { continents: ["North America", "South America"] },
  "middle east": { countries: ["Bahrain","Iran","Iraq","Israel","Jordan","Kuwait","Lebanon","Oman","Palestine","Qatar","Saudi Arabia","Syria","Turkey","United Arab Emirates","Yemen","Egypt"] },
};

/**
 * Location words that identify nothing on their own. Unused by the resolver
 * (a token only resolves if it is a KNOWN place key), but kept as the explicit
 * deny-list the tests assert against, so a future "fuzzy token overlap" fallback
 * cannot silently start treating "Region" or "Office" as geography — which is
 * exactly how the previous implementation manufactured a false overlap.
 */
export const GENERIC_WORDS = new Set([
  "area","region","regional","city","county","state","province","district","metro",
  "greater","based","office","offices","hq","headquarters","remote","remote-first",
  "only","anywhere","worldwide","global","job","jobs","role","position","vacancy",
  "full","part","time","fulltime","parttime","hybrid","onsite","site","flexible",
  "multiple","locations","location","various","nationwide","countrywide","national",
  "international","preferred","home","homebased","work","from","the","and","or",
  "any","all","other","not","with","for","ours","our","company","team","across",
  "regionwide","gateway","campus","centre","center","north","south","east","west",
]);

/**
 * Remote qualifier words stripped before looking for a remote RESTRICTION.
 * "us"/"usa" are deliberately NOT listed — they ARE the restriction in the
 * single most common remote-locked string we ingest ("Remote US", 63 live
 * rows). "anywhere"/"worldwide"/"global" ARE listed: they widen a remote
 * listing rather than restricting it, so they must not resolve to a place.
 */
const REMOTE_NOISE_WORDS = new Set([
  "remote","remotely","fully","100","telecommute","telework","teleworking","wfh",
  "home","homebased","based","work","from","hybrid","or","and","only","the","a","an",
  "position","role","job","friendly","first","eligible","could","be","done",
  "anywhere","anyplace","worldwide","world","global","any",
]);

/** The app's default market, used ONLY when the user stated no location. */
export const DEFAULT_MARKET = "Tanzania";

// ─── Compiled index ─────────────────────────────────────────────────────────

interface CountryRef { name: string; continent: Continent; subregion: string }

const COUNTRIES = new Map<string, CountryRef>();
const ISO2 = new Map<string, string>();          // "gb" -> "United Kingdom"
/** single token / phrase -> resolved place */
const PLACE_INDEX = new Map<string, { country: string; city?: string }>();
/** multi-word phrases, bucketed by their first token, for a cheap pre-filter */
const PHRASE_INDEX = new Map<string, Array<{ re: RegExp; country: string; city?: string }>>();
/** city key -> country (kept separately: multi-word cities live in PHRASE_INDEX) */
const CITY_COUNTRY = new Map<string, string>();
const REGION_INDEX = new Map<string, { continents?: Continent[]; countries?: string[] }>();
const REGION_PHRASES = [...Object.keys(REGION_GROUPS)].sort((a, b) => b.length - a.length);

/** Lowercase + strip accents, so "München" and "Köln" resolve like Munich/Cologne. */
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Index a place under a folded key. FOLDING IS MANDATORY here and was the first
 * real bug found by the tests: registering "Tanzania" while looking up "tanzania"
 * silently made every capitalised country name unresolvable, which read as
 * "location-unknown" (1.00) instead of a real tier.
 */
function addPlace(key: string, country: string, city?: string) {
  const k = fold(key);
  if (!k) return;
  if (k.includes(" ")) {
    const first = k.split(" ")[0];
    const bucket = PHRASE_INDEX.get(first) ?? [];
    bucket.push({ re: new RegExp(`(^| )${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`), country, city });
    PHRASE_INDEX.set(first, bucket);
  } else {
    PLACE_INDEX.set(k, { country, city });
  }
}

for (const line of COUNTRY_TABLE.trim().split("\n")) {
  const [name, iso2, continent, subregion, alts] = line.split("|").map((s) => s.trim());
  if (!name || !iso2) continue;
  const ref: CountryRef = { name, continent: continent as Continent, subregion };
  COUNTRIES.set(name, ref);
  ISO2.set(iso2.toLowerCase(), name);
  addPlace(name, name);
  if (alts) for (const a of alts.split(",")) addPlace(fold(a), name);
}
for (const line of CITY_TABLE.trim().split("\n")) {
  const [city, country] = line.split("|").map((s) => s.trim());
  if (!city || !country) continue;
  // A city adds city-level precision; the country still resolves through it, so
  // "Nairobi" alone is enough to know both Kenya and Nairobi.
  addPlace(city, country, city);
  CITY_COUNTRY.set(city, country);
}
for (const [k, v] of Object.entries(REGION_GROUPS)) REGION_INDEX.set(k, v);

// ─── Parsing ────────────────────────────────────────────────────────────────

export interface ParsedPlace {
  /** Canonical country names named by this string. */
  countries: string[];
  /** Canonical city keys named by this string. */
  cities: string[];
  /** Region-group keywords named by this string. */
  regions: string[];
  remote: boolean;
  /** True when the string is remote AND still names a place (a remote restriction). */
  restricted: boolean;
  /** False when nothing at all resolved — the caller must not guess from this. */
  recognised: boolean;
}

const EMPTY: ParsedPlace = { countries: [], cities: [], regions: [], remote: false, restricted: false, recognised: false };

/**
 * 2-letter codes that are SAFE to read as a country anywhere in the string:
 * none of them is an ordinary English word, so they cannot be produced by prose
 * like "Based in London" (which must not resolve to India). Everything else is
 * accepted only as the string's final token ("London, gb", "Vancouver, ca").
 *
 * The wide list is used ONLY for a remote RESTRICTION, where every token is
 * already known to be a geographic qualifier ("Remote (US Only)").
 */
const SAFE_CODES = new Set(["uk", "eu", "gb"]);
const REMOTE_CODES = new Set([
  ...SAFE_CODES,
  "us", "ca", "au", "nz", "in", "de", "fr", "es", "pl", "ie", "sg", "ae", "sa", "za",
  "ng", "ke", "tz", "ug", "rw", "ma", "eg", "gh", "pt", "it", "nl", "be", "ch",
  "at", "se", "no", "dk", "fi", "cz", "ro", "gr", "tr", "il", "jp", "kr", "cn",
  "br", "mx", "ar", "cl", "co", "pe",
]);

export interface ParseOptions {
  /** Accept 2-letter country codes anywhere (remote-restriction strings only). */
  looseCodes?: boolean;
}

export function parsePlace(raw: string, opts: ParseOptions = {}): ParsedPlace {
  const src = (raw ?? "").trim();
  if (!src) return { ...EMPTY };

  const remote = isRemoteLocation(src);
  const hay = fold(src);
  const tokens = hay.split(" ").filter(Boolean);
  const allowed = opts.looseCodes ? REMOTE_CODES : SAFE_CODES;

  const countries = new Set<string>();
  const cities = new Set<string>();
  const regions = new Set<string>();

  // 1. Region-group keywords — longest first so "european union" beats "eu".
  for (const phrase of REGION_PHRASES) {
    if (hay.includes(phrase)) regions.add(phrase);
  }
  // "eu" as a bare token must not match inside another word ("euler"), so require
  // word boundaries for the 2-letter group keys.
  if (regions.size) {
    for (const r of [...regions]) {
      if (r.length <= 3 && !new RegExp(`(^| )${r}( |$)`).test(hay)) regions.delete(r);
    }
  }

  // 2. Places — single tokens by Map, multi-word phrases only when their first
  //    token is present (keeps the per-listing cost tiny on a 1,200-row feed).
  const last = tokens.length - 1;
  tokens.forEach((t, i) => {
    const hit = PLACE_INDEX.get(t);
    if (hit) {
      countries.add(hit.country);
      if (hit.city) cities.add(hit.city);
      return;
    }
    // 2-letter ISO codes are ambiguous in prose ("in", "no", "so") — accept them
    // only as the final token, or anywhere when the token is on the safe list
    // (and, for remote-restriction strings, on the wider remote list).
    if (t.length === 2 && (i === last || allowed.has(t))) {
      const c = ISO2.get(t);
      if (c) countries.add(c);
    }
  });
  for (const t of new Set(tokens)) {
    const bucket = PHRASE_INDEX.get(t);
    if (!bucket) continue;
    for (const p of bucket) {
      if (p.re.test(hay)) {
        countries.add(p.country);
        if (p.city) cities.add(p.city);
      }
    }
  }

  // A region group is not a country; keep both, they answer different questions.
  // "worldwide"/"anywhere"/"global" are region groups with no membership — they
  // must never be read as a restriction.
  for (const r of [...regions]) {
    const g = REGION_INDEX.get(r)!;
    if (!g.continents?.length && !g.countries?.length) regions.delete(r);
  }

  const recognised = countries.size > 0 || cities.size > 0 || regions.size > 0;
  return {
    countries: [...countries],
    cities: [...cities],
    regions: [...regions],
    remote,
    restricted: remote && recognised,
    recognised: recognised || remote,
  };
}

/** Drop remote qualifier words, leaving only a possible geographic restriction. */
function remoteRestrictionText(raw: string): string {
  return fold(raw)
    .split(" ")
    .filter((t) => t && !REMOTE_NOISE_WORDS.has(t))
    .join(" ")
    .trim();
}

/** Parse ONLY what a remote listing says about WHERE you may be. */
export function parseRemoteRestriction(raw: string): ParsedPlace {
  if (!isRemoteLocation(raw)) return { ...EMPTY };
  const remainder = remoteRestrictionText(raw);
  const p = parsePlace(remainder, { looseCodes: true });
  return { ...p, remote: true, restricted: p.countries.length > 0 || p.regions.length > 0 };
}

// ─── Reachability ───────────────────────────────────────────────────────────

export type ReachTier =
  | "same-city"
  | "same-country"
  | "home-market"
  | "remote-worldwide"
  | "unrestricted"
  | "location-unknown"
  | "same-subregion"
  | "same-region"
  | "remote-region-eligible"
  | "remote-region-locked"
  | "location-locked";

/**
 * The calibration. Bounded to [0.86, 1.06] — see the file header: the widest
 * geographic gap (1.06/0.86 = 1.233) is smaller than the keyword-evidence gap
 * needed to overcome it, so location orders near-ties and never decides the list.
 */
export const REACH_MULTIPLIER: Record<ReachTier, number> = {
  "same-city": 1.06,
  "same-country": 1.03,
  "home-market": 1.03,
  "remote-worldwide": 1.0,
  "unrestricted": 1.0,
  "location-unknown": 1.0,
  "same-subregion": 0.99,
  "same-region": 0.96,
  "remote-region-eligible": 0.96,
  "remote-region-locked": 0.9,
  "location-locked": 0.86,
};

/** Short English labels for the reason string / UI disclosure. */
export const REACH_LABEL: Record<ReachTier, string> = {
  "same-city": "In your city",
  "same-country": "In your country",
  "home-market": "Home market",
  "remote-worldwide": "Remote, worldwide",
  "unrestricted": "Any location",
  "location-unknown": "Location not stated",
  "same-subregion": "Neighbouring region",
  "same-region": "Same continent",
  "remote-region-eligible": "Remote in your region",
  "remote-region-locked": "Remote, region-restricted",
  "location-locked": "Location-locked abroad",
};

export interface LocationFit {
  tier: ReachTier;
  multiplier: number;
  /** True unless the listing is tied to a place (or region) the user cannot take. */
  reachable: boolean;
  label: string;
  /** The user-side place the tier was decided from, for debugging and the reason string. */
  matchedUserLocation: string;
}

export interface LocationOptions {
  /** The user says they would relocate anywhere → never demote for a foreign place. */
  relocate?: boolean;
  /** The market to favour when the user stated no location. Defaults to Tanzania. */
  defaultMarket?: string;
}

/** Does a region group contain this country? (explicit list, else continent) */
function regionIncludes(region: string, userCountry: CountryRef): boolean {
  const g = REGION_INDEX.get(region);
  if (!g) return false;
  if (g.countries?.length) return g.countries.includes(userCountry.name);
  if (g.continents?.length) return g.continents.includes(userCountry.continent);
  return false;
}

/** One user location string vs one already-parsed job place. */
function fitOne(userRaw: string, job: ParsedPlace, opts: LocationOptions): LocationFit | null {
  const user = parsePlace(userRaw);
  if (!user.countries.length && !user.cities.length) return null; // nothing to stand on

  const userCountry = user.countries.length ? COUNTRIES.get(user.countries[0])! : undefined;
  const mk = (tier: ReachTier, matched: string): LocationFit => ({
    tier,
    multiplier: REACH_MULTIPLIER[tier],
    reachable: tier !== "location-locked" && tier !== "remote-region-locked",
    label: REACH_LABEL[tier],
    matchedUserLocation: matched,
  });

  // ── Remote listings ───────────────────────────────────────────────────────
  if (job.remote) {
    if (!job.restricted) return mk("remote-worldwide", userRaw);
    const eligible =
      (userCountry ? job.countries.includes(userCountry.name) : false) ||
      (userCountry
        ? job.regions.some((r) => regionIncludes(r, userCountry))
        : false);
    if (eligible) return mk("remote-region-eligible", userRaw);
    // A remote listing restricted away from the user. Keep the benefit of the
    // doubt over an on-site one (employers hire contractors across borders far
    // more often than they open an office abroad) — 0.90 vs 0.86.
    if (opts.relocate) return mk("remote-worldwide", userRaw);
    return mk("remote-region-locked", userRaw);
  }

  // ── On-site / unspecified-arrangement listings ───────────────────────────
  if (!userCountry) return null;
  const sameCountry = job.countries.includes(userCountry.name);
  if (sameCountry) {
    const cityHit = user.cities.find((c) => job.cities.includes(c));
    return mk(cityHit ? "same-city" : "same-country", userRaw);
  }
  // Region-only listings ("Africa", "LATAM", "EMEA").
  if (!job.countries.length && job.regions.length) {
    if (job.regions.some((r) => regionIncludes(r, userCountry))) return mk("same-region", userRaw);
    if (opts.relocate) return mk("unrestricted", userRaw);
    return mk("location-locked", userRaw);
  }
  if (!job.countries.length) return mk("location-unknown", userRaw); // unparseable text
  const sameSub = job.countries.some((c) => COUNTRIES.get(c)?.subregion === userCountry.subregion);
  if (sameSub) return mk("same-subregion", userRaw);
  const sameContinent = job.countries.some((c) => COUNTRIES.get(c)?.continent === userCountry.continent);
  if (sameContinent) return mk("same-region", userRaw);
  if (opts.relocate) return mk("unrestricted", userRaw);
  return mk("location-locked", userRaw);
}

const TIER_RANK: Record<ReachTier, number> = {
  "same-city": 0, "same-country": 1, "home-market": 2, "remote-worldwide": 3,
  "unrestricted": 4, "location-unknown": 5, "same-subregion": 6, "same-region": 7,
  "remote-region-eligible": 8, "remote-region-locked": 9, "location-locked": 10,
};

/**
 * The one entry point. Takes the user's stated location(s) — a CV's
 * `personal.location`, a Career Profile's `preferences.preferredLocations`, or
 * both — and returns the tier, multiplier, reachability and label for a listing.
 *
 * BEST-OF across multiple user locations: a user who lives in Dar es Salaam but
 * listed Nairobi as a preferred location gets the better of the two tiers for
 * each listing, so saying "I'd work in Nairobi too" only ever helps.
 *
 * NEVER penalises missing data:
 *  - no job location  → "location-unknown", 1.00
 *  - no user location → "unrestricted", 1.00 for everything outside the default
 *    market, 1.03 for the default market (ordering, not a penalty)
 */
export function locationFit(
  userLocation: string | string[] | null | undefined,
  jobLocation: string | null | undefined,
  opts: LocationOptions = {},
): LocationFit {
  const jobRaw = (jobLocation ?? "").trim();
  const jobBase = parsePlace(jobRaw);
  const job: ParsedPlace = jobBase.remote
    ? { ...jobBase, ...parseRemoteRestriction(jobRaw) }
    : jobBase;

  // No job location at all — no basis to rank by geography.
  if (!jobRaw) {
    return { tier: "location-unknown", multiplier: 1, reachable: true, label: REACH_LABEL["location-unknown"], matchedUserLocation: "" };
  }

  const users = (Array.isArray(userLocation) ? userLocation : [userLocation])
    .map((u) => (u ?? "").trim())
    .filter(Boolean);

  if (!users.length) {
    const market = opts.defaultMarket ?? DEFAULT_MARKET;
    const isHome =
      job.countries.includes(market) ||
      job.cities.some((c) => CITY_COUNTRY.get(c) === market);
    const tier: ReachTier = isHome ? "home-market" : "unrestricted";
    return { tier, multiplier: REACH_MULTIPLIER[tier], reachable: true, label: REACH_LABEL[tier], matchedUserLocation: "" };
  }

  let best: LocationFit | null = null;
  for (const u of users) {
    const f = fitOne(u, job, opts);
    if (!f) continue;
    if (!best || TIER_RANK[f.tier] < TIER_RANK[best.tier]) best = f;
  }
  if (best) return best;

  // Every user location was unresolvable ("Somewhereville") — no evidence to
  // rank on. Neutral, never a penalty.
  return { tier: "unrestricted", multiplier: 1, reachable: true, label: REACH_LABEL.unrestricted, matchedUserLocation: "" };
}

/**
 * Back-compat shim: the multiplier alone. Kept because callers (and older tests)
 * ask only for a number; new code should use `locationFit` so it also gets the
 * tier, the reachability flag and the label.
 */
export function locationRelevance(userLocation: string, jobLocation: string): number {
  return locationFit(userLocation, jobLocation).multiplier;
}

/**
 * The number the feed is ORDERED by: keyword evidence nudged by reachability.
 *
 * Deliberately NOT a gate. `recommend.ts` keeps its MIN_SCORE test on the raw
 * keyword score, so geography can reorder the list but can never empty it — the
 * failure mode of the previous implementation, where 50.5% of the live feed was
 * multiplied by 0.3 before the threshold was applied.
 */
export function rankScore(rawScore: number, fit: LocationFit): number {
  return Math.max(0, Math.min(100, rawScore * fit.multiplier));
}

/**
 * The full ordering rule, in one place so it is unit-testable: REACHABILITY CLASS
 * FIRST, then keyword evidence nudged by geography.
 *
 * Class first is what keeps a constraint out of the ranking. Measured on the live
 * feed: with a bounded keyword-plus-geography score alone, a San Francisco role
 * that matched a Dar es Salaam engineer's CV at 58% beat every African and every
 * worldwide-remote listing (49.9 vs 37.0) — a listing they cannot take ranked
 * first. Sorting on class first puts it below all of them while leaving it in the
 * list, and within a class the bounded nudge still decides.
 */
export function compareByReach(
  a: { rank: number; fit: LocationFit },
  b: { rank: number; fit: LocationFit },
): number {
  if (a.fit.reachable !== b.fit.reachable) return a.fit.reachable ? -1 : 1;
  return b.rank - a.rank;
}
