import pypdfium2 as pdf
from pypdf import PdfReader
path=r'C:\Users\VEERAIAH\Downloads\fullpage_snapshot_192_168_0_158_2026-10-21-12-31-33.pdf'
r=PdfReader(path)
print('pages',len(r.pages))
for p in r.pages: print(p.extract_text())
doc=pdf.PdfDocument(path)
for i in range(len(doc)): doc[i].render(scale=1).to_pil().save('work/reference-'+str(i)+'.png')
