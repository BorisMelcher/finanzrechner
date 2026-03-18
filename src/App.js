import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN-SYSTEM
// Alle visuellen Werte zentral definiert. Kein direktes #hex oder magic number
// in Komponenten — immer auf Tokens zurückgreifen.
// ─────────────────────────────────────────────────────────────────────────────

// ── Farb-Palette ─────────────────────────────────────────────────────────────
const C = {
  // Hintergründe (dunkel → hell)
  bgPage:    "#0a0f1a",   // Seiten-Hintergrund
  bgCard:    "#111827",   // Karten
  bgInput:   "#0d1724",   // Inputs, Info-Boxen
  bgInset:   "#0f1929",   // noch eine Ebene tiefer (z.B. in Cards)

  // Status-Hintergründe
  bgOk:      "#071510",   // grüner Hauch
  bgWarn:    "#130a0a",   // roter Hauch

  // Rahmen
  border:    "#1e2d3f",
  borderFocus: "#2e4a6a",

  // Texte
  textPrimary:   "#e2e8f0",
  textSecondary: "#94a3b8",
  textMuted:     "#64748b",
  textWhite:     "#ffffff",

  // Akzente (semantisch benannt)
  green:   "#22d3a0",   // Hauptakzent, positiv
  blue:    "#3b82f6",   // ETF / Info
  amber:   "#f59e0b",   // Zinsen / Warnung
  purple:  "#a78bfa",   // Gesetzlich / Fein-Tuning
  red:     "#f87171",   // Fehler / Verlust
};

// ── Topf-Farbpalette (konsistent in Cards + Charts) ──────────────────────────
const TOPF_FARBEN = [
  "#22d3a0",  // 0 grün-türkis
  "#3b82f6",  // 1 blau
  "#f59e0b",  // 2 amber
  "#a78bfa",  // 3 lila
  "#f87171",  // 4 rot
  "#34d399",  // 5 smaragd
  "#60a5fa",  // 6 hellblau
  "#fb923c",  // 7 orange
];

// ── Typografie ────────────────────────────────────────────────────────────────
const T = {
  // Schriftfamilien
  mono: "'Courier New', monospace",
  sans: "inherit",

  // Größen (konsistente Skala)
  xxs:  "0.65rem",  // Micro-Labels, Legal
  xs:   "0.72rem",  // Section-Labels, Badges
  sm:   "0.78rem",  // Sekundäre Infotexte
  md:   "0.875rem", // Body
  lg:   "1rem",     // Werte, Slider-Wert
  xl:   "1.2rem",   // Karten-Heads
  h1:   "clamp(1.6rem, 4vw, 2.4rem)",

  // Gewichte
  normal: 400,
  medium: 500,
  bold:   700,
  black:  900,
};

// ── Abstände ──────────────────────────────────────────────────────────────────
const S = {
  xs:  "0.4rem",
  sm:  "0.75rem",
  md:  "1rem",
  lg:  "1.5rem",
  xl:  "2rem",
  xxl: "2.5rem",
};

// ── Radien ────────────────────────────────────────────────────────────────────
const R = {
  sm:  "6px",
  md:  "8px",
  lg:  "12px",
  pill:"999px",
};

// ── Vordefinierte Style-Objekte (wiederverwendbare Komposita) ─────────────────
const STYLES = {
  card: {
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: R.lg,
    padding: S.lg,
  },
  cardAccented: (farbe) => ({
    background: C.bgCard,
    border: `1px solid ${farbe}33`,
    borderRadius: R.lg,
    padding: S.lg,
  }),
  infoBox: {
    background: C.bgInput,
    borderRadius: R.sm,
    padding: `${S.sm} ${S.md}`,
    fontSize: T.sm,
    color: C.textMuted,
    lineHeight: 1.6,
  },
  input: (borderColor) => ({
    width: "100%",
    background: C.bgInput,
    border: `1px solid ${borderColor ?? C.border}`,
    borderRadius: R.sm,
    padding: `0.45rem 2.2rem 0.45rem 0.7rem`,
    color: C.textPrimary,
    fontSize: T.lg,
    fontFamily: T.mono,
    fontWeight: T.bold,
    boxSizing: "border-box",
  }),
  sectionLabel: (farbe) => ({
    fontSize: T.xs,
    letterSpacing: "0.15em",
    color: farbe ?? C.green,
    textTransform: "uppercase",
    marginBottom: S.md,
    fontFamily: T.mono,
  }),
  statusOk: {
    background: C.bgOk,
    border: `1px solid ${C.green}33`,
    borderRadius: R.sm,
    padding: `${S.sm} ${S.md}`,
    fontSize: T.sm,
    color: C.green,
  },
  statusWarn: {
    background: C.bgWarn,
    border: `1px solid ${C.red}44`,
    borderRadius: R.sm,
    padding: `${S.sm} ${S.md}`,
    fontSize: T.sm,
    color: C.red,
  },
  monoValue: (farbe) => ({
    color: farbe ?? C.green,
    fontFamily: T.mono,
    fontWeight: T.bold,
  }),
};

