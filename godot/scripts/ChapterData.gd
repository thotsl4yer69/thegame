extends Node

const WORLD_WIDTH := 7600.0
const FLOOR_TOP := 360.0
const FLOOR_BOTTOM := 650.0

const CHAPTERS := [
	{
		"id":"pink_pigeon","act":"CHAPTER 01","name":"THE PINK PIGEON","district":"KING STREET / CBD",
		"accent":"#ff2b9f","secondary":"#8b2cff","boss":"CHAD CHAIN","boss_style":"rush",
		"zones":["QUEUE & ENTRY","MAIN FLOOR","VIP CORRIDOR","OWNER'S BOOTH"],
		"encounters":[
			{"x":1100.0,"name":"FRONT DOOR SHAKEDOWN","count":2,"style":"rush"},
			{"x":2700.0,"name":"MAIN FLOOR MELTDOWN","count":3,"style":"mixed"},
			{"x":4400.0,"name":"VIP CORRIDOR","count":3,"style":"mixed"},
			{"x":6200.0,"name":"OWNER'S BOOTH","count":2,"style":"boss"}
		]
	},
	{
		"id":"black_lantern","act":"CHAPTER 02","name":"THE BLACK LANTERN","district":"FITZROY",
		"accent":"#8d45ff","secondary":"#18e6d2","boss":"THE BAG GOBLIN","boss_style":"rush",
		"zones":["BRUNSWICK ST ENTRY","BLACK BAR","BACK ROOMS","SERVICE LANE"],
		"encounters":[
			{"x":1050.0,"name":"DOOR POLICY","count":2,"style":"heavy"},
			{"x":2650.0,"name":"BLACK BAR","count":3,"style":"ranged"},
			{"x":4350.0,"name":"BACK ROOM DEBT","count":3,"style":"mixed"},
			{"x":6150.0,"name":"SERVICE LANE SERMON","count":2,"style":"boss"}
		]
	},
	{
		"id":"glasshouse","act":"CHAPTER 03","name":"GLASSHOUSE","district":"CHAPEL STREET",
		"accent":"#31c9ff","secondary":"#ff4bb8","boss":"LOLA LEOPARD","boss_style":"heavy",
		"zones":["VALET & QUEUE","MIRROR BAR","ROOFTOP ACCESS","PENTHOUSE FLOOR"],
		"encounters":[
			{"x":1100.0,"name":"INFLUENCER QUEUE","count":2,"style":"rush"},
			{"x":2750.0,"name":"MIRROR BAR","count":3,"style":"ranged"},
			{"x":4450.0,"name":"ROOFTOP ACCESS","count":3,"style":"mixed"},
			{"x":6200.0,"name":"PENTHOUSE FLOOR","count":2,"style":"boss"}
		]
	},
	{
		"id":"casino","act":"CHAPTER 04","name":"CASINO PURGATORY","district":"SOUTHBANK",
		"accent":"#ffd33d","secondary":"#ff7849","boss":"CANDY GOLD","boss_style":"heavy",
		"zones":["RIVER ENTRY","CASINO FLOOR","HIGH LIMIT","PRIVATE LOUNGE"],
		"encounters":[
			{"x":1050.0,"name":"SECURITY DESK","count":2,"style":"heavy"},
			{"x":2700.0,"name":"CASINO FLOOR","count":3,"style":"ranged"},
			{"x":4400.0,"name":"HIGH LIMIT","count":3,"style":"mixed"},
			{"x":6200.0,"name":"PRIVATE LOUNGE","count":2,"style":"boss"}
		]
	},
	{
		"id":"warehouse_44","act":"CHAPTER 05","name":"WAREHOUSE 44","district":"FOOTSCRAY",
		"accent":"#23e0dc","secondary":"#a042ff","boss":"DAMO THE DOOR","boss_style":"heavy",
		"zones":["LOADING BAY","RAVE FLOOR","CATWALK","ROLLER DOOR"],
		"encounters":[
			{"x":1100.0,"name":"LOADING BAY","count":2,"style":"rush"},
			{"x":2750.0,"name":"RAVE FLOOR","count":3,"style":"ranged"},
			{"x":4450.0,"name":"CATWALK","count":3,"style":"mixed"},
			{"x":6200.0,"name":"ROLLER DOOR","count":2,"style":"boss"}
		]
	},
	{
		"id":"kebab_judgment","act":"FINAL CHAPTER","name":"KEBAB JUDGMENT","district":"ST KILDA / DAWN",
		"accent":"#ff7a4d","secondary":"#ffd33d","boss":"DAWN JUDGMENT","boss_style":"mixed",
		"zones":["LAST TRAM","KEBAB QUEUE","MOTEL STRIP","SUNRISE"],
		"encounters":[
			{"x":1050.0,"name":"TRAM STOP AFTERMATH","count":2,"style":"rush"},
			{"x":2700.0,"name":"KEBAB QUEUE","count":3,"style":"mixed"},
			{"x":4400.0,"name":"MOTEL STRIP","count":3,"style":"heavy"},
			{"x":6200.0,"name":"SUNRISE JUDGMENT","count":3,"style":"boss"}
		]
	}
]

