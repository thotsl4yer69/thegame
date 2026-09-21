extends Node

const END_SCENES := [
	{
		"character":"ROXI REDLINE","location":"KING STREET • BACKSTAGE","tone":"pink",
		"line":"Chad is down, half the booth is broken, and you still look like you think this counts as a plan.",
		"choices":[
			{"label":"ASK ABOUT FITZROY","reply":"Roxi writes BLACK LANTERN on a drinks receipt. “Ask for Salem. Try not to embarrass me.”","effects":{"rizz":2}},
			{"label":"TIP ROXI $50","reply":"She folds the note away without breaking eye contact. “Good. At least one of us understands the business model.”","effects":{"cash":-50,"thot":8}},
			{"label":"KEEP FLIRTING","reply":"Roxi drags a lipstick mark across your collar. “Salem is going to love making fun of you.”","effects":{"rizz":8,"heat":2}}
		]
	},
	{
		"character":"SALEM","location":"FITZROY • BLACK LANTERN","tone":"violet",
		"line":"Roxi sends loud men to me when she wants them pointed somewhere useful. Chapel Street. Glasshouse. Viper has the next key.",
		"choices":[
			{"label":"ASK FOR THE BACK WAY","reply":"Salem saves a service-door code in your phone under DO NOT BE STUPID. “The name will not help.”","effects":{"rizz":4,"heat":-3}},
			{"label":"BUY HER A DRINK","reply":"She looks at the glass, then at you. “That was either charming or an attempted bribe. Continue.”","effects":{"cash":-25,"rizz":6}},
			{"label":"ASK WHO VIPER IS","reply":"“The sort of mistake that texts back.” Salem smiles once. That is somehow worse.","effects":{"thot":5}}
		]
	},
	{
		"character":"VIPER VICE","location":"CHAPEL STREET • ROOFTOP","tone":"cyan",
		"line":"Southbank. High-limit floor. Bianca owns the cameras, the debt and half the people pretending not to watch us.",
		"choices":[
			{"label":"TAKE THE KEY","reply":"Viper slides it beneath your collar. “Try to arrive wearing the same clothes.”","effects":{"heat":4,"thot":5}},
			{"label":"CALL HER JEALOUS","reply":"“Jealous girls throw drinks. I use leverage.” She gets close enough to make the distinction unhelpful.","effects":{"rizz":7,"heat":4}},
			{"label":"ASK ABOUT BIANCA","reply":"Viper laughs. “Expensive. Patient. Worse when interested.”","effects":{"debt":10}}
		]
	},
	{
		"character":"BIANCA BLACKOUT","location":"SOUTHBANK • HIGH LIMIT","tone":"gold",
		"line":"Damo is moving my ledger through Footscray. Bring it back and I might erase your tab. Lose, and security gets creative.",
		"choices":[
			{"label":"TAKE THE DEAL","reply":"Bianca smiles like the contract was signed before you arrived.","effects":{"debt":45,"rizz":4}},
			{"label":"CALL HER BLUFF","reply":"For one second she looks impressed. Every security radio in the room wakes up.","effects":{"rizz":10,"heat":12}},
			{"label":"WALK AWAY FIRST","reply":"“Discipline?” Bianca asks. “How disappointing.”","effects":{"debt":-15,"heat":-5}}
		]
	},
	{
		"character":"SALEM","location":"FOOTSCRAY • WAREHOUSE 44","tone":"violet",
		"line":"You actually made it through Southbank. Damo was the door, not the room. Finish this before sunrise.",
		"choices":[
			{"label":"ASK SALEM TO COME","reply":"“Absolutely not.” She pauses. “I will meet you there.”","effects":{"rizz":7}},
			{"label":"HAND HER THE LEDGER","reply":"She flips through three pages and goes quiet. “Okay. Now this is actually bad.”","effects":{"heat":-5,"debt":-20}},
			{"label":"MAKE A JOKE","reply":"Salem wipes blood from your cheek. “You really do make everything worse.”","effects":{"thot":6}}
		]
	},
	{
		"character":"ROXI REDLINE","location":"ST KILDA • FIRST LIGHT","tone":"orange",
		"line":"You smell like casino carpet, warehouse smoke, expensive perfume and garlic sauce. Melbourne really put effort into you.",
		"choices":[
			{"label":"CALL IT RESEARCH","reply":"“Of course you do.” Roxi steals your sunglasses before the sun clears the roofs.","effects":{"rizz":4}},
			{"label":"ASK WHAT HAPPENS NOW","reply":"“Breakfast. Statements. Denial. Maybe not in that order.”","effects":{"heat":-4}},
			{"label":"SAY NOTHING","reply":"Roxi hooks two fingers through your collar. “Finally. Character development.”","effects":{"thot":5,"rizz":5}}
		]
	}
]

const UPGRADES := [
	{"id":"power","name":"HEAVY HANDS","desc":"+15% damage for the rest of the night."},
	{"id":"speed","name":"SECOND WIND","desc":"+8% movement speed."},
	{"id":"meat","name":"THICK SKIN","desc":"+18 maximum MEAT and heal 30."},
	{"id":"high","name":"BAD INFLUENCE","desc":"+35 HIGH immediately."}
]
