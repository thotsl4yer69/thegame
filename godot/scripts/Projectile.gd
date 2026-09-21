class_name ClubProjectile
extends Area2D

var velocity := Vector2.ZERO
var damage := 8.0
var lifetime := 2.0

func setup(origin: Vector2, target: Vector2, amount: float) -> void:
	global_position = origin
	damage = amount
	velocity = (target-origin).normalized()*430.0
	var shape := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = 10.0
	shape.shape = circle
	add_child(shape)
	body_entered.connect(_on_body_entered)
	queue_redraw()

func _physics_process(delta: float) -> void:
	global_position += velocity*delta
	rotation += delta*7.0
	lifetime -= delta
	if lifetime <= 0.0:
		queue_free()

func _on_body_entered(body: Node) -> void:
	if body is PlayerFighter:
		body.take_damage(damage,global_position.x)
		queue_free()

func _draw() -> void:
	draw_circle(Vector2.ZERO,9.0,Color("#23e0dc"))
	draw_line(Vector2(-12,0),Vector2(12,0),Color("#ffffff"),2.0)
