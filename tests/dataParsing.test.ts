import { describe, expect, it } from "vitest";
import { parseCsv } from "../src/data/csv";
import { extractLatLngFromGoogleMapsUrl } from "../src/data/googleMapsLink";
import { parseCourtBreakdown, resolveCourtCount } from "../src/utils/parseCourtBreakdown";

describe("parseCsv", () => {
  it("liest Kopfzeile und Zeilen und entfernt Leerraum", () => {
    expect(parseCsv("Projektname, Ort ,Courts\n Anlage A ,Berlin,4\n")).toEqual([
      { Projektname: "Anlage A", Ort: "Berlin", Courts: "4" },
    ]);
  });

  it("erkennt Semikolon als Trennzeichen", () => {
    expect(parseCsv("Projektname;Ort\nAnlage A;Berlin")).toEqual([
      { Projektname: "Anlage A", Ort: "Berlin" },
    ]);
  });

  it("behält Trennzeichen, Zeilenumbrüche und escapte Anführungszeichen in Feldern", () => {
    const csv = 'Projektname,Beschreibung\n"Anlage A, Nord","Zeile 1\nZeile 2 ""Zitat"""\n';
    expect(parseCsv(csv)).toEqual([
      { Projektname: "Anlage A, Nord", Beschreibung: 'Zeile 1\nZeile 2 "Zitat"' },
    ]);
  });

  it("überspringt leere Zeilen und verarbeitet CRLF", () => {
    expect(parseCsv("Projektname,Ort\r\nAnlage A,Berlin\r\n,\r\nAnlage B,Köln\r\n")).toEqual([
      { Projektname: "Anlage A", Ort: "Berlin" },
      { Projektname: "Anlage B", Ort: "Köln" },
    ]);
  });

  it("füllt fehlende Zellen mit leerem Text", () => {
    expect(parseCsv("Projektname,Ort,Courts\nAnlage A")).toEqual([
      { Projektname: "Anlage A", Ort: "", Courts: "" },
    ]);
  });

  it("liefert für leeren Text keine Zeilen", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("extractLatLngFromGoogleMapsUrl", () => {
  it("bevorzugt die Pin-Position (!3d/!4d) vor dem Kartenausschnitt (@)", () => {
    const url =
      "https://www.google.com/maps/place/Ort/@50.1,8.1,10z/data=!3m1!4b1!4m6!3d51.1657!4d10.4515";
    expect(extractLatLngFromGoogleMapsUrl(url)).toEqual({ latitude: 51.1657, longitude: 10.4515 });
  });

  it("liest Koordinaten aus dem @-Muster", () => {
    expect(
      extractLatLngFromGoogleMapsUrl("https://www.google.com/maps/@51.1657,10.4515,17z"),
    ).toEqual({ latitude: 51.1657, longitude: 10.4515 });
  });

  it("liest Koordinaten aus dem q-Parameter, auch negative", () => {
    expect(extractLatLngFromGoogleMapsUrl("https://maps.google.com/?q=-33.8688,-70.6693")).toEqual({
      latitude: -33.8688,
      longitude: -70.6693,
    });
  });

  it("liefert null für Kurzlinks ohne Koordinaten", () => {
    expect(extractLatLngFromGoogleMapsUrl("https://maps.app.goo.gl/AbCdEf123")).toBeNull();
  });
});

describe("parseCourtBreakdown", () => {
  it("erkennt die Anzahl mit x, × und ohne Trennzeichen", () => {
    expect(parseCourtBreakdown("5x High Competition, 4× AFP; 1 adidas HIGH COMPETITION")).toEqual([
      { count: 5, label: "High Competition" },
      { count: 4, label: "AFP" },
      { count: 1, label: "adidas HIGH COMPETITION" },
    ]);
  });

  it("lässt Modelle ohne führende Zahl ohne Anzahl", () => {
    expect(parseCourtBreakdown("adidas PANOARENA 180°, AFP")).toEqual([
      { label: "adidas PANOARENA 180°" },
      { label: "AFP" },
    ]);
  });

  it("liefert für fehlende Angaben eine leere Liste", () => {
    expect(parseCourtBreakdown(undefined)).toEqual([]);
    expect(parseCourtBreakdown(" ; , ")).toEqual([]);
  });
});

describe("resolveCourtCount", () => {
  it("nimmt den Wert der Spalte Courts, auch wenn Court-Typ abweicht", () => {
    expect(resolveCourtCount(4, "2 AFP; 2 AFP SINGLE; 4 PERIMETRICAL LIGHTNING")).toBe(4);
    expect(resolveCourtCount(0, "3 AFP")).toBe(0);
  });

  it("summiert ersatzweise die Stückzahlen aus Court-Typ", () => {
    expect(resolveCourtCount(undefined, "5x High Competition, 4x AFP, Single")).toBe(9);
  });

  it("liefert 0, wenn weder Courts noch Stückzahlen vorhanden sind", () => {
    expect(resolveCourtCount(undefined, "adidas PANOARENA 180°")).toBe(0);
    expect(resolveCourtCount(undefined, undefined)).toBe(0);
  });
});
