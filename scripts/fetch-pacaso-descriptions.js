#!/usr/bin/env node
/**
 * Fetches full descriptions for all Pacaso properties from their website.
 * Uses the Pacaso sitemap to get slug→UUID mappings, then fetches
 * __NEXT_DATA__ from each property page to get the full untruncated description.
 *
 * Run: node scripts/fetch-pacaso-descriptions.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROPS_PATH = path.join(__dirname, '../lib/properties.json');
const BUILD_ID = 'mfYY3p89MoIoIHqOJui9L';

// ── All 190 Pacaso listing URLs from their sitemap ─────────────────────────
const SITEMAP_URLS = [
  'https://www.pacaso.com/listings/1125-park-avenue-park-city-ut-84060-us/3dd86807-e784-4d3b-9660-f63841d3718a',
  'https://www.pacaso.com/listings/122-charleston-boulevard-isle-of-palms-sc-29451-us/ca639a42-969b-4af5-94b8-0af9faf2cc03',
  'https://www.pacaso.com/listings/casa-bella-lote-78-caleta-loma-san-jose-corridor-bs-23405-mx/bf1a2702-64a3-4bc3-85c4-5545f6cbb0b4',
  'https://www.pacaso.com/listings/175-south-glenwood-street-305-jackson-wy-83001-us/5eae388d-f80f-4a41-aff4-bcdab1148057',
  'https://www.pacaso.com/listings/3115-ion-avenue-sullivans-island-sc-29482-us/3f74fa6f-321b-49ac-a4fe-73ba7be2e18c',
  'https://www.pacaso.com/listings/1228-2nd-avenue-napa-ca-94558-us/140796d1-6402-4b75-8853-9cffed0d8826',
  'https://www.pacaso.com/listings/2488-avalon-avenue-avalon-nj-08202-us/37474e26-2c8f-4e89-b868-84d485264506',
  'https://www.pacaso.com/listings/735-betty-lane-incline-village-nv-89451-us/2ea409c6-1744-47fb-9b0b-65a6a5708843',
  'https://www.pacaso.com/listings/470-east-avenida-olancha-palm-springs-ca-92264-us/9e3ca831-3cc4-4ab7-9ab3-b4b8e48b17a5',
  'https://www.pacaso.com/listings/495-lake-ridge-court-south-lake-tahoe-ca-96150-us/fda7722d-36fc-4cf9-9672-7e0f7541e36e',
  'https://www.pacaso.com/listings/1723-grouse-ridge-road-truckee-ca-96161-us/96f1c0c2-1b5b-4c3f-9a61-da91990ee89a',
  'https://www.pacaso.com/listings/51310-calle-tamazula-la-quinta-ca-92253-us/c5cee6dc-40bb-48b6-b449-39399737add6',
  'https://www.pacaso.com/listings/1961-south-palm-canyon-drive-palm-springs-ca-92264-us/a57c89cf-a6b7-4071-9e67-a3793fc17fdf',
  'https://www.pacaso.com/listings/72870-bel-air-road-palm-desert-ca-92260-us/88462292-080d-4c17-9e0d-b41c3172f522',
  'https://www.pacaso.com/listings/11655-henness-road-truckee-ca-96161-us/996cda1d-577e-4bd2-9290-a03560e3edfc',
  'https://www.pacaso.com/listings/77137-casa-del-sol-la-quinta-ca-92253-us/960cd619-28e5-4192-9f0d-6d2bfd237c28',
  'https://www.pacaso.com/listings/7770-lahontan-drive-truckee-ca-96161-us/28dec84b-7bc7-47ee-a59f-749bb0a62819',
  'https://www.pacaso.com/listings/121-2nd-dilido-terrace-miami-beach-fl-33139-us/53e68d1b-f448-4d1f-be81-daf35405b6aa',
  'https://www.pacaso.com/listings/594-west-stevens-road-palm-springs-ca-92262-us/5582c7a6-bfaf-4e8c-a703-facd10de1ff0',
  'https://www.pacaso.com/listings/2610-atlas-peak-road-napa-ca-94558-us/5ee3f3ea-aba2-49ca-bc68-8b211446398e',
  'https://www.pacaso.com/listings/78750-nolan-circle-la-quinta-ca-92253-us/5ec7747c-0e58-4e08-9c0c-86a8a664baf1',
  'https://www.pacaso.com/listings/325-woodridge-way-incline-village-nv-89451-us/71f05af1-b14e-475d-b874-83632b2e02aa',
  'https://www.pacaso.com/listings/580-west-panga-way-palm-springs-ca-92262-us/a6ea0874-667f-4842-9e6b-11ca98378153',
  'https://www.pacaso.com/listings/16-luisa-drive-breckenridge-co-80424-us/64ccd7c7-752f-476b-927a-bfdc83b88be6',
  'https://www.pacaso.com/listings/120-north-gordon-road-fort-lauderdale-fl-33301-us/bc2ddef0-74e6-41a6-aad0-3d7de60b6584',
  'https://www.pacaso.com/listings/1040-loma-vista-drive-napa-ca-94558-us/ef0357c4-f9e1-45c2-8fb9-4968d688d43d',
  'https://www.pacaso.com/listings/185-north-glenwood-street-3-jackson-wy-83001-us/f5e9545a-f284-4828-8c99-ff5f72751c80',
  'https://www.pacaso.com/listings/1090-first-avenue-napa-ca-94558-us/30a63220-c9dc-493c-81e2-11028062e126',
  'https://www.pacaso.com/listings/1555-aerie-circle-park-city-ut-84060-us/41806ebf-ed08-445f-8553-b1ac9f0d296b',
  'https://www.pacaso.com/listings/9-seaside-sparrow-road-hilton-head-island-sc-29928-us/0ec54bbf-1283-4e34-b807-78c549c8803b',
  'https://www.pacaso.com/listings/5274-silverado-trail-napa-ca-94558-us/1155f788-4441-47de-8f54-e53eecec8091',
  'https://www.pacaso.com/listings/3380-california-128-calistoga-ca-94515-us/eba1b093-415f-441d-b003-5d5197c964e4',
  'https://www.pacaso.com/listings/745-west-forest-road-b-vail-co-81657-us/be6fdc89-d3c2-4cb9-89c9-b146cf564201',
  'https://www.pacaso.com/listings/fundadores-puerto-los-cabos-cabo-bs-23410-mx/345f009d-a641-4fd4-b973-e0ab6a221ae7',
  'https://www.pacaso.com/listings/26-smuggler-grove-aspen-co-81611-us/db58897e-435f-4ad0-86d3-bb91af0471ba',
  'https://www.pacaso.com/listings/2330-north-harvest-dance-road-jackson-wy-83001-us/6ffee234-7b8f-4955-939c-ffa42a424208',
  'https://www.pacaso.com/listings/114-residencia-punta-ballena-cabo-san-lucas-bs-23410-mx/17a92e41-a71e-4442-97f1-bd1dc474f06c',
  'https://www.pacaso.com/listings/108-windwood-circle-breckenridge-co-80424-us/bca2e6bb-7119-42e6-b98f-24e1da1ee3b7',
  'https://www.pacaso.com/listings/3599-ridgeline-drive-park-city-ut-84060-us/93ffbed0-3fa1-414b-908a-211d3c84f447',
  'https://www.pacaso.com/listings/11a-meadow-lane-nantucket-ma-02554-us/d387a8fc-676f-4e7f-85cc-1a7ccd7c476d',
  'https://www.pacaso.com/listings/4-queen-street-greater-london-england-w1j-5pa-gb/99c3f1eb-8c70-4178-9823-0ff7b7f8cd19',
  'https://www.pacaso.com/listings/86-caleta-loma-san-jose-corridor-bs-23405-mx/8b3118a4-9eb2-4a6f-bfde-58ab2bbd575f',
  'https://www.pacaso.com/listings/221-south-sea-pines-drive-hilton-head-island-sc-29928-us/cdee8d3a-9e2e-4874-b6bc-42e926235fbb',
  'https://www.pacaso.com/listings/1250-partrick-road-napa-ca-94558-us/5a1b19b4-164c-4c6f-8f65-25a7465a4002',
  'https://www.pacaso.com/listings/108-carolina-boulevard-isle-of-palms-sc-29451-us/a9608572-cb5b-4f9c-b497-ae7f0a395e57',
  'https://www.pacaso.com/listings/1629-hillview-place-st-helena-ca-94574-us/8e40e98a-9dd8-4c48-a54d-e954765dc9c2',
  'https://www.pacaso.com/listings/6165-west-dry-creek-road-healdsburg-ca-95448-us/29b4e3eb-efca-406f-b764-5659ddba2b69',
  'https://www.pacaso.com/listings/8-bald-eagle-road-hilton-head-island-sc-29928-us/7a225d03-9934-474e-97c7-d07774f5b31c',
  'https://www.pacaso.com/listings/26-north-woods-lane-breckenridge-co-80424-us/cd55147f-6215-47bd-b6a0-971cb53d97bf',
  'https://www.pacaso.com/listings/117-25th-street-newport-beach-ca-92663-us/b5dcf9ba-f558-4aef-a66f-68f36242e89e',
  'https://www.pacaso.com/listings/1269-rothwell-road-park-city-ut-84060-us/b86ca7d6-70ed-4e9f-902d-1b33da1ebc57',
  'https://www.pacaso.com/listings/134-nautilus-drive-islamorada-fl-33036-us/f05b0d0c-1b78-4ef2-8c45-66c2359ac3cd',
  'https://www.pacaso.com/listings/802-empire-avenue-park-city-ut-84060-us/ecca9534-0c48-4e12-b994-58f3db593579',
  'https://www.pacaso.com/listings/336-victory-bay-lane-johns-island-sc-29455-us/7d10526d-89c9-4516-b3b9-a3f8323038e1',
  'https://www.pacaso.com/listings/34-eugenia-avenue-johns-island-sc-29455-us/443a78c0-372a-413b-b2cf-2afbe633e616',
  'https://www.pacaso.com/listings/4106-river-avenue-newport-beach-ca-92663-us/33bc15c2-b18a-482c-97d0-ec1fc9f8fed2',
  'https://www.pacaso.com/listings/1055-martis-landing-truckee-ca-96161-us/d7895cda-2dbd-4ff9-a3d6-ac2658fff31b',
  'https://www.pacaso.com/listings/1703-plaza-del-sur-newport-beach-ca-92661-us/c00678cf-47ea-4f28-83ce-bdad8f8ad50c',
  'https://www.pacaso.com/listings/319-coconut-isle-drive-fort-lauderdale-fl-33301-us/b9aec957-5b5c-478e-9c2e-f39e7467102d',
  'https://www.pacaso.com/listings/1347-golden-way-park-city-ut-84060-us/ad99b77d-f4bd-4682-b787-8359feb40b33',
  'https://www.pacaso.com/listings/3803-marcus-avenue-newport-beach-ca-92663-us/548f57cf-13d6-4565-8e5f-d49ddfaa154f',
  'https://www.pacaso.com/listings/3688-bayside-walk-san-diego-ca-92109-us/71e24a0a-fa08-4102-8256-248593af8223',
  'https://www.pacaso.com/listings/1135-norfolk-avenue-park-city-ut-84060-us/ea1b47d2-0f97-4b92-8e9d-b9378cb66bc2',
  'https://www.pacaso.com/listings/709-west-hallam-street-aspen-co-81611-us/1713e0cb-2d17-4fd7-ae93-4760f7c298da',
  'https://www.pacaso.com/listings/970-angels-view-way-steamboat-springs-co-80487-us/f3b2b881-a630-43a5-b02e-a42845e51eb8',
  'https://www.pacaso.com/listings/342-palisades-circle-5-olympic-valley-ca-96146-us/cfb72ea3-404c-4c36-a48d-8551936d1b97',
  'https://www.pacaso.com/listings/1005-valley-view-street-st-helena-ca-94574-us/91e6aa0f-2847-46a4-aad7-107891171a00',
  'https://www.pacaso.com/listings/3400-northeast-25th-street-fort-lauderdale-fl-33305-us/69e2611b-5be1-4b99-a6ba-c419e59b8e63',
  'https://www.pacaso.com/listings/692-mountain-village-boulevard-mountain-village-co-81435-us/f683915c-9f85-4639-891a-df3d8e2312ac',
  'https://www.pacaso.com/listings/2628-ocean-boulevard-newport-beach-ca-92625-us/081abf84-d13c-4aed-a504-bb7e946c4cc4',
  'https://www.pacaso.com/listings/6653-neptune-place-san-diego-ca-92037-us/85961feb-b9bc-4b09-8824-3586d99a56ed',
  'https://www.pacaso.com/listings/1016-rodeo-road-del-monte-forest-ca-93953-us/5add30df-faac-4ccd-ac12-8901c9248f3b',
  'https://www.pacaso.com/listings/1592-golf-terrace-q55-vail-co-81657-us/d788e798-21fd-4bc4-afed-3f31acd582f5',
  'https://www.pacaso.com/listings/1069-shadybrook-lane-napa-ca-94558-us/4f8a5447-e759-47f2-bc6c-b9131fd211b1',
  'https://www.pacaso.com/listings/670-west-forest-road-7-b-vail-co-81657-us/7000c2de-d42d-402b-9f8f-88b7816f02d3',
  'https://www.pacaso.com/listings/11614-henness-road-truckee-ca-96161-us/de674dee-2d27-4b97-93dd-c460c563e780',
  'https://www.pacaso.com/listings/3135-west-lake-boulevard-homewood-ca-96141-us/0181567a-a848-47b8-8bdb-aacc4c7ecce6',
  'https://www.pacaso.com/listings/14-saint-lukes-street-greater-london-england-sw3-3rs-gb/cc5f1c72-ebb9-4389-897f-868cdf6f65a0',
  'https://www.pacaso.com/listings/2084-east-valley-road-montecito-ca-93108-us/7e81dfec-d8e6-41f1-80ff-0255d06ee35f',
  'https://www.pacaso.com/listings/7-13th-avenue-carmel-by-the-sea-ca-93921-us/b7da843b-a402-45cd-86e1-6a57aa7fe27e',
  'https://www.pacaso.com/listings/77003-iroquois-drive-indian-wells-ca-92210-us/9b19638d-7218-4293-8f55-a517f5f81ebd',
  'https://www.pacaso.com/listings/km-195-carretera-transpeninsular-san-jose-del-cabo-bcs-23400-mx/e83a3263-61d6-49d5-b391-ae243ce45cee',
  'https://www.pacaso.com/listings/1033-homestake-circle-vail-co-81657-us/9cb1fcc9-6ef7-49cc-bc60-2240db289d47',
  'https://www.pacaso.com/listings/8307-east-gary-road-scottsdale-az-85260-us/6993b81e-3744-48d6-890a-f19ae96fb395',
  'https://www.pacaso.com/listings/936-lakeshore-boulevard-incline-village-nv-89451-us/e43d4152-a8ba-4de3-9450-7d0db54b00e1',
  'https://www.pacaso.com/listings/17-trails-edge-lane-mountain-village-co-81435-us/2ba611a7-9990-4014-b9fe-b6169d07f84f',
  'https://www.pacaso.com/listings/45655-apache-road-indian-wells-ca-92210-us/65297f35-e59f-4eaa-8154-c7bcdc5ae6a8',
  'https://www.pacaso.com/listings/25-north-belize-lane-panama-city-beach-fl-32413-us/1d98ab6c-d39d-40a8-b188-9466a7300eea',
  'https://www.pacaso.com/listings/1406-park-avenue-park-city-ut-84060-us/b95490b3-3f9d-4baa-9ad7-4538c4d4c33c',
  'https://www.pacaso.com/listings/2252-west-dry-creek-road-healdsburg-ca-95448-us/0494c449-abc7-4100-9242-301bde955d93',
  'https://www.pacaso.com/listings/1101-olive-hill-lane-napa-ca-94558-us/a99a5cc1-fe52-433c-a9c7-8f7904c03160',
  'https://www.pacaso.com/listings/1280-south-ocean-boulevard-delray-beach-fl-33483-us/1a88133d-d568-4bcc-a461-a1f1db9b2e4f',
  'https://www.pacaso.com/listings/14223-mountainside-place-truckee-ca-96161-us/d55190db-9016-4260-b022-fed96dd38eb5',
  'https://www.pacaso.com/listings/6-whistling-swan-road-hilton-head-island-sc-29928-us/325d577c-418c-4364-93a4-3fff20b17d11',
  'https://www.pacaso.com/listings/22-red-cardinal-road-hilton-head-island-sc-29928-us/cc840494-1b21-4f07-869c-6123fa77a514',
  'https://www.pacaso.com/listings/121-emerald-avenue-newport-beach-ca-92662-us/f593503d-ca1d-413d-9b5f-662d0ff33d2f',
  'https://www.pacaso.com/listings/824-neptune-avenue-encinitas-ca-92024-us/d9be3351-b265-45d7-a3f5-d983dda58658',
  'https://www.pacaso.com/listings/307-goldenrod-avenue-newport-beach-ca-92625-us/7ff905f9-a431-450f-bd50-e8dba941559e',
  'https://www.pacaso.com/listings/1242-madrona-avenue-st-helena-ca-94574-us/3e38eeec-493d-4c1c-9d34-8bef4f4159d5',
  'https://www.pacaso.com/listings/1509-riesling-way-st-helena-ca-94574-us/8f8f1761-af17-40b4-9a52-757ec30476de',
  'https://www.pacaso.com/listings/214-calle-padre-sistiaga-san-jose-del-cabo-bcs-23403-mx/f51e055d-ddae-4a63-b9a4-56b64b59438f',
  'https://www.pacaso.com/listings/14-rue-du-bac-paris-idf-75007-fr/55ef92a5-d82b-46e7-8efa-03c3a4482155',
  'https://www.pacaso.com/listings/20460-pacific-coast-highway-malibu-ca-90265-us/8221b453-9a93-43cb-ad95-c4b9a092bfd3',
  'https://www.pacaso.com/listings/3095-mountain-links-way-olympic-valley-ca-96146-us/e6f2c6dc-9777-4f69-9d83-58c7a906ca73',
  'https://www.pacaso.com/listings/1360-empire-avenue-park-city-ut-84060-us/3454de6d-7d69-4e6c-b3e0-553e2f06bcea',
  'https://www.pacaso.com/listings/3705-haines-street-san-diego-ca-92109-us/e5ad8d28-899c-434e-bad9-5d59c60f69f0',
  'https://www.pacaso.com/listings/7069-9th-avenue-tahoma-ca-96142-us/8c6576b4-1bb4-4700-9cce-4ed163c6aa57',
  'https://www.pacaso.com/listings/506-west-oceanfront-newport-beach-ca-92661-us/a425175d-ab3c-45fe-91b5-4c4cf430e363',
  'https://www.pacaso.com/listings/72694-skyward-way-palm-desert-ca-92260-us/2e8a5628-1788-49b3-b842-58a6083b2973',
  'https://www.pacaso.com/listings/7450-east-continental-mountain-estates-drive-3-cave-creek-az-85331-us/f8f266df-f3b9-4c1f-b7c2-d9cd87c00c7e',
  'https://www.pacaso.com/listings/1126-ocean-forest-lane-johns-island-sc-29455-us/7d49040d-3845-4e62-bdce-920055fcf1ec',
  'https://www.pacaso.com/listings/27120-sea-vista-drive-malibu-ca-90265-us/baf0cce5-76d6-41a6-89c3-2dc2007f9878',
  'https://www.pacaso.com/listings/72985-somera-road-palm-desert-ca-92260-us/4fc15a27-e35c-4a96-9e49-5b018d5779d4',
  'https://www.pacaso.com/listings/120-gharkey-street-santa-cruz-ca-95060-us/a807ce9f-49ca-45da-8c79-63e9aaf0bf97',
  'https://www.pacaso.com/listings/253-kolmar-street-san-diego-ca-92037-us/c42ea193-e454-437f-8e02-a86467f27f2f',
  'https://www.pacaso.com/listings/3090-garnet-road-teton-village-wy-83025-us/370433a7-0b8d-4ef2-bb09-8d339bbb74e4',
  'https://www.pacaso.com/listings/1608-windmill-avenue-marco-island-fl-34145-us/47a3177e-3d94-4ad0-97a4-c32bd483afc4',
  'https://www.pacaso.com/listings/105-edgewood-drive-tahoe-city-ca-96145-us/264b667a-84a3-4cec-917c-6309c9080b42',
  'https://www.pacaso.com/listings/3564-ridgeline-drive-14a-park-city-ut-84098-us/51b6ccf8-d281-4ea4-b4d6-0f29ed52403a',
  'https://www.pacaso.com/listings/339-palisades-circle-49-olympic-valley-ca-96146-us/2249a100-7418-4ece-a78f-ff9c874ba2c0',
  'https://www.pacaso.com/listings/672-west-forest-road-vail-co-81657-us/667b3525-0af5-4d8c-9bd7-5cc87a93c2d9',
  'https://www.pacaso.com/listings/237-basque-drive-truckee-ca-96161-us/bfffed5a-9afc-4c7f-84de-7559c89cb554',
  'https://www.pacaso.com/listings/27643-west-shore-road-lake-arrowhead-ca-92352-us/88a885f5-bb24-43cf-8d01-f50d3c1835fe',
  'https://www.pacaso.com/listings/220-14th-street-key-colony-beach-fl-33051-us/6846100c-191c-4017-abaa-155f8b437f3c',
  'https://www.pacaso.com/listings/31478-broad-beach-road-malibu-ca-90265-us/b0a6ec81-a10c-449a-8c3f-fb2ecddce6cc',
  'https://www.pacaso.com/listings/56887-dancing-rock-loop-15-bend-or-97707-us/13105f1a-0404-475f-87e4-e11bd717f464',
  'https://www.pacaso.com/listings/31851-west-sea-level-drive-malibu-ca-90265-us/d497a4ee-90b9-44f3-a39f-cfab4135c9ae',
  'https://www.pacaso.com/listings/5288-alton-road-miami-beach-fl-33140-us/c37f5f43-3b39-4d04-b1fb-7dbc63eef4d1',
  'https://www.pacaso.com/listings/28-smuggler-grove-aspen-co-81611-us/306353f7-11e3-44c1-860a-3a29ba7900c3',
  'https://www.pacaso.com/listings/102-avenida-padre-salvatierra-san-jose-del-cabo-bcs-23403-mx/8373fc07-15b5-406a-9392-507e973d8812',
  'https://www.pacaso.com/listings/305-grand-canal-newport-beach-ca-92662-us/132330fb-9cdd-4b42-a8dd-32f648bfabd6',
  'https://www.pacaso.com/listings/paris-7th-district-paris-idf-75007-fr/7aeb35ac-956a-45f2-9717-7eccb775fb87',
  'https://www.pacaso.com/listings/558-fox-hill-road-chatham-ma-02633-us/dca7f590-575a-4eb4-b665-0febcd45cac0',
  'https://www.pacaso.com/listings/240-west-lilliana-drive-palm-springs-ca-92264-us/00468e71-155d-40c7-9fa4-19b38c72db56',
  'https://www.pacaso.com/listings/323-creeks-end-court-1-olympic-valley-ca-96146-us/38b6ccf4-90af-43ac-b68e-41d933528aab',
  'https://www.pacaso.com/listings/15004-peak-view-pl-truckee-ca-96161-us/9c5b37f5-740a-49d0-9413-275197d4fd90',
  'https://www.pacaso.com/listings/565-oyster-rake-drive-johns-island-sc-29455-us/40e7b857-4b04-4f28-b3f4-b4a6f3d1317e',
  'https://www.pacaso.com/listings/102-ironwood-lane-102-lahaina-hi-96761-us/7aa3cb92-8988-4c61-81f2-53a6077d761b',
  'https://www.pacaso.com/listings/211-palisades-circle-39-olympic-valley-ca-96146-us/34508cef-e953-4eaa-85a1-cafff12d9841',
  'https://www.pacaso.com/listings/230-california-1-carmel-by-the-sea-ca-93923-us/a55004ba-5a07-4165-8448-39bbaca64196',
  'https://www.pacaso.com/listings/three-kings-yard-mayfair-london-w1k4qa-gb/23393869-5a34-444a-ac44-5bf46bdaa1d4',
  'https://www.pacaso.com/listings/442-westbourne-street-san-diego-ca-92037-us/2e670636-4c5a-4a75-ba5b-7d2675a1fa3a',
  'https://www.pacaso.com/listings/783-michael-drive-south-lake-tahoe-ca-96150-us/d358e603-e920-49f2-867a-bc4477386c30',
  'https://www.pacaso.com/listings/3737-terrace-drive-south-lake-tahoe-ca-96150-us/568ef2e4-6492-42e9-92fb-1e3f29b535c7',
  'https://www.pacaso.com/listings/50-ebury-street-2-greater-london-england-sw1w-0lu-gb/f07ca98c-8bb5-467c-a897-daf9530bf99f',
  'https://www.pacaso.com/listings/3914-saddle-road-south-lake-tahoe-ca-96150-us/37d2c551-c355-44b5-b67a-8a8a6d9e761f',
  'https://www.pacaso.com/listings/2-rue-des-beaux-arts-paris-idf-75006-fr/2f7fef58-7748-48f8-8209-e2c72341199a',
  'https://www.pacaso.com/listings/3518-shipwatch-road-kiawah-island-sc-29455-us/98ac4b1b-827b-43cd-9dfa-a3b00325bb88',
  'https://www.pacaso.com/listings/vail-golf-course-townhome-vail-co-81657-us/5d1039aa-56a6-4b6d-9d13-31befd83df0a',
  'https://www.pacaso.com/listings/1131-las-alturas-road-santa-barbara-ca-93103-us/a32ce759-ab69-4a16-8753-9e8545060b18',
  'https://www.pacaso.com/listings/425-wood-road-58-aspen-co-81611-us/6353eb00-9054-42c6-bf99-971f579db65d',
  'https://www.pacaso.com/listings/25-san-jose-corridor-san-jose-corridor-bs-23450-mx/739187f0-437f-4272-8613-2c5e2cc91b65',
  'https://www.pacaso.com/listings/127-blue-heron-pond-road-kiawah-island-sc-29455-us/78f43c30-b40a-4ed5-9e36-814158517b70',
  'https://www.pacaso.com/listings/casa-arena-74-padre-kino-san-jose-del-cabo-bs-23403-mx/72fa3cec-7a50-489a-b005-945a8c94cb7d',
  'https://www.pacaso.com/listings/80-chemin-du-sapi-chamonix-mont-blanc-auvergne-rhone-alpes-74400-fr/f393851a-8b4f-4c76-8876-2ca6bd3a7b3b',
  'https://www.pacaso.com/listings/3553-shipwatch-road-kiawah-island-sc-29455-us/301026bb-7e25-4228-ab33-0e2b923f8d75',
  'https://www.pacaso.com/listings/185-north-glenwood-street-30-jackson-wy-83001-us/e2e0bcd7-03c3-4ff8-b2db-dbea382f2e67',
  'https://www.pacaso.com/listings/paris-6th-district-paris-idf-75006-fr/f14cd7ab-118e-433c-95f7-46139eaf71d2',
  'https://www.pacaso.com/listings/68-1210-kaniku-alanui-15c1-kamuela-hi-96743-us/eb9f2a88-3d3c-4d2e-b030-aed5cb7df6c8',
  'https://www.pacaso.com/listings/25-viale-bianca-maria-milano-lombardia-20122-it/ffa1cea9-3169-4b8d-966c-6b960b4cfcac',
  'https://www.pacaso.com/listings/calle-litibu-13-t2-pg2-litibu-na-63727-mx/70e653af-8567-4dd5-85a7-9c397afe6768',
  'https://www.pacaso.com/listings/291-ruddy-turnstone-kiawah-island-sc-29455-us/4becef3e-50c7-4d23-9424-c548f25f1014',
  'https://www.pacaso.com/listings/8477-el-paseo-grande-san-diego-ca-92037-us/a9308d97-38e7-4591-99db-14f18a2ce9ba',
  'https://www.pacaso.com/listings/41-elysee-court-rosemary-beach-fl-32461-us/f90d6788-6505-41eb-b3bb-d6c31a8c2195',
  'https://www.pacaso.com/listings/25-calle-de-fernando-el-santo-madrid-md-28010-es/9b559c63-c3f0-4cbd-a2fb-42a7a1a31753',
  'https://www.pacaso.com/listings/3764-ski-hill-road-breckenridge-co-80424-us/bb116eae-9488-49b2-959e-477e4d2fcf98',
  'https://www.pacaso.com/listings/6-charles-street-greater-london-england-w1j-5dg-gb/b3f1e42e-2694-41e2-be4f-dd06cddd9fc1',
  'https://www.pacaso.com/listings/3-via-dei-pecori-st-florence-52-50123-it/2edb2df7-085e-4887-a933-396a2a410e2c',
  'https://www.pacaso.com/listings/56-surfsong-road-johns-island-sc-29455-us/e8ac24b0-6343-47a7-8877-34c1d7410318',
  'https://www.pacaso.com/listings/435-fountain-grass-lane-kiawah-island-sc-29455-us/ce497f32-140a-4145-9778-fa6041c6478a',
  'https://www.pacaso.com/listings/258-boulevard-saint-germain-paris-idf-75007-fr/58d61ee2-c5c1-4e90-b4b4-477ca085e47d',
  'https://www.pacaso.com/listings/309-greymon-drive-west-palm-beach-fl-33405-us/604bc9dc-44f3-42f9-adf6-7a500dd7f2bb',
  'https://www.pacaso.com/listings/1468-bangtail-way--c-steamboat-springs-co-80487-us/e18bc5fd-6f5d-45bd-b578-98c9f37a0de5',
  'https://www.pacaso.com/listings/1404-w-ursa-way-mayflower-mountain-ut-84032-daniel-ut-84032-us/50e2bb9b-4f4b-4e4a-8b4d-4e4cfe5af68c',
  'https://www.pacaso.com/listings/carretera-transpeninsular-km1-203-cabo-san-lucas-bs-23405-mx/30b0f582-5dc1-4d72-a076-f570a8dd23fb',
  'https://www.pacaso.com/listings/3171-ne-1st-ave-ph3-miami-fl-33137-us/f3a8c63b-b1c1-40d2-93d3-cd67ef658bdd',
  'https://www.pacaso.com/listings/39c632v-san-jose-del-cabo-bs-23400-mx/3ad56c08-5bd4-41c7-8773-f248d575763e',
  'https://www.pacaso.com/listings/306-vine-row-court-napa-ca-94559-us/002983f8-a8a5-4c1f-bef1-32f4a97a8b5c',
  'https://www.pacaso.com/listings/904-bond-way-delray-beach-fl-33483-us/3b76dd63-e5e6-45e7-acac-239390aef1f0',
  'https://www.pacaso.com/listings/30-rudy-turnstone-hilton-head-island-sc-29928-us/f0b8323e-d29d-485b-a1cb-0d68cd661d3c',
  'https://www.pacaso.com/listings/2059-capricorn-court-heber-city-ut-84032-us/86274dac-ed7f-4a52-b4a5-0291faaa394e',
  'https://www.pacaso.com/listings/53-quai-des-grands-augustins-paris-idf-75006-fr/fd4ec903-dc93-4070-af72-7a6d3dcf32d5',
  'https://www.pacaso.com/listings/3171-ne-1st-ave-residence-02-miami-fl-33137-us/90f8642d-e21f-4ad3-ac94-43acdd307b0e',
  'https://www.pacaso.com/listings/6416-east-calle-camelia-scottsdale-az-85251-us/b47a6bb7-6ea4-4ead-a673-987c6065c9df',
  'https://www.pacaso.com/listings/1489-vail-valley-drive-vail-co-81657-us/ca66dd4f-a2cd-40b3-8add-fe1feef8f710',
  'https://www.pacaso.com/listings/4350-north-jokake-drive-scottsdale-az-85251-us/700a6477-9fc5-49cb-a366-4850b34e8f17',
  'https://www.pacaso.com/listings/108-vintners-court-napa-ca-94559-us/7fd16763-8823-4e8b-a861-e0d0a061db99',
  'https://www.pacaso.com/listings/2-willow-oak-road-west-hilton-head-island-sc-29928-us/d4e584ec-b775-420c-8cf3-97c22082e617',
  'https://www.pacaso.com/listings/2901-indian-creek-drive-301-miami-beach-fl-33140-us/f17e7f66-6f03-4a95-9114-8e568f04b92d',
  'https://www.pacaso.com/listings/the-lakes-by-yoo-block-1-cabin-1-cotswolds-lechlade-gl7-3dt-gb/15768c33-35ae-465f-a731-a56380cb04c7',
];

// ── Build slug → uuid map ──────────────────────────────────────────────────
const slugToUuid = {};
for (const url of SITEMAP_URLS) {
  const m = url.match(/\/listings\/([^/]+)\/([a-f0-9-]{36})/);
  if (m) slugToUuid[m[1]] = m[2];
}

// ── Fetch helper ───────────────────────────────────────────────────────────
function fetchJson(slug, uuid) {
  return new Promise((resolve, reject) => {
    const url = `https://www.pacaso.com/_next/data/${BUILD_ID}/listings/${encodeURIComponent(slug)}/${uuid}.json`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    }, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        resolve(null); return;
      }
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const j = JSON.parse(body);
          const prop = j?.pageProps?.home?.property;
          resolve(prop ? { slug, desc: prop.description, amenities: prop.amenitys } : null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
  });
}

// ── Rate-limited fetch of all matched properties ───────────────────────────
async function run() {
  const props = JSON.parse(fs.readFileSync(PROPS_PATH, 'utf8'));
  const pacaso = props.filter(p => p.partner === 'pacaso');

  console.log(`\nMatching ${pacaso.length} Pacaso properties against ${Object.keys(slugToUuid).length} sitemap URLs...\n`);

  let matched = 0, updated = 0, noMatch = 0;

  for (let i = 0; i < pacaso.length; i++) {
    const p = pacaso[i];
    const uuid = slugToUuid[p.id];

    if (!uuid) {
      console.log(`  NO MATCH: ${p.title} (id=${p.id})`);
      noMatch++;
      continue;
    }

    matched++;
    process.stdout.write(`  [${i+1}/${pacaso.length}] Fetching ${p.id.slice(0,40)}...`);

    const data = await fetchJson(p.id, uuid);

    if (data && data.desc && data.desc.length > (p.description || '').length + 10) {
      // Find and update the property in the main array
      const mainProp = props.find(x => x.slug === p.slug);
      if (mainProp) {
        mainProp.description = data.desc;
        // Also update amenities if Pacaso has more
        if (data.amenities && data.amenities.length > (mainProp.amenities || []).length) {
          mainProp.amenities = data.amenities.map(a => typeof a === 'string' ? a : a.name || a.label || JSON.stringify(a));
        }
        updated++;
        console.log(` ✓ ${data.desc.length} chars (was ${p.description?.length || 0})`);
      }
    } else if (data) {
      console.log(` — same length, skipping`);
    } else {
      console.log(` ✗ fetch failed`);
    }

    // Polite delay: 200ms between requests
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(PROPS_PATH, JSON.stringify(props, null, 2), 'utf8');

  console.log(`\n========================================`);
  console.log(`  Matched: ${matched} | Updated: ${updated} | No match: ${noMatch}`);
  console.log(`  Saved to lib/properties.json`);
  console.log(`========================================\n`);
}

run().catch(console.error);
