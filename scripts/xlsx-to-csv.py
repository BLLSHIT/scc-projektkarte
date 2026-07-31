#!/usr/bin/env python3
"""
Wandelt die lokale Projekt-Excel-Datei (Tabellenblatt "Projekte") in
public/data/projects.csv um.

Nutzung:
    python3 scripts/xlsx-to-csv.py [Pfad-zur-xlsx]

Ohne Argument wird SCC_Courts_Projekte_Vorlage.xlsx im Projekt-Root erwartet.
Nach dem Ausführen: Änderungen committen und pushen (oder die generierte CSV
manuell über die GitHub-Weboberfläche hochladen — siehe src/config/dataSource.ts).
"""
import csv
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
xlsx_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "SCC_Courts_Projekte_Vorlage.xlsx"
csv_path = ROOT / "public" / "data" / "projects.csv"

wb = openpyxl.load_workbook(xlsx_path, data_only=True)
ws = wb["Projekte"]

rows = list(ws.iter_rows(values_only=True))
header = [str(cell).strip() if cell is not None else "" for cell in rows[0]]

with csv_path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(header)
    for row in rows[1:]:
        if all(cell is None or str(cell).strip() == "" for cell in row):
            continue
        writer.writerow(["" if cell is None else cell for cell in row])

print(f"Geschrieben: {csv_path}")
