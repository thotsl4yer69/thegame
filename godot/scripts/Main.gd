extends Node2D

const PlayerScript = preload("res://scripts/Player.gd")
const EnemyScript = preload("res://scripts/Enemy.gd")
const ProjectileScript = preload("res://scripts/Projectile.gd")
const PortraitScript = preload("res://scripts/Portrait.gd")

enum Mode { TITLE, MAP, PLAYING, CUTSCENE, UPGRADE, ENDING }

var mode: Mode = Mode.TITLE
var chapter_index := 0
var chapter: Dictionary = {}
var selected_route: Dictionary = {}
var route_threat := 0

var player: CharacterBody2D
var camera: Camera2D
var enemies: Array[Node] = []
var encounter_index := 0
var encounter_active := false
var arena_left := 0.0
var arena_right := ChapterData.WORLD_WIDTH
var chapter_start_score := 0
var chapter_start_hp := 100.0
var pending_chapter := 0

var ui: CanvasLayer
var title_root: Control
var map_root: Control
var hud_root: Control
var cutscene_root: Control
var ending_root: Control
var touch_root: Control

var hp_bar: ProgressBar
var high_bar: ProgressBar
var chapter_label: Label
var encounter_label: Label
var cash_label: Label
var score_label: Label
var combo_label: Label
var toast_label: Label

var toast_timer := 0.0
var combo_count := 0
var combo_timer := 0.0

func _ready() -> void:
	_register_inputs()
	_build_ui()
	show_title()
	set_process(true)
	queue_redraw()

func _process(delta: float) -> void:
	if toast_timer > 0.0:
		toast_timer -= delta
		if toast_timer <= 0.0:
			toast_label.text = ""

	if combo_timer > 0.0:
		combo_timer -= delta
		if combo_timer <= 0.0:
			combo_count = 0
			combo_label.visible = false

	if mode == Mode.PLAYING and is_instance_valid(player):
		if encounter_active:
			player.position.x = clamp(player.position.x, arena_left, arena_right)
			_check_encounter_clear()
		else:
			_check_encounter_trigger()
		if encounter_index >= chapter.encounters.size() and player.position.x > ChapterData.WORLD_WIDTH - 300.0:
			_complete_chapter()
		_update_hud()

func _register_inputs() -> void:
	var binds := {
		"move_left": KEY_A,
		"move_right": KEY_D,
		"move_up": KEY_W,
		"move_down": KEY_S,
		"attack_light": KEY_J,
		"attack_heavy": KEY_H,
		"dash": KEY_SHIFT,
		"interact": KEY_E,
		"pause": KEY_ESCAPE
	}
	for action in binds:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		var event := InputEventKey.new()
		event.physical_keycode = binds[action]
		InputMap.action_add_event(action,event)
	# Arrow keys too.
	var arrows := {
		"move_left": KEY_LEFT,
		"move_right": KEY_RIGHT,
		"move_up": KEY_UP,
		"move_down": KEY_DOWN
	}
	for action in arrows:
		var event := InputEventKey.new()
		event.physical_keycode = arrows[action]
		InputMap.action_add_event(action,event)

func _build_ui() -> void:
	ui = CanvasLayer.new()
	ui.layer = 50
	add_child(ui)

	title_root = _full_control()
	map_root = _full_control()
	hud_root = _full_control()
	cutscene_root = _full_control()
	ending_root = _full_control()
	touch_root = _full_control()

	ui.add_child(title_root)
	ui.add_child(map_root)
	ui.add_child(hud_root)
	ui.add_child(cutscene_root)
	ui.add_child(ending_root)
	ui.add_child(touch_root)

	_build_title()
	_build_hud()
	_build_touch_controls()

func _full_control() -> Control:
	var c := Control.new()
	c.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	return c

func _panel(parent: Control, color: Color, rect: Rect2) -> ColorRect:
	var p := ColorRect.new()
	p.color = color
	p.position = rect.position
	p.size = rect.size
	parent.add_child(p)
	return p

func _label(parent: Control, text: String, pos: Vector2, size: Vector2, font_size := 24, color := Color.WHITE) -> Label:
	var l := Label.new()
	l.text = text
	l.position = pos
	l.size = size
	l.add_theme_font_size_override("font_size",font_size)
	l.add_theme_color_override("font_color",color)
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	parent.add_child(l)
	return l

