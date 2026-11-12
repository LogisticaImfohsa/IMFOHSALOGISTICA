import json
import re
import unicodedata
import urllib.request
import http.cookiejar
from datetime import datetime, timedelta

BASE = "http://127.0.0.1:8787"


def fold(value):
    return "".join(
        c for c in unicodedata.normalize("NFD", str(value or ""))
        if unicodedata.category(c) != "Mn"
    ).upper()


def date_from(value, fallback=None):
    match = re.search(r"(20\d{2})[-/]?(\d{2})[-/]?(\d{2})", str(value or ""))
    if match:
        return datetime(int(match.group(1)), int(match.group(2)), int(match.group(3)))
    return fallback


def clock(hour, minute=0, ampm=""):
    hour, minute = int(hour), int(minute or 0)
    ampm = (ampm or "").upper()
    if ampm == "PM" and hour < 12:
        hour += 12
    if ampm == "AM" and hour == 12:
        hour = 0
    return f"{hour:02d}:{minute:02d}"


def interpret(instruction, anchor):
    raw = re.sub(r"\s+", " ", str(instruction or "")).strip()
    text = fold(raw)
    result = {
        "anchorDate": anchor.strftime("%Y-%m-%d"), "requestedDate": "",
        "shift": "", "windowStart": "", "windowEnd": "", "routeHint": "",
        "explicit": False, "source": "Fecha operativa seleccionada",
    }
    dates = []
    for match in re.finditer(r"\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}|\d{2}))?\b", text):
        year = int(match.group(3)) if match.group(3) else anchor.year
        if year < 100:
            year += 2000
        try:
            dates.append(datetime(year, int(match.group(2)), int(match.group(1))))
        except ValueError:
            pass
    target = None
    tomorrow = re.search(r"\b(?:EL\s+DIA\s+DE\s+MANANA|DIA\s+DE\s+MANANA|(?:ENTREGAR|LLEVAR|ENVIAR|PARA)\s+MANANA|MANANA\s+(?:AM|PM|POR\s+LA\s+TARDE))\b", text)
    if tomorrow:
        target = (dates[-1] if dates else anchor) + timedelta(days=1)
        result["source"] = "“Mañana” calculado desde la fecha contextual de la instrucción" if dates else "“Mañana” calculado desde la fecha del archivo"
        result["explicit"] = True
    elif re.search(r"\bHOY\b", text):
        target = anchor
        result["source"] = "“Hoy” calculado desde la fecha del archivo"
        result["explicit"] = True
    else:
        weekdays = {"LUNES": 0, "MARTES": 1, "MIERCOLES": 2, "JUEVES": 3, "VIERNES": 4, "SABADO": 5, "DOMINGO": 6}
        hit = next((name for name in weekdays if re.search(rf"\b{name}\b", text)), None)
        if hit:
            target = anchor + timedelta(days=(weekdays[hit] - anchor.weekday()) % 7)
            result["source"] = f"{hit.title()} interpretado desde la fecha del archivo"
            result["explicit"] = True
        elif dates:
            target = dates[0]
            result["source"] = "Fecha explícita indicada en las instrucciones"
            result["explicit"] = True
    if target:
        result["requestedDate"] = target.strftime("%Y-%m-%d")
    window = (re.search(r"\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)[.,;]?\s*(?:A|HASTA|-)\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b", text)
              or re.search(r"\b(\d{1,2}):(\d{2})\s*(AM|PM)?\s*(?:A|HASTA|-)\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\b", text))
    if window:
        result["windowStart"] = clock(window.group(1), window.group(2), window.group(3) or window.group(6))
        result["windowEnd"] = clock(window.group(4), window.group(5), window.group(6) or window.group(3))
        result["shift"] = "VENTANA"
    elif re.search(r"\b(?:AM|POR\s+LA\s+MANANA|EN\s+LA\s+MANANA|POR\s+MANANA)\b", text):
        result["shift"] = "AM"
    elif re.search(r"\b(?:PM|POR\s+LA\s+TARDE|EN\s+LA\s+TARDE|POR\s+TARDE)\b", text):
        result["shift"] = "PM"
    route = re.search(r"\bRUTA\s*(\d+)\b", text)
    if route:
        result["routeHint"] = f"Ruta {route.group(1)}"
    return result


