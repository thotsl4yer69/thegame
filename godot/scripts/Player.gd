class_name PlayerFighter
extends CharacterBody2D

signal attack_window(origin: Vector2, facing: float, range_x: float, range_y: float, damage: float, knockback: float)
signal stats_changed
signal knocked_out

var move_speed := 310.0
var power_mult := 1.0
var max_hp := 100.0
var hp := 100.0
var high := 0.0
var cash := 0

var facing := 1.0
var invulnerable_until := 0
var stunned_until := 0
var dash_ready_at := 0
var attack_step := 0
var attack_started_at := 0
var attack_hit_done := false
var attack_kind := ""
var queued_attack := ""
var queue_until := 0
var last_light_at := 0

const LIGHTS := [
	{"duration":160,"hit_at":55,"rx":118.0,"ry":70.0,"damage":1.0,"knock":150.0},
	{"duration":175,"hit_at":62,"rx":132.0,"ry":74.0,"damage":1.25,"knock":195.0},
	{"duration":235,"hit_at":88,"rx":165.0,"ry":82.0,"damage":2.25,"knock":360.0}
]
const HEAVY := {"duration":360,"hit_at":165,"rx":190.0,"ry":92.0,"damage":3.6,"knock":470.0}

func _ready() -> void:
	var shape := CollisionShape2D.new()
	var capsule := CapsuleShape2D.new()
	capsule.radius = 27.0
	capsule.height = 82.0
	shape.shape = capsule
	shape.position = Vector2(0, 18)
	add_child(shape)
	queue_redraw()

func sync_from_state() -> void:
	max_hp = GameState.max_hp
	hp = GameState.hp
	high = GameState.high
	cash = GameState.cash
	power_mult = GameState.power_mult
	move_speed = 310.0 * GameState.speed_mult
	stats_changed.emit()

func sync_to_state() -> void:
	GameState.max_hp = max_hp
	GameState.hp = hp
	GameState.high = high
	GameState.cash = cash

func _physics_process(_delta: float) -> void:
	var now := Time.get_ticks_msec()
	z_index = int(position.y)

	if attack_kind != "":
		_update_attack(now)

	if now < stunned_until:
		velocity = velocity.move_toward(Vector2.ZERO, 34.0)
		move_and_slide()
		queue_redraw()
		return

	var move := Input.get_vector("move_left","move_right","move_up","move_down")
	if move.x != 0.0:
		facing = sign(move.x)

	if attack_kind == "":
		velocity = Vector2(move.x * move_speed, move.y * move_speed * 0.72)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, 22.0)

	if Input.is_action_just_pressed("dash"):
		dash(move)
	if Input.is_action_just_pressed("attack_light"):
		request_attack("light")
	if Input.is_action_just_pressed("attack_heavy"):
		request_attack("heavy")

	move_and_slide()
	position.y = clamp(position.y, ChapterData.FLOOR_TOP + 40.0, ChapterData.FLOOR_BOTTOM - 12.0)
	queue_redraw()

func request_attack(kind: String) -> void:
	var now := Time.get_ticks_msec()
	if now < stunned_until:
		return
	if attack_kind != "":
		queued_attack = kind
		queue_until = now + 220
		return
	if kind == "light":
		_start_light(now)
	else:
		_start_heavy(now)

func _start_light(now: int) -> void:
	attack_step = (attack_step % 3) + 1 if now - last_light_at < 440 else 1
	last_light_at = now
	attack_started_at = now
	attack_hit_done = false
	attack_kind = "light"
	velocity.x = facing * [105.0, 125.0, 170.0][attack_step - 1]
	queue_redraw()

func _start_heavy(now: int) -> void:
	attack_started_at = now
	attack_hit_done = false
	attack_kind = "heavy"
	velocity.x = facing * 75.0
	queue_redraw()

func _update_attack(now: int) -> void:
	var data: Dictionary = HEAVY if attack_kind == "heavy" else LIGHTS[attack_step - 1]
	var elapsed := now - attack_started_at
	if not attack_hit_done and elapsed >= int(data.hit_at):
		attack_hit_done = true
		var damage := float(data.damage) * power_mult
		if attack_kind == "heavy" and high >= 100.0:
			damage *= 1.75
			high = 45.0
		attack_window.emit(global_position, facing, float(data.rx) + 34.0, float(data.ry) + 16.0, damage, float(data.knock) * 1.25)
		else:
			attack_window.emit(global_position, facing, float(data.rx), float(data.ry), damage, float(data.knock))
		stats_changed.emit()

	if elapsed >= int(data.duration):
		attack_kind = ""
		var next := queued_attack if queue_until >= now else ""
		queued_attack = ""
		queue_until = 0
		if next != "":
			request_attack(next)
	queue_redraw()

