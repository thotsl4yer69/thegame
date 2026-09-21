class_name EnemyFighter
extends CharacterBody2D

signal died(enemy: Node)
signal projectile_requested(origin: Vector2, target: Vector2, damage: float)

var target: CharacterBody2D
var archetype := "rush"
var display_name := "PROBLEM"
var accent := Color("#ffcc33")
var max_hp := 6.0
var hp := 6.0
var damage := 9.0
var move_speed := 130.0
var boss := false
var phase := 1

var state := "approach"
var attack_at := 0
var cooldown_until := 0
var stun_until := 0
var special_at := 0
var slot_offset := Vector2.ZERO
var dead := false

func setup(player: CharacterBody2D, style: String, name: String, color: Color, is_boss := false, slot := 0) -> void:
	target = player
	archetype = style
	display_name = name
	accent = color
	boss = is_boss
	max_hp = (26.0 if boss else (10.0 if style=="heavy" else 6.0))
	hp = max_hp
	damage = 15.0 if boss else (12.0 if style=="heavy" else 8.0)
	move_speed = 112.0 if style=="heavy" else (155.0 if style=="rush" else 125.0)
	slot_offset = Vector2((90.0 + float(slot/2)*48.0) * (1.0 if slot%2==0 else -1.0), float((slot%3)-1)*52.0)
	special_at = Time.get_ticks_msec() + 3000
	var shape := CollisionShape2D.new()
	var capsule := CapsuleShape2D.new()
	capsule.radius = 26.0
	capsule.height = 80.0
	shape.shape = capsule
	shape.position = Vector2(0,17)
	add_child(shape)
	queue_redraw()

func _physics_process(_delta: float) -> void:
	if dead or not is_instance_valid(target):
		return
	var now := Time.get_ticks_msec()
	z_index = int(position.y)

	if now < stun_until:
		state = "stunned"
		velocity = velocity.move_toward(Vector2.ZERO, 28.0)
		move_and_slide()
		queue_redraw()
		return
	elif state == "stunned":
		state = "approach"

	var delta_to_player: Vector2 = target.global_position - global_position
	var ax: float = absf(delta_to_player.x)
	var ay: float = absf(delta_to_player.y)

	if state == "telegraph":
		velocity = Vector2.ZERO
		if now >= attack_at:
			_resolve_attack(delta_to_player)
		queue_redraw()
		return

	if state == "recover":
		velocity = velocity.move_toward(Vector2.ZERO, 20.0)
		if now >= cooldown_until:
			state = "approach"
		move_and_slide()
		queue_redraw()
		return

	if boss and phase == 2 and now >= special_at:
		_start_special(now)
		queue_redraw()
		return

	var desired: Vector2 = target.global_position + slot_offset
	var to_slot: Vector2 = desired - global_position
	var ranged_ready: bool = archetype == "ranged" and ax < 430.0 and ax > 140.0 and ay < 95.0
	var melee_ready: bool = ax < (145.0 if archetype=="heavy" else 108.0) and ay < (92.0 if archetype=="heavy" else 70.0)

	if now >= cooldown_until and (ranged_ready or melee_ready):
		state = "telegraph"
		attack_at = now + (560 if archetype=="heavy" else 430 if archetype=="ranged" else 290)
		velocity = Vector2.ZERO
	else:
		var dir: Vector2 = to_slot.normalized()
		velocity = Vector2(dir.x * move_speed, dir.y * move_speed * 0.72)
		move_and_slide()
	queue_redraw()

func _resolve_attack(delta_to_player: Vector2) -> void:
	var now := Time.get_ticks_msec()
	if archetype == "ranged":
		projectile_requested.emit(global_position + Vector2(0,-20), target.global_position, damage * 0.8)
	else:
		var range_x: float = 155.0 if archetype=="heavy" else 118.0
		var range_y: float = 92.0 if archetype=="heavy" else 72.0
		if abs(delta_to_player.x) <= range_x and abs(delta_to_player.y) <= range_y:
			target.call("take_damage",damage * (1.12 if archetype=="heavy" else 1.0), global_position.x)
		velocity.x = sign(delta_to_player.x) * (220.0 if archetype=="rush" else 145.0)
	state = "recover"
	cooldown_until = now + (860 if archetype=="heavy" else 620)

func _start_special(now: int) -> void:
	state = "telegraph"
	attack_at = now + 620
	special_at = now + 3300
	accent = Color("#ff315e")

func receive_hit(amount: float, knockback: float, from_x: float) -> void:
	if dead:
		return
	hp -= amount
	stun_until = Time.get_ticks_msec() + (120 if boss else 230)
	velocity = Vector2(sign(global_position.x-from_x)*knockback, randf_range(-35,35))
	if boss and phase == 1 and hp <= max_hp * 0.5:
		phase = 2
		move_speed *= 1.18
		damage *= 1.12
		special_at = Time.get_ticks_msec() + 650
	if hp <= 0.0:
		_die()
	queue_redraw()

func _die() -> void:
	dead = true
	set_physics_process(false)
	died.emit(self)
	var tween := create_tween()
	tween.parallel().tween_property(self,"modulate:a",0.0,0.26)
	tween.parallel().tween_property(self,"rotation",randf_range(-0.35,0.35),0.26)
	tween.tween_callback(queue_free)

func _draw() -> void:
	draw_ellipse(Vector2(0,55),Vector2(40,10),Color(0,0,0,0.36))
	var dark := Color("#151019")
	var skin := Color("#c98f77")
	var scale_boost: float = 1.15 if boss else 1.0

	draw_polygon(PackedVector2Array([
		Vector2(-24,-18)*scale_boost,Vector2(24,-18)*scale_boost,
		Vector2(30,42)*scale_boost,Vector2(-30,42)*scale_boost
	]),PackedColorArray([dark]))
	draw_line(Vector2(-18,-8),Vector2(-34,28),accent,7.0)
	draw_line(Vector2(18,-8),Vector2(34,28),accent,7.0)
	draw_line(Vector2(-11,38),Vector2(-17,72),Color("#2b2030"),11.0)
	draw_line(Vector2(11,38),Vector2(17,72),Color("#2b2030"),11.0)
	draw_circle(Vector2(0,-42),21.0*scale_boost,skin)
	draw_arc(Vector2(0,-45),23.0*scale_boost,PI,TAU,22,Color("#100d14"),11.0)

	if archetype=="heavy":
		draw_rect(Rect2(-31,-5,62,20),Color(accent,0.42),false,4.0)
	elif archetype=="ranged":
		draw_circle(Vector2(34,20),8.0,Color("#23e0dc"))
	elif archetype=="rush":
		draw_line(Vector2(-24,-10),Vector2(24,28),Color("#ff315e"),4.0)

	if state=="telegraph":
		var remain: int = maxi(0,attack_at-Time.get_ticks_msec())
		var total: float = 560.0 if archetype=="heavy" else 430.0 if archetype=="ranged" else 290.0
		var p: float = 1.0 - float(remain)/total
		draw_arc(Vector2(0,54),52.0+p*34.0,0,TAU,40,Color(accent,0.75),5.0)

	if boss:
		var ratio: float = maxf(0.0,hp/max_hp)
		draw_rect(Rect2(-48,-96,96,8),Color("#160713"))
		draw_rect(Rect2(-46,-94,92*ratio,4),accent)

func draw_ellipse(center: Vector2, radius: Vector2, color: Color) -> void:
	var pts := PackedVector2Array()
	for i in range(24):
		var a := TAU * float(i) / 24.0
		pts.append(center + Vector2(cos(a)*radius.x,sin(a)*radius.y))
	draw_colored_polygon(pts,color)
