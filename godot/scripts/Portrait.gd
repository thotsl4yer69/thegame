class_name StoryPortrait
extends Control

var character := "ROXI REDLINE"
var tone := "pink"
var salem_texture: Texture2D

func setup(name: String, palette: String) -> void:
	character = name
	tone = palette
	if character == "SALEM" and ResourceLoader.exists("res://assets/salem_portrait.png"):
		salem_texture = load("res://assets/salem_portrait.png") as Texture2D
	queue_redraw()

func _draw() -> void:
	if character == "SALEM" and salem_texture:
		draw_texture_rect(salem_texture,Rect2(0,0,size.x,size.y),false)
		draw_rect(Rect2(0,0,size.x,size.y),Color(0.04,0.01,0.05,0.18))
		return
	var w := size.x
	var h := size.y
	var accent := _accent()
	var skin := Color("#d9a08b")
	var black := Color("#100d13")

	# backdrop halo
	draw_circle(Vector2(w*0.55,h*0.42),min(w,h)*0.34,Color(accent,0.12))

	# legs/body silhouette
	var cx := w*0.55
	draw_polygon(PackedVector2Array([
		Vector2(cx-62,h*0.42),Vector2(cx+62,h*0.42),
		Vector2(cx+82,h*0.78),Vector2(cx-84,h*0.78)
	]),PackedColorArray([black]))
	draw_line(Vector2(cx-35,h*0.75),Vector2(cx-56,h*0.98),black,28.0)
	draw_line(Vector2(cx+35,h*0.75),Vector2(cx+58,h*0.98),black,28.0)

	# waist straps / clubwear
	draw_line(Vector2(cx-72,h*0.57),Vector2(cx+72,h*0.57),accent,8.0)
	draw_line(Vector2(cx-55,h*0.63),Vector2(cx+45,h*0.73),Color(accent,0.8),6.0)
	draw_line(Vector2(cx+55,h*0.63),Vector2(cx-45,h*0.73),Color(accent,0.8),6.0)

	# arms
	draw_line(Vector2(cx-55,h*0.46),Vector2(cx-108,h*0.68),skin,22.0)
	draw_line(Vector2(cx+55,h*0.46),Vector2(cx+103,h*0.61),skin,22.0)

	# head
	draw_circle(Vector2(cx,h*0.31),54.0,skin)
	_draw_hair(Vector2(cx,h*0.31),black)
	# eyes / makeup
	draw_line(Vector2(cx-27,h*0.30),Vector2(cx-7,h*0.295),Color("#2a1420"),5.0)
	draw_line(Vector2(cx+7,h*0.295),Vector2(cx+27,h*0.30),Color("#2a1420"),5.0)
	draw_line(Vector2(cx-10,h*0.345),Vector2(cx+12,h*0.345),Color("#8b284b"),4.0)

	# character-specific details
	if character == "SALEM":
		# tattoos + gothic cutouts
		for y in range(int(h*0.48),int(h*0.68),18):
			draw_line(Vector2(cx-105,float(y)),Vector2(cx-80,float(y)+12),Color("#493d50"),3.0)
		draw_circle(Vector2(cx,h*0.54),18.0,Color("#26121f"))
		draw_arc(Vector2(cx,h*0.54),24.0,0,TAU,20,accent,4.0)
	elif character.begins_with("BIANCA"):
		draw_rect(Rect2(cx-78,h*0.39,156,h*0.39),Color("#e9e7ec"),false,8.0)
	elif character.begins_with("VIPER"):
		draw_line(Vector2(cx-68,h*0.43),Vector2(cx+68,h*0.72),Color("#19ead8"),6.0)
	elif character.begins_with("ROXI"):
		draw_line(Vector2(cx-75,h*0.46),Vector2(cx+75,h*0.46),Color("#ff2b9f"),10.0)

func _draw_hair(center: Vector2, color: Color) -> void:
	if character == "SALEM":
		draw_arc(center+Vector2(0,-8),68.0,PI,TAU,30,color,28.0)
		draw_line(center+Vector2(-50,-8),center+Vector2(-58,105),color,24.0)
		draw_line(center+Vector2(50,-8),center+Vector2(58,105),color,24.0)
	else:
		draw_arc(center+Vector2(0,-8),62.0,PI,TAU,30,color,24.0)
		draw_line(center+Vector2(-44,-4),center+Vector2(-52,74),color,18.0)
		draw_line(center+Vector2(44,-4),center+Vector2(52,74),color,18.0)

func _accent() -> Color:
	match tone:
		"violet": return Color("#8d45ff")
		"cyan": return Color("#23e0dc")
		"gold": return Color("#ffd33d")
		"orange": return Color("#ff7a4d")
		_: return Color("#ff2b9f")