def suggested_cut(schedule, current, cuts):
    if schedule["windowStart"]:
        eligible = [cut for cut in cuts if cut <= schedule["windowStart"]]
        return eligible[-1] if eligible else current
    if schedule["shift"] == "PM" and "12:30" in cuts:
        return "12:30"
    if schedule["shift"] == "AM" and "08:00" in cuts:
        return "08:00"
    return current


jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
login = urllib.request.Request(
    BASE + "/api/login",
    data=json.dumps({"username": "WFUENTES", "password": "Imfohsa1234/"}).encode(),
    headers={"Content-Type": "application/json"}, method="POST",
)
opener.open(login).read()
state = json.loads(opener.open(BASE + "/api/state").read())
with open("data/backups/state_master_after_address_audit_2026-10-15_v1586.json", encoding="utf-8") as backup_file:
    backup_state = json.load(backup_file)
backup_by_so = {str(o.get("orderNo") or ""): o for o in backup_state.get("orders", [])}
restore_sos = set("S329440 S328852 S329518 S329497 S329492 S328668 S26401 S03151 S36550 S329631 S318861 S318862 S329502 S344411 S344284 S344193 S341527 S345004 S345006 S344919 S344942 S344791 S344939 S342005 S345779".split())
cuts = state.get("settings", {}).get("cuts", ["08:00", "09:30", "12:30", "14:00"])
changed = []
for order in state.get("orders", []):
    so = str(order.get("orderNo") or "")
    if so in restore_sos and so in backup_by_so:
        backup_order = backup_by_so[so]
        for field in ("date", "cut", "requestedDeliveryDate", "requestedShift", "requestedWindowStart", "requestedWindowEnd", "requestedRouteHint", "scheduleInterpretation", "scheduleAnchorDate"):
            if field in backup_order:
                order[field] = backup_order[field]
            else:
                order.pop(field, None)
    current_batch = str(order.get("importOperationDate") or "") == "2026-10-15" or "2026-10-15T" in str(order.get("sourceExcelFileName") or "")
    if not current_batch:
        continue
    instruction = str(order.get("instructions") or "").strip()
    fallback = datetime(2026, 10, 15)
    anchor = date_from(order.get("sourceExcelFileName"), fallback)
    schedule = interpret(instruction, anchor)
    before = [order.get("date"), order.get("cut"), order.get("requestedDeliveryDate"), order.get("requestedShift"), order.get("requestedWindowStart"), order.get("requestedWindowEnd"), order.get("requestedRouteHint")]
    order["date"] = schedule["requestedDate"] if schedule["requestedDate"] and schedule["explicit"] else "2026-10-15"
    order["importOperationDate"] = order.get("importOperationDate") or fallback.strftime("%Y-%m-%d")
    order["requestedDeliveryDate"] = schedule["requestedDate"] or order.get("date") or order["importOperationDate"]
    order["requestedShift"] = schedule["shift"]
    order["requestedWindowStart"] = schedule["windowStart"]
    order["requestedWindowEnd"] = schedule["windowEnd"]
    order["requestedRouteHint"] = schedule["routeHint"]
    order["scheduleInterpretation"] = schedule["source"]
    order["scheduleAnchorDate"] = schedule["anchorDate"]
    order["instructionOriginal"] = instruction
    order["cut"] = suggested_cut(schedule, order.get("cut") or "08:00", cuts)
    after = [order.get("date"), order.get("cut"), order.get("requestedDeliveryDate"), order.get("requestedShift"), order.get("requestedWindowStart"), order.get("requestedWindowEnd"), order.get("requestedRouteHint")]
    if before != after:
        changed.append({"so": order.get("orderNo"), "before": before, "after": after})

state["instructionScheduleVersion"] = 82228
state["instructionScheduleMigratedAt"] = datetime.now().isoformat()
request = urllib.request.Request(
    BASE + "/api/state", data=json.dumps(state, ensure_ascii=False).encode("utf-8"),
    headers={"Content-Type": "application/json; charset=utf-8"}, method="PUT",
)
response = json.loads(opener.open(request).read())
print(json.dumps({"savedVersion": response.get("version"), "changed": changed}, ensure_ascii=False))
