extends Node

const SAVE_PATH := "user://thotsl4yer69_v5_save.json"

var chapter_index: int = 0
var hp: float = 100.0
var max_hp: float = 100.0
var high: float = 0.0
var cash: int = 0
var score: int = 0
var rizz: int = 20
var heat: int = 0
var debt: int = 0
var thot_meter: int = 15
var power_mult: float = 1.0
var speed_mult: float = 1.0
var route_by_chapter: Dictionary = {}
var completed_chapters: Array[int] = []

func reset_story() -> void:
	chapter_index = 0
	hp = 100.0
	max_hp = 100.0
	high = 0.0
	cash = 0
	score = 0
	rizz = 20
	heat = 0
	debt = 0
	thot_meter = 15
	power_mult = 1.0
	speed_mult = 1.0
	route_by_chapter.clear()
	completed_chapters.clear()
	save()

func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)

func clear_save() -> void:
	var absolute := ProjectSettings.globalize_path(SAVE_PATH)
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(absolute)

func save() -> void:
	var payload := {
		"chapter_index": chapter_index,
		"hp": hp,
		"max_hp": max_hp,
		"high": high,
		"cash": cash,
		"score": score,
		"rizz": rizz,
		"heat": heat,
		"debt": debt,
		"thot_meter": thot_meter,
		"power_mult": power_mult,
		"speed_mult": speed_mult,
		"route_by_chapter": route_by_chapter,
		"completed_chapters": completed_chapters
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(payload))

func load_save() -> bool:
	if not has_save():
		return false
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return false
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return false
	chapter_index = int(parsed.get("chapter_index", 0))
	hp = float(parsed.get("hp", 100.0))
	max_hp = float(parsed.get("max_hp", 100.0))
	high = float(parsed.get("high", 0.0))
	cash = int(parsed.get("cash", 0))
	score = int(parsed.get("score", 0))
	rizz = int(parsed.get("rizz", 20))
	heat = int(parsed.get("heat", 0))
	debt = int(parsed.get("debt", 0))
	thot_meter = int(parsed.get("thot_meter", 15))
	power_mult = float(parsed.get("power_mult", 1.0))
	speed_mult = float(parsed.get("speed_mult", 1.0))
	route_by_chapter = parsed.get("route_by_chapter", {})
	completed_chapters.assign(parsed.get("completed_chapters", []))
	return true

func apply_route(route: Dictionary) -> void:
	var chapter_key := str(chapter_index)
	route_by_chapter[chapter_key] = route.get("id", "main")
	var reward: Dictionary = route.get("reward", {})
	hp = min(max_hp, hp + float(reward.get("hp", 0)))
	high = clamp(high + float(reward.get("high", 0)), 0.0, 100.0)
	cash = max(0, cash + int(reward.get("cash", 0)))
	var effects: Dictionary = route.get("effects", {})
	rizz = clampi(rizz + int(effects.get("rizz", 0)), 0, 100)
	heat = clampi(heat + int(effects.get("heat", 0)), 0, 100)
	debt = max(0, debt + int(effects.get("debt", 0)))
	thot_meter = clampi(thot_meter + int(effects.get("thot", 0)), 0, 100)
	save()

func apply_upgrade(id: String) -> void:
	match id:
		"power":
			power_mult *= 1.15
		"speed":
			speed_mult *= 1.08
		"meat":
			max_hp += 18.0
			hp = min(max_hp, hp + 30.0)
		"high":
			high = min(100.0, high + 35.0)
	save()

func complete_chapter(performance_score: int, damage_taken: float) -> void:
	score += performance_score
	rizz = clampi(rizz + (4 if damage_taken < 20.0 else 0), 0, 100)
	heat = clampi(heat + mini(12, performance_score / 1200), 0, 100)
	thot_meter = clampi(thot_meter + mini(10, performance_score / 1600), 0, 100)
	if not completed_chapters.has(chapter_index):
		completed_chapters.append(chapter_index)
	chapter_index = mini(chapter_index + 1, ChapterData.CHAPTERS.size() - 1)
	save()

func ending() -> Dictionary:
	if heat >= 75:
		return {"title":"MELBOURNE REMEMBERS", "subtitle":"EVERY VENUE KNOWS YOUR FACE"}
	if debt >= 140:
		return {"title":"GOLDEN HANDCUFFS", "subtitle":"THE TAB NEVER REALLY CLOSES"}
	if rizz >= 65:
		return {"title":"CITY OF BAD IDEAS", "subtitle":"SOMEHOW YOU GOT INVITED BACK"}
	return {"title":"THE LONG WAY HOME", "subtitle":"GARLIC SAUCE • SUNRISE • SURVIVED"}