// ── Slider-Thumb CSS — Farbe per CSS-Variable --slider-color vom Element ────
const SLIDER_CSS = `
  input[type=range] { -webkit-appearance: none; appearance: none; }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--slider-color, ${C.green});
    box-shadow: 0 0 8px color-mix(in srgb, var(--slider-color, ${C.green}) 53%, transparent);
    cursor: pointer;
  }
  input[type=range]::-moz-range-thumb {
    width: 14px; height: 14px; border-radius: 50%; border: none;
    background: var(--slider-color, ${C.green});
    box-shadow: 0 0 8px color-mix(in srgb, var(--slider-color, ${C.green}) 53%, transparent);
    cursor: pointer;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// DOMÄNEN-KONSTANTEN
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS_GESETZ = {
  teilfreistellungEtf:          30,
  basiszinsProzent:              2.0,
  vorabpauschaleKorrekturfaktor: 70,
  sparerpauschbetrag:            1000,
  abgeltungssteuer:              26.375,
};

const STEUERMODELLE = {
  etf: {
    label:        "Aktien-ETF",
    beschreibung: "Teilfreistellung (30%) + Vorabpauschale. Steuerlich günstigste Kapitalanlage.",
    icon:         "📈",
    farbe:        C.blue,
  },
  zinsen: {
    label:        "Zinsen",
    beschreibung: "Volle Abgeltungssteuer auf Zinserträge. Für Tagesgeld, Festgeld, P2P.",
    icon:         "🏦",
    farbe:        C.amber,
  },
};

const DEFAULT_TOEPFE = [
  { id: 1, name: "ETF-Depot", steuermodell: "etf",    startKapital: 10000, sparrateMonatlich: 250, rendite: 7.0, entnahmeReihenfolge: 2, ausfallrate: 0, farbe: TOPF_FARBEN[0] },
  { id: 2, name: "Zinskonto", steuermodell: "zinsen", startKapital: 5000,  sparrateMonatlich: 250, rendite: 4.0, entnahmeReihenfolge: 1, ausfallrate: 0, farbe: TOPF_FARBEN[1] },
];

let naechsteId = 3;

// ─────────────────────────────────────────────────────────────────────────────
// FORMATIERUNG
// ─────────────────────────────────────────────────────────────────────────────

const fmt = {
  euro:    (v) => `${Math.round(v).toLocaleString("de-DE")} €`,
  euroMo:  (v) => `${Math.round(v).toLocaleString("de-DE")} €/Mo.`,
  prozent: (v) => `${v}%`,
  stunden: (v) => `${v}h`,
  jahre:   (v) => `${v} Jahre`,
};

// ─────────────────────────────────────────────────────────────────────────────
// REINE HILFSFUNKTIONEN (Finanzlogik)
// ─────────────────────────────────────────────────────────────────────────────

const berechneVorabpauschale = (
  etfWertAnfang, wertsteigerungImJahr, freistellungVerfuegbar,
  steuer, teilfreistellung, basiszins, basiszinsKorrekturfaktor
) => {
  if (etfWertAnfang <= 0) return { vorabpauschale: 0, steuer: 0, freistellungVerbraucht: 0 };
  const basisertrag = basiszins * basiszinsKorrekturfaktor * etfWertAnfang;
  const vorabpauschale = Math.max(0, Math.min(basisertrag, Math.max(0, wertsteigerungImJahr)));
  const steuerpflichtigVorFrei = vorabpauschale * (1 - teilfreistellung);
  const freistellungVerbraucht = Math.min(freistellungVerfuegbar, steuerpflichtigVorFrei);
  const steuerBetrag = Math.max(0, steuerpflichtigVorFrei - freistellungVerbraucht) * steuer;
  return { vorabpauschale, steuer: steuerBetrag, freistellungVerbraucht };
};

const berechneEtfEntnahmeSteuer = (
  entnahmeBrutto, gewinnanteil, freistellungVerfuegbar, steuer, teilfreistellung
) => {
  if (gewinnanteil <= 0 || entnahmeBrutto <= 0) return { steuer: 0, freistellungVerbraucht: 0 };
  const gewinnBrutto = entnahmeBrutto * gewinnanteil;
  const steuerpflichtigVorFrei = gewinnBrutto * (1 - teilfreistellung);
  const freistellungVerbraucht = Math.min(freistellungVerfuegbar, steuerpflichtigVorFrei);
  const steuerBetrag = Math.max(0, steuerpflichtigVorFrei - freistellungVerbraucht) * steuer;
  return { steuer: steuerBetrag, freistellungVerbraucht };
};

const interpoliereNetto = (stunden, vollzeitNetto, startStunden, ankerStunden, ankerNetto) => {
  if (stunden >= startStunden) return vollzeitNetto;
  if (stunden <= 0) return 0;
  if (ankerStunden >= startStunden || ankerStunden <= 0)
    return vollzeitNetto * (stunden / startStunden);
  if (stunden >= ankerStunden) {
    const t = (stunden - ankerStunden) / (startStunden - ankerStunden);
    return ankerNetto + t * (vollzeitNetto - ankerNetto);
  }
  return stunden * (ankerNetto / ankerStunden);
};

// ─────────────────────────────────────────────────────────────────────────────
// KERN-SIMULATION
// ─────────────────────────────────────────────────────────────────────────────

const simuliere = (params) => {
  const {
    toepfe, alter, lebenserwartung, rentenalter,
    gehaltMonatlich, fixkostenMonatlich,
    startStunden, ankerStunden, ankerNettoMonatlich,
    reduktionIntervall, reduktionProSchritt, reduktionOffset, minStunden,
    inflation, gehaltszuwachs,
    freistellung, steuersatz,
    teilfreistellung, basiszins, basiszinsKorrekturfaktor,
    renteMonatlich, renteBeginnAlter, rentensteigerung,
    steuerAenderungAktiv, steuerNeu, steuerAenderungInJahren,
    fixkostenRuhestandFaktor,
    gkvBeitragMonatlich,
  } = params;

  const STEUER_BASIS = steuersatz / 100;
  const STEUER_NEU = steuerNeu / 100;
  const inf = inflation / 100;
  const gz = gehaltszuwachs / 100;
  const rs = rentensteigerung / 100;

  const fixkBasisJahrVoll = fixkostenMonatlich * 12;
  const gehaltJahr = gehaltMonatlich * 12;
  const ankerNettoJahr = ankerNettoMonatlich * 12;
  const renteJahr = renteMonatlich * 12;

  const topfState = toepfe.map(t => ({ kapital: t.startKapital, kostenbasis: t.startKapital }));
  const srJahr = toepfe.map(t => t.sparrateMonatlich * 12);
  const srGesamt = srJahr.reduce((s, v) => s + v, 0);
  const jahre = Math.max(1, lebenserwartung - alter);
  const result = [];

  // Töpfe nach Priorität in Gruppen einteilen.
  // Gleiche Prioritätszahl → gleiche Gruppe → anteilige Entnahme zum Kapital.
  const prioritaetsGruppen = (() => {
    const gruppen = new Map();
    toepfe.forEach((topf, i) => {
      const p = topf.entnahmeReihenfolge;
      if (!gruppen.has(p)) gruppen.set(p, []);
      gruppen.get(p).push(i);
    });
    return [...gruppen.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, indices]) => indices);
  })();

  for (let j = 0; j <= jahre; j++) {
    const aktuellesAlter = alter + j;
    const infFaktor = Math.pow(1 + inf, j);
    const gwf = Math.pow(1 + gz, j);

    const STEUER = steuerAenderungAktiv && j >= steuerAenderungInJahren ? STEUER_NEU : STEUER_BASIS;
    const imRuhestand = aktuellesAlter >= rentenalter;
    const gkvJahr = imRuhestand ? gkvBeitragMonatlich * 12 : 0;
    const fixkBasisJahr = imRuhestand ? fixkBasisJahrVoll * fixkostenRuhestandFaktor + gkvJahr : fixkBasisJahrVoll;
    const fixkJahr = fixkBasisJahr * infFaktor;

    const reduktionen = reduktionOffset === 0
      ? Math.floor(j / reduktionIntervall)
      : j < reduktionOffset ? 0
      : Math.floor((j - reduktionOffset) / reduktionIntervall) + 1;
    const stundenVorRente = Math.max(minStunden, startStunden - reduktionen * reduktionProSchritt);
    const stunden = imRuhestand ? 0 : stundenVorRente;

    const vollzeitNettoJahr = gehaltJahr * gwf;
    const aktAnkerNettoJahr = ankerNettoJahr * gwf;
    const arbeitseinkommenJahr = imRuhestand ? 0 : interpoliereNetto(
      stunden, vollzeitNettoJahr, startStunden, ankerStunden, aktAnkerNettoJahr
    );

    const rentenJahre = Math.max(0, aktuellesAlter - renteBeginnAlter);
    const aktRenteJahr = aktuellesAlter >= renteBeginnAlter
      ? renteJahr * Math.pow(1 + rs, rentenJahre) : 0;

    const ueberschuss = imRuhestand ? 0 : arbeitseinkommenJahr - fixkJahr;
    // Anteilige Kürzung: Wenn Überschuss < Zielsparrate, werden alle Töpfe
    // proportional zu ihrer eingestellten Sparrate gekürzt. Verhältnis bleibt stabil.
    const kuerzungsfaktor = srGesamt > 0 ? Math.min(1, Math.max(0, ueberschuss) / srGesamt) : 0;
    const aktSparrateGesamt = srGesamt * kuerzungsfaktor;
    const aktSrJahr = srJahr.map(sr => sr * kuerzungsfaktor);

    // Freibetrag: Zinsen → Vorabpauschalen → ETF-Entnahmen
    let freistellungRest = freistellung;

    const zinsErgebnisse = toepfe.map((topf, i) => {
      if (topf.steuermodell !== "zinsen") return { zinsNetto: 0, steuer: 0, ausfallKapital: 0 };
      const kap = topfState[i].kapital;
      const ausfallKapital = kap * (topf.ausfallrate / 100);
      const kapNachAusfall = Math.max(0, kap - ausfallKapital);
      const zinsBrutto = kapNachAusfall * (topf.rendite / 100);
      const frei = Math.min(zinsBrutto, freistellungRest);
      freistellungRest = Math.max(0, freistellungRest - frei);
      const steuer = Math.max(0, zinsBrutto - frei) * STEUER;
      return { zinsNetto: zinsBrutto - steuer, steuer, ausfallKapital };
    });

    const vapErgebnisse = toepfe.map((topf, i) => {
      if (topf.steuermodell !== "etf") return { vorabpauschale: 0, steuer: 0, freistellungVerbraucht: 0 };
      const kap = topfState[i].kapital;
      const wertsteigerung = kap * (topf.rendite / 100);
      const vap = berechneVorabpauschale(
        kap, wertsteigerung, freistellungRest,
        STEUER, teilfreistellung, basiszins, basiszinsKorrekturfaktor
      );
      freistellungRest = Math.max(0, freistellungRest - vap.freistellungVerbraucht);
      return vap;
    });

    // Fehlbetrag = nur was für Fixkosten fehlt. Gekürzte Sparrate ist kein Fehlbetrag —
    // wer weniger verdient, spart einfach weniger, greift aber nicht aufs Portfolio.
    const fehlbetragEinkommen = Math.max(0, fixkJahr - (arbeitseinkommenJahr + aktRenteJahr));
    let restFehlbetrag = fehlbetragEinkommen;

    const entnahmeErgebnisse = toepfe.map(() => ({ brutto: 0, steuer: 0 }));

    // Gruppen sequenziell abarbeiten. Innerhalb einer Gruppe: anteilig zum
    // aktuellen Kapital, iterativ neu verteilen wenn ein Topf leer läuft.
    for (const gruppe of prioritaetsGruppen) {
      if (restFehlbetrag <= 0) break;

      // Aktive Töpfe der Gruppe (Kapital > 0)
      let aktiv = gruppe.filter(i => topfState[i].kapital > 0);

      while (restFehlbetrag > 0.01 && aktiv.length > 0) {
        const kapGesamt = aktiv.reduce((s, i) => s + topfState[i].kapital, 0);
        if (kapGesamt <= 0) break;

        let restNachRunde = restFehlbetrag;
        const erschoepft = [];

        for (const i of aktiv) {
          const topf = toepfe[i];
          const kap = topfState[i].kapital;
          // Anteil dieses Topfes am Gruppenkapital
          const anteil = kap / kapGesamt;
          const zielNetto = restFehlbetrag * anteil;

          if (topf.steuermodell === "zinsen") {
            const brutto = Math.min(zielNetto, kap);
            entnahmeErgebnisse[i].brutto += brutto;
            restNachRunde -= brutto;
            if (brutto >= kap - 0.01) erschoepft.push(i);
          } else {
            const kb = Math.min(kap, topfState[i].kostenbasis);
            const gewinnanteil = kap > kb ? (kap - kb) / kap : 0;
            const effSteuer = gewinnanteil * (1 - teilfreistellung) * STEUER;
            const bruttoZiel = effSteuer < 1 ? zielNetto / (1 - effSteuer) : zielNetto;
            const brutto = Math.min(bruttoZiel, kap);
            const { steuer, freistellungVerbraucht } = berechneEtfEntnahmeSteuer(
              brutto, gewinnanteil, freistellungRest, STEUER, teilfreistellung
            );
            // freistellungVerbraucht direkt aus der Funktion — keine doppelte Berechnung
            freistellungRest = Math.max(0, freistellungRest - freistellungVerbraucht);
            entnahmeErgebnisse[i].brutto += brutto;
            entnahmeErgebnisse[i].steuer += steuer;
            restNachRunde -= (brutto - steuer);
            if (brutto >= kap - 0.01) erschoepft.push(i);
          }
        }

        restFehlbetrag = Math.max(0, restNachRunde);
        // Erschöpfte Töpfe aus der nächsten Runde entfernen
        aktiv = aktiv.filter(i => !erschoepft.includes(i));
      }
    }

    const gesamtEntnahmeNetto = entnahmeErgebnisse.reduce((s, e) => s + e.brutto - e.steuer, 0);
    const gesamtSteuer = [
      ...zinsErgebnisse.map(z => z.steuer),
      ...vapErgebnisse.map(v => v.steuer),
      ...entnahmeErgebnisse.map(e => e.steuer),
    ].reduce((s, v) => s + v, 0);
    const gesamtJahresrendite = toepfe.reduce((s, topf, i) => {
      if (topf.steuermodell === "etf")
        return s + topfState[i].kapital * (topf.rendite / 100) - vapErgebnisse[i].steuer;
      return s + zinsErgebnisse[i].zinsNetto;
    }, 0);

    const topfKapitale = toepfe.map((topf, i) => {
      const kap = topfState[i].kapital;
      const sr = aktSrJahr[i];
      if (topf.steuermodell === "etf") {
        const vap = vapErgebnisse[i];
        const { brutto, steuer: entSteuer } = entnahmeErgebnisse[i];
        const kbAbgang = brutto > 0 && kap > 0 ? brutto * (topfState[i].kostenbasis / kap) : 0;
        // Konservatives Jahresmodell: Entnahme zu Jahresbeginn (mindert zinstragendes Kapital),
        // Sparrate am Jahresende (keine unterjährigen Zinsen). Systematisch leicht pessimistisch.
        const r = topf.rendite / 100;
        const neuesKapital = Math.max(0, (kap - brutto) * (1 + r) + sr - vap.steuer);
        // Kostenbasis steigt nur um den steuerpflichtigen Teil der Vorabpauschale
        // (nach Teilfreistellung) + neue Sparraten. Der steuerfreie Anteil erhöht
        // die Kostenbasis nicht, da er nie versteuert wurde.
        const vapKostenbasisZuwachs = vap.vorabpauschale * (1 - teilfreistellung);
        const neueKostenbasis = Math.min(neuesKapital, Math.max(0,
          topfState[i].kostenbasis + vapKostenbasisZuwachs + sr - kbAbgang
        ));
        topfState[i] = { kapital: neuesKapital, kostenbasis: neueKostenbasis };
        return neuesKapital;
      } else {
        const { ausfallKapital, zinsNetto } = zinsErgebnisse[i];
        // Konservatives Jahresmodell: Ausfall + Entnahme zu Jahresbeginn,
        // Sparrate am Jahresende (keine unterjährigen Zinsen).
        const r2 = topf.rendite / 100;
        const entnahme = entnahmeErgebnisse[i].brutto;
        const kapNachAbzug = Math.max(0, kap - ausfallKapital - entnahme);
        const zinsNettoNachAbzug = kapNachAbzug * r2 - zinsErgebnisse[i].steuer;
        const neuesKapital = Math.max(0, kapNachAbzug + zinsNettoNachAbzug + sr);
        topfState[i] = { kapital: neuesKapital, kostenbasis: neuesKapital };
        return neuesKapital;
      }
    });

    const portfolioGesamt = topfKapitale.reduce((s, v) => s + v, 0);

    result.push({
      alter: aktuellesAlter,
      portfolio: Math.round(portfolioGesamt),
      portfolioReal: Math.round(portfolioGesamt / infFaktor),
      topfKapitale: topfKapitale.map(Math.round),
      entnahmeMonatlich: Math.round(gesamtEntnahmeNetto / 12),
      entnahmeReal: Math.round(gesamtEntnahmeNetto / 12 / infFaktor),
      entnahmeProTopf: entnahmeErgebnisse.map(e => Math.round((e.brutto - e.steuer) / 12)),
      sparrateMonatlich: Math.round(aktSparrateGesamt / 12),
      arbeitseinkommenMonatlich: Math.round(arbeitseinkommenJahr / 12),
      renteMonatlich: Math.round(aktRenteJahr / 12),
      fixkostenMonatlich: Math.round(fixkJahr / 12),
      fixkostenReal: Math.round(fixkBasisJahrVoll * (imRuhestand ? fixkostenRuhestandFaktor : 1) / 12),
      jahresrendite: Math.round(gesamtJahresrendite),
      steuerMonatlich: Math.round(gesamtSteuer / 12),
      stunden,
      imRuhestand,
    });
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// CHART-DATEN (Visualisierungsfelder — getrennt von Simulation)
// ─────────────────────────────────────────────────────────────────────────────

const berechneChartDaten = (simDaten) => simDaten.map((d, j) => {
  const prev = j > 0 ? simDaten[j - 1] : null;
  const istMeilenstein = prev !== null && (
    (d.imRuhestand && !prev.imRuhestand) ||
    (!d.imRuhestand && d.stunden < prev.stunden)
  );
  const fixkMo = d.fixkostenMonatlich;
  const deckungArbeit = Math.min(d.arbeitseinkommenMonatlich, fixkMo);
  const restNachArbeit = Math.max(0, fixkMo - d.arbeitseinkommenMonatlich);
  const deckungRente = Math.min(d.renteMonatlich, restNachArbeit);
  const restNachRente = Math.max(0, restNachArbeit - d.renteMonatlich);
  const deckungEntnahme = Math.min(d.entnahmeMonatlich, restNachRente);
  return { ...d, meilenstein: istMeilenstein, deckungArbeit, deckungRente, deckungEntnahme };
});


// ─────────────────────────────────────────────────────────────────────────────
// UI-PRIMITIVES
// Kleine, reine Darstellungs-Bausteine. Kein eigener State, keine Logik.
// ─────────────────────────────────────────────────────────────────────────────

// Überschrift einer Sektion (Label + optionale Sub-Info)
const SectionLabel = ({ icon, label, farbe, sub }) => (
  <div style={{ marginBottom: S.md }}>
    <div style={STYLES.sectionLabel(farbe)}>
      {icon && <span style={{ marginRight: S.xs }}>{icon}</span>}{label}
    </div>
    {sub && <div style={{ fontSize: T.xs, color: C.textMuted, marginTop: "0.15rem" }}>{sub}</div>}
  </div>
);

// Slider mit Label + Wert-Anzeige
const Slider = ({ label, value, min, max, step, onChange, format, farbe }) => {
  const pct = ((value - min) / (max - min)) * 100;
  const col = farbe ?? C.green;
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: S.xs }}>
        <span style={{ color: C.textMuted, fontSize: T.sm, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ ...STYLES.monoValue(col), fontSize: T.lg }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: "100%", height: "3px", borderRadius: R.pill, outline: "none", cursor: "pointer",
          background: `linear-gradient(to right, ${col} ${pct}%, ${C.border} ${pct}%)`,
          "--slider-color": col,
        }}
      />
    </div>
  );
};

// Zahlen-Input mit optionalem Einheiten-Suffix
const NumInput = ({ value, onChange, min, max, step, suffix, farbe }) => (
  <div style={{ position: "relative" }}>
    <input type="number" value={value} min={min} max={max} step={step}
      onChange={e => onChange(Number(e.target.value))}
      style={{ ...STYLES.input(farbe ? `${farbe}66` : C.border), color: farbe ?? C.textPrimary, paddingRight: suffix ? "2.2rem" : "0.7rem" }}
    />
    {suffix && (
      <span style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: T.xs, pointerEvents: "none" }}>
        {suffix}
      </span>
    )}
  </div>
);

// Info-Box (Erklärungstext in Card)
const InfoBox = ({ children, farbe }) => (
  <div style={{ ...STYLES.infoBox, ...(farbe ? { borderLeft: `2px solid ${farbe}44` } : {}), paddingLeft: farbe ? S.md : STYLES.infoBox.padding.split(" ")[1] }}>
    {children}
  </div>
);

// Gesetzliches Parameterfeld mit Reset-Button
const GesetzFeld = ({ label, gesetz, einheit, value, onChange, min, max, step, standard, info }) => {
  const geaendert = value !== standard;
  return (
    <div style={{ marginBottom: "1.2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.2rem" }}>
        <span style={{ color: C.textMuted, fontSize: T.sm }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: S.sm }}>
          {geaendert && (
            <button onClick={() => onChange(standard)}
              style={{ background: "none", border: "none", color: C.purple, fontSize: T.xs, cursor: "pointer", padding: 0 }}>
              ↺ {standard}{einheit}
            </button>
          )}
          <NumInput value={value} onChange={onChange} min={min} max={max} step={step}
            suffix={einheit} farbe={geaendert ? C.purple : null} />
        </div>
      </div>
      <div style={{ fontSize: T.xxs, color: `${C.purple}88`, fontStyle: "italic", marginBottom: "0.2rem" }}>{gesetz}</div>
      <div style={{ fontSize: T.xxs, color: C.textMuted, lineHeight: 1.5 }}>{info}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FACHLICHE KOMPONENTEN
// ─────────────────────────────────────────────────────────────────────────────

const TopfPanel = ({ topf, gesamtToepfe, onChange, onRemove }) => {
  const modell = STEUERMODELLE[topf.steuermodell];

  return (
    <div style={STYLES.cardAccented(topf.farbe)}>

      {/* Kopfzeile: Name + Entfernen */}
      <div style={{ display: "flex", alignItems: "center", gap: S.sm, marginBottom: S.md }}>
        <span>{modell.icon}</span>
        <input value={topf.name} onChange={e => onChange({ ...topf, name: e.target.value })}
          style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${C.border}`, color: C.textPrimary, fontSize: T.md, fontFamily: T.mono, fontWeight: T.bold, outline: "none", paddingBottom: "0.1rem" }} />
        {gesamtToepfe > 1 && (
          <button onClick={onRemove}
            style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: T.md, padding: 0, lineHeight: 1 }}
            title="Topf entfernen">✕</button>
        )}
      </div>

      {/* Steuermodell-Wahl */}
      <div style={{ display: "flex", gap: S.xs, marginBottom: S.sm }}>
        {Object.entries(STEUERMODELLE).map(([key, m]) => {
          const aktiv = topf.steuermodell === key;
          return (
            <button key={key} onClick={() => onChange({ ...topf, steuermodell: key })}
              style={{
                flex: 1, padding: `${S.xs} ${S.sm}`, borderRadius: R.md, cursor: "pointer",
                border: aktiv ? `1px solid ${m.farbe}55` : `1px solid ${C.border}`,
                background: aktiv ? `${m.farbe}18` : "transparent",
                color: aktiv ? m.farbe : C.textMuted,
                fontFamily: T.mono, fontSize: T.xs, fontWeight: aktiv ? T.bold : T.normal,
                transition: "all 0.15s",
              }}>
              {m.icon} {m.label}
            </button>
          );
        })}
      </div>
      <div style={{ ...STYLES.infoBox, marginBottom: S.md, fontSize: T.xs }}>
        {modell.beschreibung}
      </div>

      {/* Finanzparameter */}
      <Slider label="Startkapital" value={topf.startKapital} min={0} max={300000} step={1000}
        farbe={topf.farbe} onChange={v => onChange({ ...topf, startKapital: v })} format={fmt.euro} />
      <Slider label="Sparrate / Monat" value={topf.sparrateMonatlich} min={0} max={3000} step={50}
        farbe={topf.farbe} onChange={v => onChange({ ...topf, sparrateMonatlich: v })} format={v => `${v} €`} />
      <Slider label="Bruttorendite p.a." value={topf.rendite} min={0.5} max={20} step={0.5}
        farbe={topf.farbe} onChange={v => onChange({ ...topf, rendite: v })} format={fmt.prozent} />

      {/* Entnahme-Prioritaet */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: S.md }}>
        <span style={{ color: C.textMuted, fontSize: T.sm, textTransform: "uppercase", letterSpacing: "0.06em" }}>Entnahme-Priorität</span>
        <div style={{ display: "flex", alignItems: "center", gap: S.xs }}>
          {[["−", -1], ["+", 1]].map(([label, dir], idx) => idx === 0 ? (
            <button key={label} onClick={() => onChange({ ...topf, entnahmeReihenfolge: Math.max(1, topf.entnahmeReihenfolge + dir) })}
              style={{ width: "26px", height: "26px", borderRadius: R.sm, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: T.lg, lineHeight: 1 }}>{label}</button>
          ) : (
            <button key={label} onClick={() => onChange({ ...topf, entnahmeReihenfolge: Math.min(gesamtToepfe, topf.entnahmeReihenfolge + dir) })}
              style={{ width: "26px", height: "26px", borderRadius: R.sm, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: T.lg, lineHeight: 1 }}>{label}</button>
          ))}
          <span style={{ ...STYLES.monoValue(topf.farbe), fontSize: T.lg, minWidth: "1.5rem", textAlign: "center" }}>
            {topf.entnahmeReihenfolge}
          </span>
          <span style={{ color: C.textMuted, fontSize: T.xs }}>
            {topf.entnahmeReihenfolge === 1 ? "(zuerst)" : `(nach ${topf.entnahmeReihenfolge - 1})`}
          </span>
        </div>
      </div>

      {/* Ausfallrate Zinsen */}
      {topf.steuermodell === "zinsen" && (
        <>
          <Slider label="Ausfallrate / Plattformrisiko p.a." value={topf.ausfallrate} min={0} max={20} step={0.5}
            farbe={topf.farbe} onChange={v => onChange({ ...topf, ausfallrate: v })} format={fmt.prozent} />
          <InfoBox farbe={topf.ausfallrate > 0 ? C.amber : null}>
            Modelliert Klumpen- und Plattformrisiko über die Bruttorendite hinaus (z.B. 0.5–2% bei Einzelplattform). Kapitalabzug nicht steuerlich absetzbar (konservativ).
            {topf.ausfallrate > 0 && <>
              {" "}Eff. Netto-Rendite:{" "}
              <span style={STYLES.monoValue(topf.rendite - topf.ausfallrate > 0 ? topf.farbe : C.red)}>
                {(topf.rendite - topf.ausfallrate).toFixed(1)}%
              </span>.
            </>}
          </InfoBox>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ERGEBNISSE (Charts)
// ─────────────────────────────────────────────────────────────────────────────

const fmtEuro = (v) => `${Math.round(v).toLocaleString('de-DE')} €`;
const fmtKompakt = (v) => {
  const a = Math.abs(v);
  if (a >= 1000000) return `${(v / 1000000).toFixed(1).replace('.', ',')}M`;
  if (a >= 1000)    return `${(v / 1000).toFixed(0)}k`;
  return `${Math.round(v)}`;
};

const TooltipDunkel = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: R.md, padding: `${S.sm} ${S.md}`, fontSize: T.xs }}>
      <div style={{ color: C.textMuted, marginBottom: S.xs }}>Alter {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color ?? p.fill, fontFamily: T.mono }}>
          {p.name}: {typeof p.value === "number" ? fmtEuro(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

const Ergebnisse = ({ daten, toepfe, datenOhneSteuer, steuerAenderungAktiv }) => {
  // Farben direkt aus topf.farbe — konsistent mit den Slider-Cards
  const [zeigeReal, setZeigeReal] = useState(false);

  // Chart 1: Portfolio-Daten
  const portfolioDaten = daten.map((d, i) => {
    const row = { alter: d.alter, real: d.portfolioReal };
    toepfe.forEach((t, j) => { row[t.name] = d.topfKapitale[j] ?? 0; });
    if (datenOhneSteuer) row["Ohne Steueraenderung"] = datenOhneSteuer[i]?.portfolio ?? 0;
    return row;
  });

  // Chart 2: Cashflow-Daten — Entnahme pro Topf aufgeteilt
  const cashflowDaten = daten.map(d => {
    const row = {
      alter: d.alter,
      Arbeit: d.arbeitseinkommenMonatlich,
      Rente: d.renteMonatlich,
      Fixkosten: d.fixkostenMonatlich,
      FixkostenReal: d.fixkostenReal,
      EntnahmeReal: d.entnahmeReal,
    };
    // Tatsächliche Entnahme pro Topf aus der Simulation
    toepfe.forEach((t, i) => {
      row[`Entnahme ${t.name}`] = d.entnahmeProTopf?.[i] ?? 0;
    });
    return row;
  });

  // Ruhestand-Startlinie + erste Entnahme + Breakeven
  const ruhestandAlter = daten.find(d => d.imRuhestand)?.alter;
  const ersteEntnahmeAlter = daten.find(d => d.entnahmeMonatlich > 0)?.alter;
  const peakAlter = daten.reduce((best, d) => d.portfolio > best.portfolio ? d : best, daten[0])?.alter;

  return (
    <div style={{ display: "grid", gap: S.lg }}>

      {/* Chart 1: Portfolio */}
      <div style={STYLES.card}>
        <SectionLabel icon="📈" label="Portfolio-Entwicklung" farbe={C.green}
          sub="Gestapelte Töpfe = nominal · Gestrichelte Linie = Gesamt real (heutige Kaufkraft)" />
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={portfolioDaten} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              {toepfe.map((t, i) => (
                <linearGradient key={t.name} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.farbe} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={t.farbe} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="alter" tick={{ fill: C.textMuted, fontSize: 11 }} tickLine={false} />
            <YAxis tickFormatter={fmtEuro} tick={{ fill: C.textMuted, fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
            <Tooltip content={<TooltipDunkel />} />
            <Legend wrapperStyle={{ fontSize: T.xs, color: C.textMuted }} />
            {ruhestandAlter && (
              <ReferenceLine x={ruhestandAlter} stroke={C.amber} strokeDasharray="4 4"
                label={{ value: "Rente", fill: C.amber, fontSize: 11, position: "insideTopRight" }} />
            )}
            {ersteEntnahmeAlter && ersteEntnahmeAlter !== ruhestandAlter && (
              <ReferenceLine x={ersteEntnahmeAlter} stroke={C.red} strokeDasharray="4 4"
                label={{ value: "1. Entnahme", fill: C.red, fontSize: 11, position: "insideTopRight" }} />
            )}
            {peakAlter && peakAlter !== ruhestandAlter && peakAlter !== ersteEntnahmeAlter && (
              <ReferenceLine x={peakAlter} stroke={C.green} strokeDasharray="4 4"
                label={{ value: "Peak", fill: C.green, fontSize: 11, position: "insideTopRight" }} />
            )}
            {toepfe.map((t, i) => (
              <Area key={t.name} type="monotone" dataKey={t.name} stackId="1"
                stroke={t.farbe}
                fill={`url(#grad${i})`}
                strokeWidth={1.5} />
            ))}
            <Area type="monotone" dataKey="real" name="Gesamt real (Kaufkraft)"
              stroke="#ffffff" strokeWidth={2.5} fill="none" dot={false} strokeDasharray="6 3" strokeOpacity={0.85} />
            {steuerAenderungAktiv && datenOhneSteuer && (
              <Area type="monotone" dataKey="Ohne Steueraenderung" name="Ohne Steueraenderung"
                stroke={C.green} strokeWidth={2} fill="none" dot={false} strokeDasharray="4 2" strokeOpacity={0.7} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Cashflow */}
      <div style={STYLES.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: S.md }}>
          <SectionLabel icon="💸" label="Monatlicher Cashflow" farbe={C.blue}
            sub="Einkommensquellen gestapelt · Linie = Fixkosten" />
          <button onClick={() => setZeigeReal(v => !v)}
            style={{ background: zeigeReal ? `${C.blue}22` : "transparent", border: `1px solid ${zeigeReal ? C.blue : C.border}`, borderRadius: R.pill, color: zeigeReal ? C.blue : C.textMuted, fontSize: T.xs, cursor: "pointer", padding: `${S.xs} ${S.md}`, fontFamily: T.mono, transition: "all 0.15s" }}>
            {zeigeReal ? "Real (Kaufkraft)" : "Nominal"}
          </button>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={cashflowDaten} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barSize={6}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="alter" tick={{ fill: C.textMuted, fontSize: 11 }} tickLine={false} />
            <YAxis tickFormatter={fmtEuro} tick={{ fill: C.textMuted, fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
            <Tooltip content={<TooltipDunkel />} />
            <Legend wrapperStyle={{ fontSize: T.xs, color: C.textMuted }} />
            {ruhestandAlter && (
              <ReferenceLine x={ruhestandAlter} stroke={C.amber} strokeDasharray="4 4"
                label={{ value: "Rente", fill: C.amber, fontSize: 11, position: "insideTopRight" }} />
            )}
            {ersteEntnahmeAlter && ersteEntnahmeAlter !== ruhestandAlter && (
              <ReferenceLine x={ersteEntnahmeAlter} stroke={C.red} strokeDasharray="4 4"
                label={{ value: "1. Entnahme", fill: C.red, fontSize: 11, position: "insideTopRight" }} />
            )}
            <Bar dataKey="Arbeit" stackId="a" fill="#e2e8f0" fillOpacity={0.9} />
            <Bar dataKey="Rente" stackId="a" fill="#c084fc" fillOpacity={0.9} />
            {toepfe.map((t) => (
              <Bar key={t.name} dataKey={`Entnahme ${t.name}`} stackId="a"
                fill={t.farbe} fillOpacity={zeigeReal ? 0.3 : 0.7} />
            ))}
            {zeigeReal && (
              <Line type="monotone" dataKey="EntnahmeReal" name="Entnahme real"
                stroke={C.amber} strokeWidth={2} dot={false} strokeDasharray="5 3" />
            )}
            <Line type="monotone" dataKey={zeigeReal ? "FixkostenReal" : "Fixkosten"} name="Fixkosten" stroke={C.red}
              strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Jahrestabelle */}
      <div style={STYLES.card}>
        <div style={{ fontSize: "0.72rem", letterSpacing: "0.15em", color: "#94a3b8", textTransform: "uppercase", marginBottom: "1rem", fontFamily: "'Courier New', monospace" }}>
          Jahrestabelle
        </div>
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem", fontFamily: "'Courier New', monospace", fontVariantNumeric: "tabular-nums" }}>
            <thead style={{ position: "sticky", top: 0, background: "#111827", zIndex: 1 }}>
              <tr style={{ borderBottom: "1px solid #1e2d3f" }}>
                <th style={{ padding: "0.4rem 0.75rem", color: "#64748b", textAlign: "left", fontWeight: 400, textTransform: "uppercase", width: "80px" }}>Alter</th>
                <th style={{ padding: "0.4rem 0.75rem", color: "#64748b", textAlign: "right", fontWeight: 400, textTransform: "uppercase", width: "130px" }}>Portfolio</th>
                <th style={{ padding: "0.4rem 0.75rem", color: "#64748b", textAlign: "right", fontWeight: 400, textTransform: "uppercase", width: "90px" }}>+/-</th>
                <th style={{ padding: "0.4rem 0.75rem", color: "#64748b", textAlign: "right", fontWeight: 400, textTransform: "uppercase", width: "110px" }}>Bedarf</th>
                <th style={{ padding: "0.4rem 0.75rem", color: "#64748b", textAlign: "right", fontWeight: 400, textTransform: "uppercase", width: "110px" }}>Betrag</th>
                <th style={{ padding: "0.4rem 0.75rem", color: "#64748b", textAlign: "right", fontWeight: 400, textTransform: "uppercase" }}>Einkommen</th>
                <th style={{ padding: "0.4rem 0.75rem", color: "#64748b", textAlign: "right", fontWeight: 400, textTransform: "uppercase" }}>Portfolio %</th>
              </tr>
            </thead>
            <tbody>
              {daten.map((d, idx) => {
                const istEntnahme = d.entnahmeMonatlich > 0;
                const betrag = istEntnahme ? d.entnahmeMonatlich : d.sparrateMonatlich;
                const betragFarbe = istEntnahme ? "#f59e0b" : "#22d3a0";
                const betragPrefix = istEntnahme ? "- " : "+ ";
                return (
                  <tr key={d.alter} style={{
                    borderBottom: "1px solid rgba(30,45,63,0.5)",
                    background: d.imRuhestand ? "rgba(167,139,250,0.05)" : idx % 2 === 0 ? "transparent" : "#0f1929",
                  }}>
                    <td style={{ padding: "0.4rem 0.75rem", whiteSpace: "nowrap" }}>
                      <span style={{ color: d.imRuhestand ? "#a78bfa" : "#e2e8f0" }}>{d.alter}</span>
                      {" "}
                      <span style={{ fontSize: "0.65rem", color: d.imRuhestand ? "#a78bfa" : "#f59e0b" }}>
                        {d.imRuhestand ? "Rente" : d.stunden + "h"}
                      </span>
                    </td>
                    <td style={{ padding: "0.4rem 0.75rem", color: "#e2e8f0", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {Math.round(d.portfolio).toLocaleString("de-DE") + " €"}
                    </td>
                    <td style={{ padding: "0.4rem 0.75rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      {idx > 0 && (() => {
                        const diff = d.portfolio - daten[idx - 1].portfolio;
                        const farbe = diff >= 0 ? "#22d3a0" : "#f87171";
                        const pfeil = diff >= 0 ? "▲" : "▼";
                        const absDiff = Math.abs(Math.round(diff)).toLocaleString("de-DE");
                        return <span style={{ color: farbe, fontSize: "0.65rem" }}>{pfeil + " " + absDiff}</span>;
                      })()}
                    </td>
                    <td style={{ padding: "0.4rem 0.75rem", color: "#64748b", textAlign: "right", whiteSpace: "nowrap" }}>
                      {Math.round(d.fixkostenMonatlich).toLocaleString("de-DE") + " €"}
                    </td>
                    <td style={{ padding: "0.4rem 0.75rem", color: betragFarbe, textAlign: "right", whiteSpace: "nowrap" }}>
                      {betragPrefix + Math.round(betrag).toLocaleString("de-DE") + " €"}
                    </td>
                    <td style={{ padding: "0.4rem 0.75rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      {d.arbeitseinkommenMonatlich > 0 && (
                        <span style={{ color: "#94a3b8" }}>{Math.round(d.arbeitseinkommenMonatlich).toLocaleString("de-DE") + " €"}</span>
                      )}
                      {d.arbeitseinkommenMonatlich > 0 && d.renteMonatlich > 0 && (
                        <span style={{ color: "#64748b" }}> + </span>
                      )}
                      {d.renteMonatlich > 0 && (
                        <span style={{ color: "#a78bfa" }}>{Math.round(d.renteMonatlich).toLocaleString("de-DE") + " €"}</span>
                      )}
                      {d.arbeitseinkommenMonatlich === 0 && d.renteMonatlich === 0 && (
                        <span style={{ color: "#64748b" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "0.4rem 0.75rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      {idx > 0 ? (() => {
                        const prev = daten[idx - 1].portfolio;
                        const change = prev > 0 ? (d.portfolio - prev) / prev * 100 : 0;
                        const farbe = change > 0 ? "#22d3a0" : change > -2 ? "#f59e0b" : "#f87171";
                        return <span style={{ color: farbe, fontWeight: change < -2 ? 700 : 400 }}>{(change >= 0 ? "+" : "") + change.toFixed(1) + "%"}</span>;
                      })() : <span style={{ color: "#64748b" }}>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HAUPT-KOMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export default function Finanzrechner() {

  // ── State ──────────────────────────────────────────────────────────────────
  const [toepfe, setToepfe] = useState(DEFAULT_TOEPFE);

  const [alter, setAlter] = useState(30);
  const [lebenserwartung, setLebenserwartung] = useState(85);
  const [rentenalter, setRentenalter] = useState(67);

  const [gehalt, setGehalt] = useState(3000);
  const [fixkosten, setFixkosten] = useState(2000);
  const [gehaltszuwachs, setGehaltszuwachs] = useState(1);
  const [inflation, setInflation] = useState(2.5);

  const [startStunden, setStartStunden] = useState(40);
  const [ankerStunden, setAnkerStunden] = useState(20);
  const [ankerNetto, setAnkerNetto] = useState(1500);
  const [reduktionIntervall, setReduktionIntervall] = useState(2);
  const [reduktionProSchritt, setReduktionProSchritt] = useState(0);
  const [reduktionOffset, setReduktionOffset] = useState(0);
  const [minStunden, setMinStunden] = useState(20);

  const [renteMonatlich, setRenteMonatlich] = useState(0);
  const [renteBeginnAlter, setRenteBeginnAlter] = useState(67);
  const [rentensteigerung, setRentensteigerung] = useState(1.5);

  const [teilfreistellungEtf, setTeilfreistellungEtf] = useState(DEFAULTS_GESETZ.teilfreistellungEtf);
  const [basiszinsProzent, setBasiszinsProzent] = useState(DEFAULTS_GESETZ.basiszinsProzent);
  const [vorabpauschaleKorrekturfaktor, setVorabpauschaleKorrekturfaktor] = useState(DEFAULTS_GESETZ.vorabpauschaleKorrekturfaktor);
  const [freistellung, setFreistellung] = useState(DEFAULTS_GESETZ.sparerpauschbetrag);
  const [steuersatz, setSteuersatz] = useState(DEFAULTS_GESETZ.abgeltungssteuer);

  const [gesetzPanelOffen, setGesetzPanelOffen] = useState(false);
  const [modalOffen, setModalOffen] = useState(false);
  const [steuerAenderungAktiv, setSteuerAenderungAktiv] = useState(false);
  const [fixkostenRuhestandFaktor, setFixkostenRuhestandFaktor] = useState(85);
  const [gkvBeitrag, setGkvBeitrag] = useState(250);
  const [steuerNeu, setSteuerNeu] = useState(30);
  const [steuerAenderungInJahren, setSteuerAenderungInJahren] = useState(10);

  // ── Topf-Operationen ───────────────────────────────────────────────────────
  const topfAktualisieren = (id, neu) => setToepfe(p => p.map(t => t.id === id ? neu : t));
  const topfEntfernen = (id) => setToepfe(p => p.filter(t => t.id !== id));
  const topfHinzufuegen = () => setToepfe(p => [...p, {
    id: naechsteId++,
    name: `Topf ${p.length + 1}`,
    steuermodell: "zinsen",
    startKapital: 0, sparrateMonatlich: 0, rendite: 5,
    entnahmeReihenfolge: Math.max(...p.map(t => t.entnahmeReihenfolge), 0) + 1,
    ausfallrate: 0,
    farbe: TOPF_FARBEN[p.length % TOPF_FARBEN.length],
  }]);

  // ── Abgeleitete Werte ──────────────────────────────────────────────────────
  const sparrateGesamt = toepfe.reduce((s, t) => s + t.sparrateMonatlich, 0);
  const startkapitalGesamt = toepfe.reduce((s, t) => s + t.startKapital, 0);
  const puffer = gehalt - fixkosten - sparrateGesamt;
  const jahre = Math.max(1, lebenserwartung - alter);
  const teilfreistellung = teilfreistellungEtf / 100;
  const basiszins = basiszinsProzent / 100;
  const basiszinsKorrekturfaktor = vorabpauschaleKorrekturfaktor / 100;

  const simParams = useMemo(() => ({
    toepfe, alter, lebenserwartung, rentenalter,
    gehaltMonatlich: gehalt, fixkostenMonatlich: fixkosten,
    startStunden, ankerStunden, ankerNettoMonatlich: ankerNetto,
    reduktionIntervall, reduktionProSchritt, reduktionOffset, minStunden,
    inflation, gehaltszuwachs, freistellung, steuersatz,
    teilfreistellung, basiszins, basiszinsKorrekturfaktor,
    renteMonatlich, renteBeginnAlter, rentensteigerung,
    steuerAenderungAktiv, steuerNeu, steuerAenderungInJahren,
    fixkostenRuhestandFaktor: fixkostenRuhestandFaktor / 100,
    gkvBeitragMonatlich: gkvBeitrag,
  }), [
    toepfe, alter, lebenserwartung, rentenalter, gehalt, fixkosten,
    startStunden, ankerStunden, ankerNetto,
    reduktionIntervall, reduktionProSchritt, reduktionOffset, minStunden,
    inflation, gehaltszuwachs, freistellung, steuersatz,
    teilfreistellung, basiszins, basiszinsKorrekturfaktor,
    renteMonatlich, renteBeginnAlter, rentensteigerung,
    steuerAenderungAktiv, steuerNeu, steuerAenderungInJahren,
    fixkostenRuhestandFaktor,
    gkvBeitrag,
  ]);

  const daten = useMemo(() => simuliere(simParams), [simParams]);
  // Vergleichssimulation ohne Steueraenderung (nur wenn aktiv)
  const datenOhneSteuer = useMemo(() => {
    if (!steuerAenderungAktiv) return null;
    return simuliere({ ...simParams, steuerAenderungAktiv: false });
  }, [simParams, steuerAenderungAktiv]);

  // ── Kennzahlen ─────────────────────────────────────────────────────────────
  const kennzahlen = useMemo(() => {
    const peakEintrag = daten.reduce((best, d) => d.portfolio > best.portfolio ? d : best, daten[0]);
    const erstesEntnahmeJahr = daten.find(d => d.entnahmeMonatlich > 0);
    const portfolioEnde = daten[daten.length - 1];
    const leerAlter = daten.find(d => d.portfolio <= 0)?.alter;
    const gesamtentnahme = daten.reduce((s, d) => s + d.entnahmeMonatlich * 12, 0);
    const erwerbsjahre = daten.filter(d => !d.imRuhestand);
    const gesamtstunden = erwerbsjahre.reduce((s, d) => s + d.stunden * 52, 0);
    const schnittStunden = erwerbsjahre.length > 0
      ? Math.round(gesamtstunden / erwerbsjahre.length / 52 * 10) / 10 : 0;
    return [
      { label: "Peak-Portfolio",        wert: fmt.euro(peakEintrag.portfolio),      sub: `Alter ${peakEintrag.alter}`,                                                                                        farbe: C.green  },
      { label: "Erste Entnahme",        wert: erstesEntnahmeJahr ? `Alter ${erstesEntnahmeJahr.alter}` : "—", sub: erstesEntnahmeJahr ? `${fmt.euro(erstesEntnahmeJahr.entnahmeMonatlich)}/Mo.` : "keine Entnahme", farbe: C.amber },
      { label: leerAlter ? "Portfolio leer" : "Portfolio am Ende", wert: leerAlter ? `Alter ${leerAlter}` : fmt.euro(portfolioEnde.portfolio), sub: leerAlter ? "nicht nachhaltig" : `Alter ${portfolioEnde.alter}`, farbe: leerAlter ? C.red : C.blue },
      { label: "Netto-Entnahme gesamt", wert: fmt.euro(gesamtentnahme),             sub: "",                                                                                                                  farbe: C.green  },
      { label: "Gesamtstunden Arbeit",  wert: `${gesamtstunden.toLocaleString("de-DE")} h`, sub: "",                                                                                                         farbe: C.amber  },
      { label: "Avg. Stunden/Woche",     wert: `${schnittStunden} h`,                sub: "",                                                                                                                  farbe: C.amber  },
    ];
  }, [daten]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bgPage, minHeight: "100vh", fontFamily: T.mono, color: C.textPrimary, padding: S.xl + " " + S.md }}>
      <style>{SLIDER_CSS}</style>

      {/* Kennzahlen-Summary (sticky) */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.bgPage, paddingTop: S.sm, paddingBottom: S.sm, marginBottom: S.sm }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: S.sm }}>
          {kennzahlen.map(({ label, wert, sub, farbe }) => (
            <div key={label} style={{ ...STYLES.cardAccented(farbe), padding: `${S.xs} ${S.sm}` }}>
              <div style={{ fontSize: T.xxs, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.15rem" }}>{label}</div>
              <div style={{ fontSize: T.sm, fontFamily: T.mono, fontWeight: T.bold, color: farbe }}>{wert}</div>
              <div style={{ fontSize: T.xxs, color: C.textMuted }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: S.xxl }}>
        <h1 style={{ fontSize: T.h1, fontWeight: T.black, margin: 0, letterSpacing: "-0.02em", color: C.textWhite }}>
          Finanzrechner
        </h1>
        <p style={{ color: C.textMuted, fontSize: T.sm, marginTop: S.xs }}>
          Kein Ersatz für individuelle Finanzberatung · Alle Angaben ohne Gewähr
        </p>
        <button onClick={() => setModalOffen(true)}
          style={{ marginTop: S.md, background: "none", border: `1px solid ${C.border}`, borderRadius: R.pill, color: C.textMuted, fontSize: T.xs, cursor: "pointer", padding: `${S.xs} ${S.md}`, letterSpacing: "0.08em" }}>
          ℹ Modellannahmen
        </button>
      </div>

      {/* Modellannahmen Modal */}
      {modalOffen && (
        <div onClick={() => setModalOffen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: S.lg }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: R.lg, padding: S.xl, maxWidth: "660px", width: "100%", maxHeight: "80vh", overflowY: "auto" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: S.lg }}>
              <div style={STYLES.sectionLabel(C.green)}>ℹ Modellannahmen</div>
              <button onClick={() => setModalOffen(false)}
                style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: T.xl, lineHeight: 1 }}>✕</button>
            </div>

            {[
              { titel: "Sparrate in Teilzeit", farbe: C.green, text: "Sinkt das Arbeitseinkommen unter die Zielsparrate, werden alle Töpfe anteilig zu ihrem eingestellten Zielbetrag gekürzt. Die relative Gewichtung bleibt stabil. Eine gekürzte Sparrate gilt nicht als Fehlbetrag — es wird kein Portfolio angezapft, man spart einfach weniger. Die Sparrate ist nominal konstant und wird nicht mit dem Gehalt erhöht — das unterschätzt das Endportfolio leicht." },
              { titel: "Entnahmereihenfolge", farbe: C.green, text: "Töpfe mit niedrigerer Prioritätszahl werden zuerst entnommen. Töpfe mit gleicher Priorität werden anteilig zu ihrem aktuellen Kapital belastet — wer mehr hat, gibt mehr ab. Läuft ein Topf leer, wird der verbleibende Fehlbetrag iterativ auf die übrigen Töpfe der gleichen Gruppe verteilt." },
              { titel: "ETF-Besteuerung", farbe: C.blue, text: "Jährlich wird die Vorabpauschale berechnet (Basisertrag = Basiszins × 0,7 × Fondswert, gedeckelt auf tatsächliche Wertsteigerung). Bei Entnahmen wird der Gewinnanteil über Kostenbasis-Tracking ermittelt. Auf beide wird die Teilfreistellung angewendet, bevor Abgeltungssteuer anfällt. Bekannte Vereinfachung: die Kostenbasis wird durch die Vorabpauschale leicht zu hoch angesetzt, was zukünftige Entnahme-Steuern minimal unterschätzt." },
              { titel: "Zins-Besteuerung", farbe: C.amber, text: "Zinserträge unterliegen der vollen Abgeltungssteuer ohne Teilfreistellung. Bei Kapitalentnahmen aus Zinstöpfen fällt keine weitere Steuer an, da das Kapital bereits aus versteuerten Erträgen besteht." },
              { titel: "Freistellungs-Waterfall", farbe: C.purple, text: "Der Sparerpauschbetrag wird in dieser Reihenfolge verbraucht: zuerst auf Zinserträge, dann auf die Vorabpauschale, zuletzt auf ETF-Entnahmen. Das maximiert den steuerlichen Vorteil da Zinsen sonst voll steuerpflichtig wären." },
              { titel: "Inflation", farbe: C.amber, text: "Fixkosten werden jährlich mit dem eingestellten Inflationsfaktor hochgeschrieben. Die Portfolioentnahme deckt stets den real inflationierten Fehlbetrag. Die staatliche Rente wächst mit dem eingestellten Rentensteigerungssatz — liegt dieser unter der Inflation, verliert die Rente real an Wert und der Portfolioentnahme-Bedarf steigt entsprechend stärker." },
              { titel: "Gehalt & Teilzeit-Interpolation", farbe: C.green, text: "Der Gehaltszuwachs ist als nominaler Wert zu verstehen — er enthält keine automatische Inflationskomponente. Bei Gehaltszuwachs < Inflation sinkt die reale Kaufkraft des Gehalts über Zeit. Für Teilzeit wird nicht linear skaliert, sondern über einen Ankerpunkt interpoliert — so wird der steuerliche Progressionsvorteil bei Stundenreduktion realistisch abgebildet." },
              { titel: "Simulationsschritte", farbe: C.amber, text: "Die Simulation rechnet in Jahresschritten. Bewusst konservatives Modell: Entnahmen und Ausfälle werden zu Jahresbeginn verbucht (mindern das zinstragende Kapital für das ganze Jahr), Sparraten am Jahresende (keine unterjährigen Zinsen). Das unterschätzt das Portfolio leicht — als Planungstool ist pessimistisch besser als optimistisch." },
              { titel: "Ausfallrate P2P", farbe: C.amber, text: "Der Kapitalabzug erfolgt vor der Zinsberechnung und ist steuerlich nicht absetzbar. Das ist eine konservative Annahme: in der Realität könnten Ausfälle teilweise steuerlich verrechenbar sein." },
              { titel: "Steueränderungs-Szenario", farbe: C.red, text: "Optional zuschaltbar: Ab einem einstellbaren Zeitpunkt (in X Jahren) gilt ein neuer Abgeltungssteuersatz. Die Teilfreistellung bleibt unverändert. Wenn inaktiv, gilt der aktuelle Satz für die gesamte Laufzeit." },
              { titel: "GKV im Ruhestand", farbe: C.purple, text: "Ab Renteneintritt wird ein pauschaler GKV-Beitrag auf die Fixkosten aufgeschlagen. Default 250 EUR/Mo. entspricht dem Mindestbeitrag (Mindestbemessungsgrundlage ca. 1.131 EUR/Mo. x 16,3%). Wer hoehere Kapitalertraege hat zahlt mehr, gedeckelt bei ca. 900 EUR/Mo. (Beitragsbemessungsgrenze). Solange du als Arbeitnehmer angestellt bleibst uebernimmt der Arbeitgeber die Haelfte — der Slider ist also nur fuer die Rentenphase relevant." },
              { titel: "Bewusst nicht modelliert", farbe: C.red, text: "Sequence-of-Returns-Risiko, Kirchensteuer, Krankenversicherung im Ruhestand (GKV-Mindestbeitrag ca. 200 €/Mo.). Der Rechner ist kein Ersatz für individuelle Finanzplanung." },
            ].map(({ titel, farbe, text }) => (
              <div key={titel} style={{ marginBottom: S.lg, paddingBottom: S.lg, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: T.sm, fontFamily: T.mono, fontWeight: T.bold, color: farbe, marginBottom: S.xs }}>{titel}</div>
                <div style={{ fontSize: T.sm, color: C.textSecondary, lineHeight: 1.7 }}>{text}</div>
              </div>
            ))}

            <div style={{ fontSize: T.xxs, color: C.textMuted, textAlign: "center", marginTop: S.sm }}>
              Keine Anlageberatung. Alle Angaben ohne Gewähr.
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gap: S.lg }}>

        {/* Gesetzliche Parameter (einklappbar) */}
        <div style={{ ...STYLES.card, padding: 0, overflow: "hidden" }}>
          <button onClick={() => setGesetzPanelOffen(v => !v)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: S.lg, color: C.textPrimary }}>
            <div style={{ display: "flex", alignItems: "center", gap: S.sm }}>
              <span>⚖️</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: T.xs, letterSpacing: "0.15em", color: C.purple, textTransform: "uppercase" }}>Gesetzliche Parameter</div>
                <div style={{ fontSize: T.xs, color: C.textMuted, marginTop: "0.15rem" }}>
                  Teilfreistellung <span style={STYLES.monoValue(C.purple)}>{teilfreistellungEtf}%</span>
                  {" · "}Basiszins <span style={STYLES.monoValue(C.purple)}>{basiszinsProzent}%</span>
                  {" · "}Freistellung <span style={STYLES.monoValue(C.purple)}>{freistellung.toLocaleString("de-DE")} €</span>
                  {" · "}Steuer <span style={STYLES.monoValue(C.purple)}>{steuersatz}%</span>
                </div>
              </div>
            </div>
            <span style={{ color: C.textMuted }}>{gesetzPanelOffen ? "▲" : "▼"}</span>
          </button>
          {gesetzPanelOffen && (
            <div style={{ padding: `0 ${S.lg} ${S.lg}`, borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: `0 ${S.xl}`, marginTop: S.md }}>
                <GesetzFeld label="Teilfreistellung ETF" gesetz="§ 20 Abs. 1 InvStG" einheit="%" value={teilfreistellungEtf} onChange={setTeilfreistellungEtf} min={0} max={80} step={1} standard={DEFAULTS_GESETZ.teilfreistellungEtf}
                  info="30% der ETF-Gewinne steuerfrei. Gilt für Aktien-ETF mit ≥51% Aktienquote." />
                <GesetzFeld label="Basiszins (Vorabpauschale)" gesetz="§ 18 Abs. 4 InvStG" einheit="%" value={basiszinsProzent} onChange={setBasiszinsProzent} min={0} max={6} step={0.1} standard={DEFAULTS_GESETZ.basiszinsProzent}
                  info="Jährlich vom BMF festgelegt. Basis für die fiktive Mindestrendite der Vorabpauschale." />
                <GesetzFeld label="Korrekturfaktor Vorabpauschale" gesetz="§ 18 Abs. 1 InvStG" einheit="%" value={vorabpauschaleKorrekturfaktor} onChange={setVorabpauschaleKorrekturfaktor} min={50} max={100} step={1} standard={DEFAULTS_GESETZ.vorabpauschaleKorrekturfaktor}
                  info="70% des Basiszinses = Basisertrag. Gesetzlich fixiert." />
                <GesetzFeld label="Sparerpauschbetrag" gesetz="§ 20 Abs. 9 EStG" einheit=" €" value={freistellung} onChange={setFreistellung} min={0} max={3000} step={50} standard={DEFAULTS_GESETZ.sparerpauschbetrag}
                  info="1.000 € p.a. (seit 2023). Kapitalerträge bis zu diesem Betrag steuerfrei." />
                <GesetzFeld label="Abgeltungssteuer + Soli" gesetz="§ 43a EStG + SolzG" einheit="%" value={steuersatz} onChange={setSteuersatz} min={0} max={50} step={0.1} standard={DEFAULTS_GESETZ.abgeltungssteuer}
                  info="25% Abgeltungssteuer + 5,5% Solidaritätszuschlag = 26,375%." />
              </div>
              <button onClick={() => { setTeilfreistellungEtf(DEFAULTS_GESETZ.teilfreistellungEtf); setBasiszinsProzent(DEFAULTS_GESETZ.basiszinsProzent); setVorabpauschaleKorrekturfaktor(DEFAULTS_GESETZ.vorabpauschaleKorrekturfaktor); setFreistellung(DEFAULTS_GESETZ.sparerpauschbetrag); setSteuersatz(DEFAULTS_GESETZ.abgeltungssteuer); }}
                style={{ background: "none", border: `1px solid ${C.purple}44`, borderRadius: R.sm, color: C.purple, fontSize: T.xs, cursor: "pointer", padding: `${S.xs} ${S.sm}`, marginTop: S.xs }}>
                ↺ Alle zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Person & Arbeitszeit (2-spaltig) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: S.lg }}>

          {/* Person & Einkommen */}
          <div style={STYLES.card}>
            <SectionLabel icon="👤" label="Person & Einkommen" farbe={C.green} />
            <Slider label="Aktuelles Alter" value={alter} min={18} max={70} step={1}
              onChange={v => { setAlter(v); if (rentenalter <= v) setRentenalter(v + 1); }} format={fmt.jahre} />
            <Slider label="Bruttogehalt / Monat" value={gehalt} min={500} max={15000} step={100}
              onChange={setGehalt} format={fmt.euro} />
            <Slider label="Fixkosten / Monat" value={fixkosten} min={500} max={10000} step={100}
              onChange={setFixkosten} format={fmt.euro} />

            {/* Puffer-Anzeige */}
            <div style={puffer < 0 ? STYLES.statusWarn : STYLES.statusOk}>
              {puffer < 0
                ? <>⚠ Sparraten + Fixkosten ({fmt.euro(fixkosten + sparrateGesamt)}/Mo.) übersteigen Gehalt</>
                : <>✓ Puffer: <strong>{fmt.euro(puffer)}/Mo.</strong> nach Fixkosten + Sparraten</>
              }
            </div>

            {/* Teilzeit-Ankerpunkt */}
            <div style={{ marginTop: S.lg }}>
              <div style={{ fontSize: T.xs, color: C.amber, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: S.sm }}>
                Teilzeit-Ankerpunkt
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: S.sm, marginBottom: S.sm }}>
                <div>
                  <div style={{ color: C.textMuted, fontSize: T.xs, marginBottom: "0.3rem" }}>Stunden dabei</div>
                  <NumInput value={ankerStunden} onChange={setAnkerStunden} min={1} max={34} step={1} suffix="h" />
                </div>
                <div>
                  <div style={{ color: C.textMuted, fontSize: T.xs, marginBottom: "0.3rem" }}>Netto dabei</div>
                  <NumInput value={ankerNetto} onChange={setAnkerNetto} min={0} max={10000} step={50} suffix="€" />
                </div>
              </div>
              <InfoBox>
                Progressionsvorteil:{" "}
                <span style={STYLES.monoValue(C.green)}>
                  +{((ankerNetto / (gehalt * ankerStunden / startStunden) - 1) * 100).toFixed(1)}%
                </span>{" "}
                bei {ankerStunden}h vs. linear
              </InfoBox>
            </div>

            <div style={{ marginTop: S.md }}>
              <Slider label="Jährl. Gehaltszuwachs" value={gehaltszuwachs} min={0} max={8} step={0.5}
                onChange={setGehaltszuwachs} format={fmt.prozent} />
              <Slider label="Inflation p.a." value={inflation} min={0} max={6} step={0.5}
                onChange={setInflation} format={fmt.prozent} />
            </div>
          </div>

          {/* Arbeitszeit */}
          <div style={STYLES.card}>
            <SectionLabel icon="⏱" label="Arbeitszeit" farbe={C.amber} />
            <Slider label="Start-Stunden/Woche" value={startStunden} min={20} max={50} step={1}
              onChange={setStartStunden} format={fmt.stunden} farbe={C.amber} />
            <Slider label="Erste Reduktion nach" value={reduktionOffset} min={0} max={10} step={1}
              onChange={setReduktionOffset} format={v => v === 0 ? "sofort" : `${v} Jahr${v > 1 ? "en" : ""}`} farbe={C.amber} />
            <Slider label="Reduktion alle X Jahre" value={reduktionIntervall} min={1} max={5} step={1}
              onChange={setReduktionIntervall} format={v => `${v} Jahre`} farbe={C.amber} />
            <Slider label="Stunden pro Schritt" value={reduktionProSchritt} min={0} max={5} step={0.5}
              onChange={setReduktionProSchritt} format={fmt.stunden} farbe={C.amber} />
            <Slider label="Minimum Stunden/Woche" value={minStunden} min={0} max={25} step={1}
              onChange={setMinStunden} format={v => v === 0 ? "Rente 🎉" : fmt.stunden(v)} farbe={C.amber} />
            <Slider label="Renteneintritt" value={rentenalter} min={alter + 1} max={lebenserwartung - 1} step={1}
              onChange={setRentenalter} format={fmt.jahre} farbe={C.amber} />
            <Slider label="Lebenserwartung" value={lebenserwartung} min={60} max={105} step={1}
              onChange={v => setLebenserwartung(Math.max(v, alter + 1))} format={fmt.jahre} farbe={C.amber} />
          </div>
        </div>

        {/* Kapital-Toepfe */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: S.md }}>
            <div>
              <div style={STYLES.sectionLabel(C.green)}>💰 Kapital-Töpfe</div>
              <div style={{ fontSize: T.xs, color: C.textMuted }}>
                Startkapital gesamt:{" "}
                <span style={STYLES.monoValue(C.green)}>{fmt.euro(startkapitalGesamt)}</span>
                {" · "}Sparrate:{" "}
                <span style={STYLES.monoValue(C.green)}>{fmt.euro(sparrateGesamt)}/Mo.</span>
              </div>
            </div>
            <button onClick={topfHinzufuegen}
              style={{ background: `${C.green}18`, border: `1px solid ${C.green}44`, borderRadius: R.md, color: C.green, fontSize: T.sm, cursor: "pointer", padding: `${S.xs} ${S.md}`, fontFamily: T.mono }}>
              + Topf hinzufügen
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: S.md }}>
            {toepfe.map((topf) => (
              <TopfPanel key={topf.id} topf={topf} gesamtToepfe={toepfe.length}
                onChange={neu => topfAktualisieren(topf.id, neu)}
                onRemove={() => topfEntfernen(topf.id)} />
            ))}
          </div>
        </div>

        {/* Staatliche Rente */}
        <div style={STYLES.cardAccented(C.purple)}>
          <SectionLabel icon="🏛" label="Staatliche Rente" farbe={C.purple} />
          <InfoBox farbe={C.purple}>
            Erwartete Nettorente aus deinem Renteninformationsschreiben. Ab dem eingetragenen Alter wird sie als monatliches Einkommen angerechnet und reduziert die Portfolioentnahme.
          </InfoBox>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: S.md, margin: `${S.md} 0` }}>
            <div>
              <div style={{ color: C.textMuted, fontSize: T.xs, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: S.xs }}>Nettorente / Monat</div>
              <NumInput value={renteMonatlich} onChange={setRenteMonatlich} min={0} max={5000} step={50} suffix="€" farbe={renteMonatlich > 0 ? C.purple : null} />
            </div>
            <div>
              <div style={{ color: C.textMuted, fontSize: T.xs, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: S.xs }}>Rentenbeginn (Alter)</div>
              <NumInput value={renteBeginnAlter} onChange={setRenteBeginnAlter} min={alter + 1} max={85} step={1} suffix="Jahre" />
            </div>
          </div>
          <Slider label="Jährl. Rentensteigerung" value={rentensteigerung} min={0} max={4} step={0.25}
            onChange={setRentensteigerung} format={fmt.prozent} farbe={C.purple} />
          <Slider label="Fixkosten im Ruhestand" value={fixkostenRuhestandFaktor} min={50} max={120} step={5}
            onChange={setFixkostenRuhestandFaktor} format={v => `${v}% (${fmt.euro(fixkosten * v / 100)}/Mo.)`} farbe={C.purple} />
          <Slider label="GKV-Beitrag im Ruhestand" value={gkvBeitrag} min={0} max={900} step={10}
            onChange={setGkvBeitrag} format={fmt.euro} farbe={C.purple} />

        </div>

        {/* Steueraenderungs-Szenario */}
        <div style={STYLES.cardAccented(C.red)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: S.md }}>
            <SectionLabel icon="⚠" label="Steueränderungs-Szenario" farbe={C.red} />
            <button onClick={() => setSteuerAenderungAktiv(v => !v)}
              style={{
                background: steuerAenderungAktiv ? `${C.red}22` : "transparent",
                border: `1px solid ${steuerAenderungAktiv ? C.red : C.border}`,
                borderRadius: R.pill, color: steuerAenderungAktiv ? C.red : C.textMuted,
                fontSize: T.xs, cursor: "pointer", padding: `${S.xs} ${S.md}`,
                fontFamily: T.mono, transition: "all 0.15s",
              }}>
              {steuerAenderungAktiv ? "● aktiv" : "○ inaktiv"}
            </button>
          </div>
          <InfoBox farbe={steuerAenderungAktiv ? C.red : null}>
            Modelliert eine zukünftige Gesetzesänderung: Ab dem eingestellten Zeitpunkt gilt ein neuer
            Abgeltungssteuersatz. Die Teilfreistellung bleibt unverändert.
          </InfoBox>
          <div style={{ marginTop: S.md, opacity: steuerAenderungAktiv ? 1 : 0.4, pointerEvents: steuerAenderungAktiv ? "auto" : "none", transition: "opacity 0.15s" }}>
            <Slider label="Steuererhöhung in X Jahren" value={steuerAenderungInJahren} min={1} max={40} step={1}
              onChange={setSteuerAenderungInJahren} format={v => `in ${v} Jahren (Alter ${alter + v})`} farbe={C.red} />
            <Slider label="Neuer Abgeltungssteuersatz" value={steuerNeu} min={20} max={50} step={0.5}
              onChange={setSteuerNeu} format={fmt.prozent} farbe={C.red} />
            {steuerAenderungAktiv && (
              <InfoBox farbe={C.red}>
                Ab Alter {alter + steuerAenderungInJahren}:{" "}
                <span style={STYLES.monoValue(C.red)}>{steuerNeu}%</span>
                {" "}statt{" "}
                <span style={STYLES.monoValue(C.textMuted)}>{steuersatz}%</span>
                {" · "}Aufschlag:{" "}
                <span style={STYLES.monoValue(C.red)}>+{(steuerNeu - steuersatz).toFixed(2)}%</span>
              </InfoBox>
            )}
          </div>
        </div>

        {/* Ergebnisse */}
        <Ergebnisse daten={daten} toepfe={toepfe} datenOhneSteuer={datenOhneSteuer} steuerAenderungAktiv={steuerAenderungAktiv} />

        {/* Fusszeil */}
        <div style={{ textAlign: "center", fontSize: T.xxs, color: C.textMuted, paddingBottom: S.md }}>
          ETF: {teilfreistellungEtf}% Teilfreistellung + Vorabpauschale (Basiszins {basiszinsProzent}%) ·
          Zinsen: volle Abgeltungssteuer · Keine Anlageberatung.
        </div>

      </div>
    </div>
  );
}