func _button(parent: Control, text: String, pos: Vector2, size: Vector2, callback: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.position = pos
	b.size = size
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_size_override("font_size",18)
	b.pressed.connect(callback)
	parent.add_child(b)
	return b

func _build_title() -> void:
	_panel(title_root,Color("#08050d"),Rect2(0,0,1280,720))
	_panel(title_root,Color("#2a071f"),Rect2(0,0,1280,150))
	_label(title_root,"THOTSL4YER69",Vector2(72,100),Vector2(820,120),72,Color("#ff2b9f"))
	_label(title_root,"MELBOURNE AFTER DARK",Vector2(78,210),Vector2(700,50),28,Color("#23e0dc"))
	_label(title_root,"R18+ STORY MODE • SIX DISTRICTS • ONE TERRIBLE NIGHT",Vector2(80,270),Vector2(760,40),16,Color("#f6d9e9"))

	_button(title_root,"START STORY MODE",Vector2(80,360),Vector2(310,68),func(): start_new_story())
	var continue_btn := _button(title_root,"CONTINUE STORY",Vector2(80,445),Vector2(310,62),func(): continue_story())
	continue_btn.name = "ContinueStory"
	_button(title_root,"COMBAT",Vector2(420,360),Vector2(180,68),func(): _show_help())
	_button(title_root,"DOSSIERS",Vector2(420,445),Vector2(180,62),func(): _show_dossiers())

	# New title-side graphic language: Melbourne skyline / neon / tram wire.
	var side: Control = PortraitScript.new()
	side.position = Vector2(730,70)
	side.size = Vector2(500,610)
	side.setup("SALEM","violet")
	title_root.add_child(side)

func show_title() -> void:
	mode = Mode.TITLE
	_show_only(title_root)
	var btn := title_root.get_node_or_null("ContinueStory") as Button
	if btn:
		btn.visible = GameState.has_save()

func start_new_story() -> void:
	GameState.reset_story()
	show_map(0)

func continue_story() -> void:
	if GameState.load_save():
		show_map(GameState.chapter_index)
	else:
		start_new_story()

func _show_help() -> void:
	_clear_control(ending_root)
	ending_root.visible = true
	_panel(ending_root,Color("#08050def"),Rect2(0,0,1280,720))
	_label(ending_root,"COMBAT IS DIFFERENT NOW.",Vector2(90,90),Vector2(850,70),40,Color("#ffd33d"))
	_label(ending_root,"MOVE IN 8 DIRECTIONS • J = 1-2-3 STRING • H = HEAVY • SHIFT = DODGE",Vector2(90,190),Vector2(980,60),20)
	_label(ending_root,"READ THE WARNING RINGS. DODGE. PUNISH. BOSSES CHANGE PHASE AT 50%.",Vector2(90,260),Vector2(1000,60),18,Color("#23e0dc"))
	_button(ending_root,"BACK",Vector2(90,360),Vector2(180,60),func(): show_title())

func _show_dossiers() -> void:
	_clear_control(ending_root)
	ending_root.visible = true
	_panel(ending_root,Color("#08050df4"),Rect2(0,0,1280,720))
	_label(ending_root,"MELBOURNE NIGHT SHIFT",Vector2(60,40),Vector2(700,70),42,Color("#ff2b9f"))
	var names := [
		["ROXI REDLINE","pink","King Street performer / information broker."],
		["SALEM","violet","Fitzroy goth operator. Knows every back door."],
		["VIPER VICE","cyan","Chapel Street leverage in thigh-high boots."],
		["BIANCA BLACKOUT","gold","Southbank money, cameras and bad terms."]
	]
	for i in range(names.size()):
		var card_x := 55.0 + float(i)*300.0
		_panel(ending_root,Color("#130b16"),Rect2(card_x,145,265,410))
		var portrait: Control = PortraitScript.new()
		portrait.position = Vector2(card_x+20,160)
		portrait.size = Vector2(225,260)
		portrait.setup(names[i][0],names[i][1])
		ending_root.add_child(portrait)
		_label(ending_root,names[i][0],Vector2(card_x+16,430),Vector2(235,38),18,Color("#ffd33d"))
		var desc := _label(ending_root,names[i][2],Vector2(card_x+16,474),Vector2(235,70),13,Color("#eee1e9"))
		desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_button(ending_root,"BACK",Vector2(55,590),Vector2(180,58),func(): show_title())

func show_map(index: int) -> void:
	mode = Mode.MAP
	chapter_index = clampi(index,0,ChapterData.CHAPTERS.size()-1)
	chapter = ChapterData.CHAPTERS[chapter_index]
	_show_only(map_root)
	_clear_control(map_root)

	_panel(map_root,Color("#06040a"),Rect2(0,0,1280,720))
	_label(map_root,"MELBOURNE • NIGHT %02d" % max(1,GameState.completed_chapters.size()+1),Vector2(50,28),Vector2(500,40),17,Color("#23e0dc"))
	_label(map_root,"WHERE TO NEXT?",Vector2(50,62),Vector2(700,70),46,Color("#ff2b9f"))
	_label(map_root,"%s • %s" % [chapter.district,chapter.name],Vector2(55,126),Vector2(700,36),18,Color("#ffd33d"))

	# Stylised Melbourne route: intentionally new composition, not the old Mario-map clone.
	var route_rect := Rect2(45,185,1190,265)
	_panel(map_root,Color("#0b1118"),route_rect)
	_panel(map_root,Color("#123b48"),Rect2(45,315,1190,42))
	_panel(map_root,Color("#ff2b9f"),Rect2(95,295,1040,6))

	var node_positions := [
		Vector2(115,350),Vector2(300,255),Vector2(490,370),
		Vector2(680,245),Vector2(880,360),Vector2(1080,250)
	]
	for i in range(ChapterData.CHAPTERS.size()):
		var data: Dictionary = ChapterData.CHAPTERS[i]
		var b := _button(map_root,"%d\n%s\n%s" % [i+1,data.name,data.district],node_positions[i],Vector2(155,82),func(): pass)
		b.disabled = i != chapter_index
		b.modulate = Color.WHITE if i <= chapter_index else Color(0.4,0.4,0.45,0.45)

	_label(map_root,"RIZZ %d   HEAT %d   DEBT $%d   THOT %d%%" % [GameState.rizz,GameState.heat,GameState.debt,GameState.thot_meter],Vector2(55,472),Vector2(950,34),17,Color("#f7d9eb"))
	_label(map_root,"CHOOSE AN APPROACH",Vector2(55,515),Vector2(400,34),20,Color("#23e0dc"))

	var routes: Array = ChapterData.ROUTES[chapter_index]
	for i in range(routes.size()):
		var r: Dictionary = routes[i]
		var threat := "●".repeat(int(r.threat)+1) + "○".repeat(2-int(r.threat))
		var b := _button(map_root,"%s\n%s\nTHREAT %s" % [r.label,r.subtitle,threat],Vector2(55+i*400,555),Vector2(365,115),func(route=r): select_route(route))
		b.add_theme_font_size_override("font_size",15)

func select_route(route: Dictionary) -> void:
	selected_route = route
	route_threat = int(route.threat)
	GameState.apply_route(route)
	start_chapter(chapter_index)

func start_chapter(index: int) -> void:
	mode = Mode.PLAYING
	chapter_index = index
	chapter = ChapterData.CHAPTERS[index]
	_clear_world()
	_show_only(hud_root)
	touch_root.visible = true

	player = PlayerScript.new()
	player.position = Vector2(240,535)
	add_child(player)
	player.sync_from_state()
	player.attack_window.connect(_on_player_attack)
	player.stats_changed.connect(_update_hud)
	player.knocked_out.connect(_game_over)

	camera = Camera2D.new()
	camera.position_smoothing_enabled = true
	camera.position_smoothing_speed = 8.0
	camera.limit_left = 0
	camera.limit_right = int(ChapterData.WORLD_WIDTH)
	camera.limit_top = 0
	camera.limit_bottom = 720
	camera.position = Vector2(120,0)
	player.add_child(camera)
	camera.make_current()

	encounter_index = 0
	encounter_active = false
	arena_left = 0
	arena_right = ChapterData.WORLD_WIDTH
	chapter_start_score = GameState.score
	chapter_start_hp = player.hp
	queue_redraw()
	_update_hud()
	_toast("%s • %s" % [chapter.act,chapter.district])

func _clear_world() -> void:
	for enemy in enemies:
		if is_instance_valid(enemy):
			enemy.queue_free()
	enemies.clear()
	for child in get_children():
		if child == player or child.get_script() == ProjectileScript:
			child.queue_free()
	player = null
	camera = null

func _check_encounter_trigger() -> void:
	if encounter_index >= chapter.encounters.size():
		return
	var encounter: Dictionary = chapter.encounters[encounter_index]
	if player.position.x >= float(encounter.x):
		_start_encounter(encounter)

func _start_encounter(encounter: Dictionary) -> void:
	encounter_active = true
	arena_left = max(80.0,float(encounter.x)-360.0)
	arena_right = min(ChapterData.WORLD_WIDTH-80.0,float(encounter.x)+820.0)
	_toast(encounter.name)
	var count := int(encounter.count) + route_threat
	count = mini(count,5)
	for i in range(count):
		var style := String(encounter.style)
		if style == "mixed":
			style = ["rush","heavy","ranged"][i%3]
		var is_boss := String(encounter.style)=="boss" and i==count-1
		if is_boss:
			style = String(chapter.boss_style)
		var enemy: Node = EnemyScript.new()
		enemy.position = Vector2(float(encounter.x)+250.0+float(i)*92.0,470.0+float(i%3)*55.0)
		add_child(enemy)
		var enemy_name := String(chapter.boss) if is_boss else _enemy_name(style,i)
		enemy.setup(player,style,enemy_name,Color(chapter.accent),is_boss,i)
		enemy.died.connect(_on_enemy_died)
		enemy.projectile_requested.connect(_spawn_projectile)
		enemies.append(enemy)

func _enemy_name(style: String, index: int) -> String:
	var groups := {
		"rush":["CLUB RAT","RUNNER","CHAOS MERCHANT"],
		"heavy":["BOUNCER","SECURITY","BRUISER"],
		"ranged":["BOTTLE GIRL","PUNTER","THROWER"]
	}
	var arr: Array = groups.get(style,groups.rush)
	return arr[index%arr.size()]

func _check_encounter_clear() -> void:
	var alive := 0
	for enemy in enemies:
		if is_instance_valid(enemy) and not enemy.dead:
			alive += 1
	if alive == 0:
		encounter_active = false
		encounter_index += 1
		player.heal(6.0)
		GameState.score += 300 + encounter_index*120
		GameState.save()
		_toast("AREA CLEARED • KEEP MOVING →")

func _on_player_attack(origin: Vector2, facing: float, range_x: float, range_y: float, damage: float, knockback: float) -> void:
	var hits := 0
	for enemy in enemies:
		if not is_instance_valid(enemy) or enemy.dead:
			continue
		var d: Vector2 = enemy.global_position-origin
		if sign(d.x if d.x != 0 else facing)==sign(facing) and abs(d.x)<=range_x and abs(d.y)<=range_y:
			enemy.receive_hit(damage,knockback,origin.x)
			hits += 1
	if hits > 0:
		combo_count += hits
		combo_timer = 1.2
		combo_label.visible = combo_count >= 2
		combo_label.text = "%d×  %s" % [combo_count,("ABSOLUTE FILTH" if combo_count>=8 else "DISGUSTING" if combo_count>=5 else "FILTHY")]
		player.reward_hit(5.0*hits,2*hits)
		GameState.score += int(damage*100.0)*hits

func _on_enemy_died(enemy: Node) -> void:
	GameState.score += 300 if enemy.boss else 110
	GameState.cash += 30 if enemy.boss else 8
	GameState.save()
	_update_hud()

func _spawn_projectile(origin: Vector2, target: Vector2, damage: float) -> void:
	var shot: Node = ProjectileScript.new()
	add_child(shot)
	shot.setup(origin,target,damage)

func _complete_chapter() -> void:
	if mode != Mode.PLAYING:
		return
	mode = Mode.CUTSCENE
	touch_root.visible = false
	hud_root.visible = false
	player.sync_to_state()
	GameState.save()
	pending_chapter = chapter_index
	var damage_taken: float = maxf(0.0,chapter_start_hp-player.hp)
	var performance: int = maxi(500,GameState.score-chapter_start_score)
	GameState.score += int(1000.0-damage_taken*8.0)
	show_cutscene(pending_chapter,performance,damage_taken)

func show_cutscene(index: int, performance: int, damage_taken: float) -> void:
	_show_only(cutscene_root)
	_clear_control(cutscene_root)
	var scene: Dictionary = StoryData.END_SCENES[index]
	var tone := String(scene.tone)

	_panel(cutscene_root,Color("#070309"),Rect2(0,0,1280,720))
	_panel(cutscene_root,Color(_tone_color(tone),0.13),Rect2(0,0,1280,720))

	var portrait: Control = PortraitScript.new()
	portrait.position = Vector2(650,20)
	portrait.size = Vector2(600,700)
	portrait.setup(String(scene.character),tone)
	cutscene_root.add_child(portrait)

	var card := _panel(cutscene_root,Color("#100915eb"),Rect2(45,250,680,410))
	_label(cutscene_root,String(scene.location),Vector2(72,270),Vector2(590,35),15,Color("#23e0dc"))
	_label(cutscene_root,String(scene.character),Vector2(72,310),Vector2(590,58),36,Color(_tone_color(tone)))
	var line := _label(cutscene_root,String(scene.line),Vector2(72,375),Vector2(600,95),18,Color("#f7eaf2"))
	line.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART

	var choices: Array = scene.choices
	for i in range(choices.size()):
		var choice: Dictionary = choices[i]
		var b := _button(cutscene_root,String(choice.label),Vector2(72,490+i*52),Vector2(600,44),func(c=choice): _resolve_story_choice(c,index,performance,damage_taken))
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT

func _resolve_story_choice(choice: Dictionary, index: int, performance: int, damage_taken: float) -> void:
	_apply_story_effects(choice.effects)
	_clear_control(cutscene_root)
	_panel(cutscene_root,Color("#08050df2"),Rect2(0,0,1280,720))
	var portrait: Control = PortraitScript.new()
	portrait.position = Vector2(680,20)
	portrait.size = Vector2(560,700)
	var scene: Dictionary = StoryData.END_SCENES[index]
	portrait.setup(String(scene.character),String(scene.tone))
	cutscene_root.add_child(portrait)
	_label(cutscene_root,String(scene.character),Vector2(70,180),Vector2(560,60),38,Color(_tone_color(String(scene.tone))))
	var reply := _label(cutscene_root,String(choice.reply),Vector2(70,255),Vector2(590,150),20,Color("#f7eaf2"))
	reply.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_button(cutscene_root,"CONTINUE THE NIGHT →",Vector2(70,455),Vector2(330,62),func(): show_upgrade(index,performance,damage_taken))

func _apply_story_effects(effects: Dictionary) -> void:
	GameState.rizz = clampi(GameState.rizz + int(effects.get("rizz",0)),0,100)
	GameState.heat = clampi(GameState.heat + int(effects.get("heat",0)),0,100)
	GameState.debt = max(0,GameState.debt + int(effects.get("debt",0)))
	GameState.thot_meter = clampi(GameState.thot_meter + int(effects.get("thot",0)),0,100)
	GameState.cash = max(0,GameState.cash + int(effects.get("cash",0)))
	GameState.save()

func show_upgrade(index: int, performance: int, damage_taken: float) -> void:
	mode = Mode.UPGRADE
	_show_only(cutscene_root)
	_clear_control(cutscene_root)
	_panel(cutscene_root,Color("#08050d"),Rect2(0,0,1280,720))
	_label(cutscene_root,"CHAPTER CLEARED",Vector2(65,80),Vector2(600,50),20,Color("#23e0dc"))
	_label(cutscene_root,"WHAT DID THE NIGHT TEACH YOU?",Vector2(65,130),Vector2(900,70),42,Color("#ff2b9f"))
	for i in range(StoryData.UPGRADES.size()):
		var up: Dictionary = StoryData.UPGRADES[i]
		var x := 65.0 + float(i%2)*570.0
		var y := 250.0 + float(i/2)*150.0
		var b := _button(cutscene_root,"%s\n%s" % [up.name,up.desc],Vector2(x,y),Vector2(520,115),func(u=up): _choose_upgrade(u,index,performance,damage_taken))
		b.add_theme_font_size_override("font_size",17)

func _choose_upgrade(upgrade: Dictionary, index: int, performance: int, damage_taken: float) -> void:
	GameState.apply_upgrade(String(upgrade.id))
	if index >= ChapterData.CHAPTERS.size()-1:
		GameState.complete_chapter(performance,damage_taken)
		show_ending()
		return
	GameState.complete_chapter(performance,damage_taken)
	show_map(index+1)

func show_ending() -> void:
	mode = Mode.ENDING
	_show_only(ending_root)
	_clear_control(ending_root)
	var result := GameState.ending()
	_panel(ending_root,Color("#070309"),Rect2(0,0,1280,720))
	_label(ending_root,String(result.title),Vector2(60,120),Vector2(1120,100),62,Color("#ff2b9f"))
	_label(ending_root,String(result.subtitle),Vector2(65,225),Vector2(1000,50),26,Color("#ffd33d"))
	_label(ending_root,"RIZZ %d   HEAT %d   DEBT $%d   THOT %d%%" % [GameState.rizz,GameState.heat,GameState.debt,GameState.thot_meter],Vector2(65,320),Vector2(1000,45),22,Color("#23e0dc"))
	_label(ending_root,"SCORE %s   CASH $%d" % [str(GameState.score),GameState.cash],Vector2(65,380),Vector2(1000,45),21)
	_button(ending_root,"ANOTHER NIGHT",Vector2(65,500),Vector2(280,68),func(): start_new_story())
	_button(ending_root,"TITLE",Vector2(365,500),Vector2(180,68),func(): show_title())

func _game_over() -> void:
	mode = Mode.ENDING
	touch_root.visible = false
	hud_root.visible = false
	_show_only(ending_root)
	_clear_control(ending_root)
	_panel(ending_root,Color("#070309"),Rect2(0,0,1280,720))
	_label(ending_root,"ABSOLUTELY FUCKED IT",Vector2(70,160),Vector2(1000,90),54,Color("#ff315e"))
	_label(ending_root,"%s • %s" % [chapter.name,chapter.district],Vector2(75,260),Vector2(800,45),22,Color("#ffd33d"))
	_button(ending_root,"CONTINUE FROM CHAPTER",Vector2(75,390),Vector2(360,65),func(): show_map(chapter_index))
	_button(ending_root,"TITLE",Vector2(455,390),Vector2(180,65),func(): show_title())

func _build_hud() -> void:
	hud_root.visible = false
	var top := _panel(hud_root,Color("#070309d8"),Rect2(0,0,1280,96))
	chapter_label = _label(hud_root,"CHAPTER",Vector2(380,8),Vector2(520,36),18,Color("#ffd33d"))
	chapter_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	encounter_label = _label(hud_root,"ADVANCE",Vector2(380,44),Vector2(520,30),14,Color("#23e0dc"))
	encounter_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	hp_bar = ProgressBar.new()
	hp_bar.position = Vector2(30,25)
	hp_bar.size = Vector2(300,22)
	hp_bar.show_percentage = false
	hp_bar.max_value = 100
	hud_root.add_child(hp_bar)
	_label(hud_root,"MEAT",Vector2(30,50),Vector2(120,28),14,Color("#ff789d"))

	high_bar = ProgressBar.new()
	high_bar.position = Vector2(925,24)
	high_bar.size = Vector2(160,18)
	high_bar.show_percentage = false
	high_bar.max_value = 100
	hud_root.add_child(high_bar)
	_label(hud_root,"HIGH",Vector2(925,48),Vector2(80,25),13,Color("#23e0dc"))
	cash_label = _label(hud_root,"$0",Vector2(1100,20),Vector2(150,28),16,Color("#ffd33d"))
	score_label = _label(hud_root,"0",Vector2(1100,52),Vector2(150,26),14,Color("#ffffff"))
	combo_label = _label(hud_root,"2× FILTHY",Vector2(930,115),Vector2(300,60),30,Color("#ffd33d"))
	combo_label.visible = false
	toast_label = _label(hud_root,"",Vector2(260,118),Vector2(760,55),24,Color("#ffffff"))
	toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

func _update_hud() -> void:
	if not is_instance_valid(player):
		return
	hp_bar.max_value = player.max_hp
	hp_bar.value = player.hp
	high_bar.value = player.high
	chapter_label.text = "%s • %s" % [chapter.act,chapter.name]
	var e_name := "EXIT →" if encounter_index >= chapter.encounters.size() else String(chapter.encounters[encounter_index].name)
	encounter_label.text = e_name
	cash_label.text = "$%d" % GameState.cash
	score_label.text = "SCORE %d" % GameState.score

func _build_touch_controls() -> void:
	touch_root.visible = false
	# D-pad
	_hold_button(touch_root,"▲","move_up",Vector2(92,535),Vector2(64,64))
	_hold_button(touch_root,"◀","move_left",Vector2(20,600),Vector2(64,64))
	_hold_button(touch_root,"▶","move_right",Vector2(164,600),Vector2(64,64))
	_hold_button(touch_root,"▼","move_down",Vector2(92,600),Vector2(64,64))
	# Combat cluster
	_tap_button(touch_root,"DASH","dash",Vector2(965,595),Vector2(78,78))
	_tap_button(touch_root,"HARD","attack_heavy",Vector2(1050,565),Vector2(84,84))
	_tap_button(touch_root,"SMACK","attack_light",Vector2(1140,535),Vector2(108,108))

func _hold_button(parent: Control, text: String, action: String, pos: Vector2, size: Vector2) -> void:
	var b := Button.new()
	b.text=text;b.position=pos;b.size=size;b.focus_mode=Control.FOCUS_NONE
	b.button_down.connect(func(): Input.action_press(action))
	b.button_up.connect(func(): Input.action_release(action))
	parent.add_child(b)

func _tap_button(parent: Control, text: String, action: String, pos: Vector2, size: Vector2) -> void:
	var b := Button.new()
	b.text=text;b.position=pos;b.size=size;b.focus_mode=Control.FOCUS_NONE
	b.button_down.connect(func(): Input.action_press(action))
	b.button_up.connect(func(): Input.action_release(action))
	parent.add_child(b)

func _toast(text: String) -> void:
	toast_label.text = text
	toast_timer = 1.4

func _tone_color(tone: String) -> String:
	match tone:
		"violet": return "#8d45ff"
		"cyan": return "#23e0dc"
		"gold": return "#ffd33d"
		"orange": return "#ff7a4d"
		_: return "#ff2b9f"

func _show_only(control: Control) -> void:
	for item in [title_root,map_root,hud_root,cutscene_root,ending_root]:
		item.visible = item == control
	if control != hud_root:
		touch_root.visible = false

func _clear_control(control: Control) -> void:
	for child in control.get_children():
		child.queue_free()

func _draw() -> void:
	if chapter.is_empty():
		return
	var accent := Color(chapter.accent)
	var secondary := Color(chapter.secondary)
	var width := ChapterData.WORLD_WIDTH

	# Deep city background.
	draw_rect(Rect2(0,0,width,ChapterData.FLOOR_TOP),Color("#07050b"))
	draw_rect(Rect2(0,ChapterData.FLOOR_TOP,width,ChapterData.FLOOR_BOTTOM-ChapterData.FLOOR_TOP+70),Color("#130b16"))

	# Melbourne skyline / venues.
	for i in range(38):
		var x := float(i)*205.0
		var bh := 95.0 + float((i*47)%170)
		var building := Color("#0d1018").lerp(accent,0.06+float(i%4)*0.02)
		draw_rect(Rect2(x,ChapterData.FLOOR_TOP-bh,175,bh),building)
		for wy in range(0,int(bh)-30,34):
			var lit := secondary if (i+wy/34)%4==0 else Color("#1a2330")
			draw_rect(Rect2(x+22,ChapterData.FLOOR_TOP-bh+18+wy,18,8),lit)

	# Tram wires / overhead nightlife infrastructure.
	for x in range(0,int(width),420):
		draw_line(Vector2(x,105),Vector2(x+420,125),Color("#5f5268"),2.0)
		draw_line(Vector2(x+120,75),Vector2(x+120,ChapterData.FLOOR_TOP),Color("#221926"),4.0)

	# Floor perspective gives v5 a belt-brawler plane instead of the old flat stage.
	for y in range(int(ChapterData.FLOOR_TOP),int(ChapterData.FLOOR_BOTTOM)+1,48):
		draw_line(Vector2(0,y),Vector2(width,y),Color(accent,0.06),2.0)
	for x in range(0,int(width),260):
		draw_line(Vector2(x,ChapterData.FLOOR_TOP),Vector2(x+90,ChapterData.FLOOR_BOTTOM),Color(secondary,0.05),2.0)

	# Four unique district zones.
	var zones: Array = chapter.zones
	var zone_w := width/4.0
	for i in range(4):
		var zx := float(i)*zone_w
		draw_rect(Rect2(zx+30,150,zone_w-60,170),Color(accent,0.035+float(i)*0.012))
		draw_line(Vector2(zx+zone_w,120),Vector2(zx+zone_w,ChapterData.FLOOR_BOTTOM),Color(secondary,0.18),5.0)
		var zone_name := String(zones[i])
		draw_string(ThemeDB.fallback_font,Vector2(zx+70,190),zone_name,HORIZONTAL_ALIGNMENT_LEFT,-1,31,Color(accent,0.55))
		_draw_zone_props(i,zx,zone_w,accent,secondary)

func _draw_zone_props(zone: int, zx: float, zw: float, accent: Color, secondary: Color) -> void:
	match String(chapter.id):
		"pink_pigeon":
			if zone==0:
				draw_line(Vector2(zx+360,430),Vector2(zx+360,620),Color("#d5b65a"),9.0)
				draw_line(Vector2(zx+650,430),Vector2(zx+650,620),Color("#d5b65a"),9.0)
				draw_line(Vector2(zx+360,470),Vector2(zx+650,470),Color("#a9134c"),9.0)
			elif zone==1:
				for px in [zx+420,zx+880]:
					draw_line(Vector2(px,185),Vector2(px,620),Color("#d7d7e4"),5.0)
					draw_circle(Vector2(px,600),50,Color(accent,0.08))
			elif zone==2:
				for bx in [zx+360,zx+900]:
					draw_rect(Rect2(bx,520,280,72),Color("#4b1235"))
					draw_circle(Vector2(bx+140,530),48,Color("#090509"))
			else:
				draw_rect(Rect2(zx+980,190,220,330),Color("#1d0a16"))
				draw_string(ThemeDB.fallback_font,Vector2(zx+1010,245),"DRESSING ROOM",HORIZONTAL_ALIGNMENT_LEFT,-1,18,accent)
		"black_lantern":
			draw_rect(Rect2(zx+360,240,210,280),Color("#0d0b14"))
			draw_rect(Rect2(zx+790,210,180,310),Color("#160d20"))
			draw_string(ThemeDB.fallback_font,Vector2(zx+815,270),"SALEM",HORIZONTAL_ALIGNMENT_LEFT,-1,22,secondary)
		"glasshouse":
			draw_rect(Rect2(zx+350,180,210,360),Color("#192431"))
			draw_line(Vector2(zx+760,180),Vector2(zx+1010,520),Color("#e5f4ff"),5.0)
			draw_line(Vector2(zx+1010,180),Vector2(zx+760,520),Color("#e5f4ff"),5.0)
		"casino":
			for bx in [zx+350,zx+720,zx+1090]:
				draw_rect(Rect2(bx,420,150,160),Color("#241708"))
				draw_rect(Rect2(bx+18,440,114,70),Color("#ffd33d22"))
		"warehouse_44":
			for px in [zx+350,zx+760,zx+1150]:
				draw_line(Vector2(px,170),Vector2(px,620),secondary,4.0)
				draw_circle(Vector2(px,190),25,Color(accent,0.18))
		"kebab_judgment":
			draw_rect(Rect2(zx+300,320,420,250),Color("#2d1a0b"))
			draw_string(ThemeDB.fallback_font,Vector2(zx+360,385),"OPEN LATE",HORIZONTAL_ALIGNMENT_LEFT,-1,30,Color("#ffb45e"))
			draw_line(Vector2(zx+960,210),Vector2(zx+1180,210),Color("#d6d5de"),5.0)
