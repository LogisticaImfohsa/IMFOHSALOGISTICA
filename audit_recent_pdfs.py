import json, re, sys
from pathlib import Path
from pypdf import PdfReader

out=[]
for name in sys.argv[1:]:
    p=Path(name)
    try:
        reader=PdfReader(p)
        pages=[]
        for i,page in enumerate(reader.pages,1):
            text=page.extract_text() or ''
            pages.append({"page":i,"chars":len(text),"orders":sorted(set(re.findall(r'(?<![A-Z0-9])S\s*[-#:]?\s*(\d{5,8})(?!\d)',text,re.I))),"preview":re.sub(r'\s+',' ',text)[:180]})
        out.append({"file":p.name,"size":p.stat().st_size,"pages":pages})
    except Exception as e:
        out.append({"file":p.name,"error":str(e)})
print(json.dumps(out,ensure_ascii=False,indent=2))