const ROUTES := [
	[
		{"id":"front","label":"FRONT DOOR","subtitle":"QUEUE LIKE A CIVILIAN","threat":0,"reward":{"hp":8,"cash":20},"effects":{"heat":-2,"thot":2}},
		{"id":"side","label":"SIDE DOOR","subtitle":"FOLLOW THE BASS","threat":1,"reward":{"high":18,"cash":45},"effects":{"heat":7,"thot":7}},
		{"id":"vip","label":"VIP LIST","subtitle":"ACT LIKE YOU BELONG","threat":2,"reward":{"cash":90,"high":15},"effects":{"rizz":7,"heat":10,"thot":10}}
	],
	[
		{"id":"brunswick","label":"BRUNSWICK ST","subtitle":"FRONT DOOR","threat":0,"reward":{"hp":12},"effects":{"heat":-2,"rizz":2}},
		{"id":"laneway","label":"LANTERN LANE","subtitle":"SALEM KNOWS THE BACK WAY","threat":1,"reward":{"high":24,"cash":55},"effects":{"rizz":5,"heat":4,"thot":8}},
		{"id":"service","label":"SERVICE DOOR","subtitle":"NOT TECHNICALLY OPEN","threat":2,"reward":{"cash":110},"effects":{"heat":14,"debt":20,"thot":10}}
	],
	[
		{"id":"chapel","label":"CHAPEL STREET","subtitle":"PUBLIC ENTRANCE","threat":0,"reward":{"hp":10,"cash":35},"effects":{"heat":2,"rizz":2}},
		{"id":"rooftop","label":"ROOFTOP LIST","subtitle":"SOMEONE PUT YOUR NAME DOWN","threat":1,"reward":{"high":28,"cash":50},"effects":{"rizz":7,"heat":7,"thot":8}},
		{"id":"penthouse","label":"PENTHOUSE","subtitle":"DO NOT ASK WHO INVITED YOU","threat":2,"reward":{"cash":125,"hp":10},"effects":{"debt":35,"heat":12,"thot":12}}
	],
	[
		{"id":"river","label":"RIVERWALK","subtitle":"LOOK NORMAL","threat":0,"reward":{"hp":16},"effects":{"heat":-6}},
		{"id":"floor","label":"CASINO FLOOR","subtitle":"BRIGHT LIGHTS • BAD MATHS","threat":1,"reward":{"cash":85,"high":16},"effects":{"debt":25,"heat":6}},
		{"id":"limit","label":"HIGH LIMIT","subtitle":"BIANCA IS EXPECTING YOU","threat":2,"reward":{"cash":150,"high":20},"effects":{"rizz":9,"debt":70,"heat":10,"thot":10}}
	],
	[
		{"id":"loading","label":"LOADING BAY","subtitle":"MINIMAL WITNESSES","threat":0,"reward":{"hp":14,"cash":20},"effects":{"heat":-3}},
		{"id":"rave","label":"RAVE FLOOR","subtitle":"FOLLOW THE SUB-BASS","threat":1,"reward":{"high":30,"cash":65},"effects":{"heat":7,"thot":8}},
		{"id":"catwalk","label":"CATWALK","subtitle":"STAFF ONLY • OBVIOUSLY","threat":2,"reward":{"cash":130},"effects":{"heat":14,"thot":11}}
	],
	[
		{"id":"tram","label":"LAST TRAM","subtitle":"PRETEND TO GO HOME","threat":0,"reward":{"hp":28},"effects":{"heat":-8}},
		{"id":"kebab","label":"KEBAB QUEUE","subtitle":"GARLIC ARMOUR","threat":1,"reward":{"hp":20,"cash":55},"effects":{"heat":4,"thot":8}},
		{"id":"motel","label":"MOTEL STRIP","subtitle":"ONE LAST TERRIBLE IDEA","threat":2,"reward":{"high":35,"cash":120},"effects":{"rizz":8,"heat":12,"thot":12}}
	]
]
