extends Node2D

signal broken(prop: Node, cash_reward: int, high_reward: float)

var hp := 2.0
var cash_reward := 20
var high_reward := 4.0
var prop_kind := "table"
var accent := Color("#ff2b9f")
var broken_state := false

func setup(kind: String, color: Color, health := 2.0, cash := 20, high := 4.0) -> void:
	prop_kind = kind
	accent = color
	hp = health
	cash_reward = cash
	high_reward = high
	queue_redraw()

func receive_hit(amount: float, _knockback: float, _from_x: float) -> void:
	if broken_state:
		return
	hp -= amount
	var tween := create_tween()
	tween.tween_property(self,"modulate",Color.WHITE*1.5,0.04)
	tween.tween_property(self,"modulate",Color.WHITE,0.08)
	if hp <= 0.0:
		_break()

func _break() -> void:
	broken_state = true
	broken.emit(self,cash_reward,high_reward)
	var tween := create_tween()
	tween.parallel().tween_property(self,"rotation",randf_range(-0.4,0.4),0.18)
	tween.parallel().tween_property(self,"scale",Vector2(1.2,0.45),0.18)
	tween.parallel().tween_property(self,"modulate:a",0.0,0.22)
	tween.tween_callback(queue_free)

func _draw() -> void:
	match prop_kind:
		"table":
			draw_rect(Rect2(-52,-15,104,28),Color("#25111f"))
			draw_line(Vector2(-36,12),Vector2(-42,55),Color("#0d090d"),10.0)
			draw_line(Vector2(36,12),Vector2(42,55),Color("#0d090d"),10.0)
			draw_line(Vector2(-52,-15),Vector2(52,-15),accent,4.0)
		"bottles":
			for i in range(5):
				var x := -36.0 + float(i)*18.0
				draw_rect(Rect2(x,-36,11,38),Color("#184033"))
				draw_rect(Rect2(x+3,-45,5,10),Color("#4aa588"))
			draw_rect(Rect2(-52,3,104,15),Color("#4a2731"))
		"speaker":
			draw_rect(Rect2(-38,-68,76,126),Color("#111116"))
			draw_circle(Vector2(0,-28),22,Color("#25232c"))
			draw_circle(Vector2(0,26),30,Color("#25232c"))
			draw_arc(Vector2(0,26),30,0,TAU,32,accent,3.0)
		"chips":
			for i in range(5):
				draw_rect(Rect2(-45+float(i)*18,-10-float(i%2)*8,14,35+float(i%2)*8),Color("#d8b33c"))
			draw_rect(Rect2(-58,25,116,12),Color("#241608"))
		"light":
			draw_line(Vector2(0,-75),Vector2(0,30),Color("#7a7782"),7.0)
			draw_circle(Vector2(0,-82),22,accent)
			draw_circle(Vector2(0,-82),48,Color(accent,0.12))
		"kebab":
			draw_rect(Rect2(-60,-45,120,86),Color("#3a2010"))
			draw_rect(Rect2(-50,-35,100,42),Color("#ff9b43"))
			draw_line(Vector2(-48,15),Vector2(48,15),Color("#f6d67f"),5.0)
		_:
			draw_rect(Rect2(-40,-30,80,60),accent)