func dash(input_dir: Vector2) -> void:
	var now := Time.get_ticks_msec()
	if now < dash_ready_at or now < stunned_until:
		return
	var dir := input_dir.normalized()
	if dir == Vector2.ZERO:
		dir = Vector2(facing, 0)
	dash_ready_at = now + 520
	invulnerable_until = now + 220
	velocity = Vector2(dir.x * 670.0, dir.y * 470.0)
	if dir.x != 0:
		facing = sign(dir.x)
	var tween := create_tween()
	tween.tween_property(self, "modulate:a", 0.42, 0.06)
	tween.tween_property(self, "modulate:a", 1.0, 0.17)

func take_damage(amount: float, source_x: float) -> void:
	var now := Time.get_ticks_msec()
	if now < invulnerable_until or hp <= 0.0:
		return
	hp = max(0.0, hp - amount)
	high = max(0.0, high - 10.0)
	stunned_until = now + 260
	invulnerable_until = now + 680
	velocity = Vector2(-sign(source_x - global_position.x) * 250.0, 0)
	sync_to_state()
	stats_changed.emit()
	var tween := create_tween()
	tween.tween_property(self, "modulate", Color(1.0,0.25,0.4,1.0), 0.04)
	tween.tween_property(self, "modulate", Color.WHITE, 0.13)
	if hp <= 0.0:
		knocked_out.emit()

func reward_hit(amount: float, cash_gain: int = 0) -> void:
	high = min(100.0, high + amount)
	cash += cash_gain
	sync_to_state()
	stats_changed.emit()

func heal(amount: float) -> void:
	hp = min(max_hp, hp + amount)
	sync_to_state()
	stats_changed.emit()

func _draw() -> void:
	# New v5 art language: graphic comic silhouettes, not old sprite sheets.
	draw_ellipse(Vector2(0,55), Vector2(42,11), Color(0,0,0,0.38))
	var accent := Color("#ff2b9f")
	var cyan := Color("#22e2e0")
	var skin := Color("#d6a07f")
	var body := Color("#171219")
	var punch_offset := 0.0
	if attack_kind == "light":
		punch_offset = [25.0,38.0,58.0][max(0,attack_step-1)] * facing
	elif attack_kind == "heavy":
		punch_offset = 72.0 * facing

	# coat/body
	draw_polygon(PackedVector2Array([Vector2(-24,-18),Vector2(24,-18),Vector2(34,42),Vector2(-32,42)]),PackedColorArray([body]))
	draw_line(Vector2(-22,-8),Vector2(-34,35),accent,7.0)
	draw_line(Vector2(22,-8),Vector2(34 + punch_offset,20),cyan,8.0)
	# legs
	draw_line(Vector2(-12,38),Vector2(-18,74),Color("#29202e"),12.0)
	draw_line(Vector2(12,38),Vector2(18,74),Color("#29202e"),12.0)
	# head + hair
	draw_circle(Vector2(0,-42),22.0,skin)
	draw_arc(Vector2(0,-45),24.0,PI,TAU,24,Color("#120f16"),12.0)
	# face mark and collar
	draw_line(Vector2(-8,-44),Vector2(8,-44),Color("#4b2432"),2.0)
	draw_line(Vector2(-18,-14),Vector2(0,3),accent,3.0)
	draw_line(Vector2(18,-14),Vector2(0,3),cyan,3.0)
	# fist
	draw_circle(Vector2(34 + punch_offset,20),7.5,skin)
	# attack arc
	if attack_kind != "":
		var r := 72.0 if attack_kind=="heavy" else 55.0
		var from := -0.7 if facing>0 else PI-0.7
		var to := 0.7 if facing>0 else PI+0.7
		draw_arc(Vector2(18*facing,5),r,from,to,22,Color(accent,0.65),5.0)

func draw_ellipse(center: Vector2, radius: Vector2, color: Color) -> void:
	var pts := PackedVector2Array()
	for i in range(24):
		var a := TAU * float(i) / 24.0
		pts.append(center + Vector2(cos(a)*radius.x,sin(a)*radius.y))
	draw_colored_polygon(pts,color)
