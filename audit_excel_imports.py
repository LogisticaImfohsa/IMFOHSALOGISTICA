import json, re, sys
from pathlib import Path
from openpyxl import load_workbook

def norm(value):
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()

def inspect(path):
    wb = load_workbook(path, read_only=True, data_only=True)
    ws = wb[wb.sheetnames[0]]
    rows = list(ws.iter_rows(values_only=True))
    header_i = next(i for i, row in enumerate(rows) if any("referencia del pedido" in norm(v) for v in row))
    headers = [norm(v) for v in rows[header_i]]
    def col(*needles):
        for i, h in enumerate(headers):
            if any(n in h for n in needles): return i
        return None
    idx = {
        "so": col("referencia del pedido"), "client": col("cliente nombre"),
        "address": col("direccion de entrega"), "product": col("nombre corto"),
        "code": col("producto referencia"), "qty": col("cant producto", "ctd de producto", "cantidad de producto"),
        "instructions": col("instrucciones")
    }
    orders, current = {}, ""
    for row in rows[header_i+1:]:
        def get(key):
            i=idx[key]
            return "" if i is None or i >= len(row) or row[i] is None else str(row[i]).strip()
        if get("so"): current=get("so").upper()
        if not re.fullmatch(r"S\d{5,8}", current): continue
        o=orders.setdefault(current,{"client":"","address":"","instructions":"","lines":[]})
        for key in ("client","address","instructions"):
            if not o[key] and get(key): o[key]=get(key)
        if get("code") or get("product"):
            o["lines"].append({"code":get("code"),"product":get("product"),"qty":get("qty")})
    return {"file":str(path),"rows":len(rows),"header_row":header_i+1,"orders":orders}

result=[inspect(Path(p)) for p in sys.argv[1:]]
print(json.dumps(result,ensure_ascii=False,indent=2))
