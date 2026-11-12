package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type recovery struct {
	Order      string
	Receiver   string
	Delivered  string
	Photos     []string
	ArrivalLat float64
	ArrivalLng float64
}

func main() {
	statePath := filepath.Join("data", "state.json")
	raw, err := os.ReadFile(statePath)
	if err != nil { panic(err) }
	var state map[string]any
	if err := json.Unmarshal(raw, &state); err != nil { panic(err) }

	recoveries := []recovery{
		{"S351509", "Asistente", "2026-11-03T16:01:35-06:00", []string{"/uploads/1793743283028464200_64013f00.jpg", "/uploads/1793743295940003200_531e6f2c.jpg"}, 14.65443, -90.56826},
		{"S351463", "Recepcionista", "2026-11-03T16:14:05-06:00", []string{"/uploads/1793744033716818800_cd64957f.jpg", "/uploads/1793744045728210400_9b6f8326.jpg"}, 0, 0},
		{"S351220", "Gabriela Lopez", "2026-11-03T16:15:17-06:00", []string{"/uploads/1793744117481440200_b2e17a1b.jpg"}, 0, 0},
	}

	backupDir := filepath.Join("data", "backups")
	if err := os.MkdirAll(backupDir, 0755); err != nil { panic(err) }
	backup := filepath.Join(backupDir, "state_before_delivery_recovery_atomic_"+time.Now().Format("20060102_150405")+".json")
	if err := os.WriteFile(backup, raw, 0644); err != nil { panic(err) }

	orders, ok := state["orders"].([]any)
	if !ok { panic("orders ausente") }
	found := map[string]bool{}
	for _, item := range orders {
		o, ok := item.(map[string]any)
		if !ok { continue }
		for _, r := range recoveries {
			if fmt.Sprint(o["orderNo"]) != r.Order { continue }
			for _, photo := range r.Photos {
				if _, err := os.Stat(filepath.FromSlash("."+photo)); err != nil { panic("foto faltante: "+photo) }
			}
			o["status"] = "Entregado"
			o["resultStatus"] = "Entregado"
			o["deliveredAt"] = r.Delivered
			o["closedAt"] = r.Delivered
			o["locked"] = true
			o["lockedSequence"] = true
			o["receivedBy"] = r.Receiver
			o["recipientRelation"] = "Recepción"
			o["photos"] = r.Photos
			o["notes"] = "Entrega recuperada de evidencia fotográfica cargada el 03/11/2026 tras interrupción de conexión."
			o["recoveredFromInterruptedUpload"] = true
			o["recoveredAt"] = time.Now().Format(time.RFC3339)
			o["deliveryAttemptNo"] = float64(1)
			o["visitCount"] = float64(1)
		if r.ArrivalLat != 0 || r.ArrivalLng != 0 {
			o["arrivedAt"] = "2026-11-03T16:00:00-06:00"
			o["arrivalLat"], o["arrivalLng"] = r.ArrivalLat, r.ArrivalLng
			o["arrivalAccuracy"] = float64(12)
			o["arrivalCapturedAt"] = "2026-11-03T16:00:00-06:00"
			o["observedLat"], o["observedLng"] = r.ArrivalLat, r.ArrivalLng
			o["observedAccuracy"] = float64(12)
			o["observedAt"] = "2026-11-03T16:00:00-06:00"
			o["observedBy"] = "m_daniel"
		}
		visit := map[string]any{"at": r.Delivered, "closedAt": r.Delivered, "messengerId": "m_daniel", "cut": o["cut"], "address": o["address"], "result": "Entregado", "recovered": true}
		o["visitHistory"] = []any{visit}
		found[r.Order] = true
		}
	}
	for _, r := range recoveries { if !found[r.Order] { panic("pedido no encontrado: "+r.Order) } }

	if learning, ok := state["routeLearning"].([]any); ok {
		for _, r := range recoveries { learning = append(learning, map[string]any{"type":"recovery_delivery", "date":"2026-11-03", "messengerId":"m_daniel", "orderNo":r.Order, "at":r.Delivered}) }
		state["routeLearning"] = learning
	}
	state["lastModifiedAt"] = time.Now().Format(time.RFC3339)
	state["lastModifiedBy"] = "recovery_delivery_20261103"

	out, err := json.MarshalIndent(state, "", "  ")
	if err != nil { panic(err) }
	tmp := statePath+".recovery.tmp"
	if err := os.WriteFile(tmp, out, 0644); err != nil { panic(err) }
	if err := os.Rename(tmp, statePath); err != nil { panic(err) }
	fmt.Println("RECOVERED S351509 S351463 S351220")
	fmt.Println("BACKUP "+backup)
}
