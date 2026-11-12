package main

import "testing"

func TestElapsedMinutes(t *testing.T) {
	got := elapsedMinutes("2026-11-03T08:15:00-06:00", "2026-11-03T10:45:00-06:00")
	if got != 150 {
		t.Fatalf("elapsedMinutes = %d; want 150", got)
	}
}

func TestUpsertRouteCostUsesOdometerDistance(t *testing.T) {
	s := &Server{state: map[string]interface{}{
		"settings": map[string]interface{}{
			"fuelPrice":           32.0,
			"moto125KmPerGallon":  80.0,
			"depreciationPerKm":   0.50,
		},
		"fuel": []interface{}{},
	}}
	s.upsertRouteCostLocked("m1", "2026-11-03", "AM", 20, 1000, 1020)
	rows := s.state["fuel"].([]interface{})
	if len(rows) != 1 {
		t.Fatalf("fuel rows = %d; want 1", len(rows))
	}
	r := rows[0].(map[string]interface{})
	if got := numberValue(r["kmReal"]); got != 20 {
		t.Fatalf("kmReal = %v; want 20", got)
	}
	if got := numberValue(r["amount"]); got != 8 {
		t.Fatalf("fuel amount = %v; want 8", got)
	}
	if got := numberValue(r["depreciation"]); got != 10 {
		t.Fatalf("depreciation = %v; want 10", got)
	}
	if got := numberValue(r["total"]); got != 18 {
		t.Fatalf("total = %v; want 18", got)
	}

	// Reclosing the same route updates the accounting row instead of duplicating it.
	s.upsertRouteCostLocked("m1", "2026-11-03", "AM", 24, 1000, 1024)
	rows = s.state["fuel"].([]interface{})
	if len(rows) != 1 {
		t.Fatalf("fuel rows after update = %d; want 1", len(rows))
	}
	if got := numberValue(rows[0].(map[string]interface{})["kmReal"]); got != 24 {
		t.Fatalf("updated kmReal = %v; want 24", got)
	}
}
