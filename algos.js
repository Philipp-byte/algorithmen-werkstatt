/* Algorithmen-Werkstatt — Definition der vier Algorithmen
   Jeder Eintrag liefert: Text, Fall-Daten, Zufallsdaten, Python-Code (Zeilen),
   einen Schritt-Generator fuer die Animation, das Code-Puzzle und die Tests. */
'use strict';

function zufallZahlen(anzahl, min, max) {
  const menge = new Set();
  while (menge.size < anzahl) menge.add(min + Math.floor(Math.random() * (max - min + 1)));
  return Array.from(menge);
}
function zufallAus(liste) { return liste[Math.floor(Math.random() * liste.length)]; }
function nichtEnthalten(liste, min, max) {
  let z;
  do { z = min + Math.floor(Math.random() * (max - min + 1)); } while (liste.includes(z));
  return z;
}
function alleIdx(n) { return Array.from({ length: n }, (_, i) => i); }

const ALGOS = {};

/* ------------------------------------------------------------ Lineare Suche */
ALGOS.linear = {
  id: 'linear', name: 'Lineare Suche', art: 'suche', datei: 'lineare-suche.html',
  fall: 'Ticketkontrolle beim Schulfest',
  kurz: 'Der Rechner geht die Liste von vorn nach hinten durch und vergleicht jedes Element mit dem gesuchten Wert – bis er ihn findet oder die Liste zu Ende ist.',
  fallText: '<b>Der Fall:</b> Mia prüft am Einlass, ob eine Ticketnummer in der Liste der verkauften Tickets steht. Die Liste ist unsortiert – Ticket 2290 ist echt, Ticket 3333 gefälscht.',
  liste: [4711, 1204, 3390, 2875, 4102, 1560, 3921, 2290, 4488, 1733, 3057, 2601],
  gesucht: 2290, alternative: 3333,
  zufall() {
    const l = zufallZahlen(10, 1000, 4999);
    const g = Math.random() < 0.7 ? zufallAus(l) : nichtEnthalten(l, 1000, 4999);
    return { liste: l, gesucht: g };
  },
  code: [
    'def lineare_suche(liste, gesucht):',
    '    for i in range(len(liste)):',
    '        if liste[i] == gesucht:',
    '            return i',
    '    return -1',
  ],
  *schritte(liste, gesucht) {
    let cmp = 0; const geprueft = [];
    yield { arr: liste, line: 0, cnt: { Vergleiche: 0 }, msg: `Suche nach ${gesucht}. Die Suche beginnt beim ersten Element (Index 0).` };
    for (let i = 0; i < liste.length; i++) {
      cmp += 1;
      const gleich = liste[i] === gesucht;
      yield { arr: liste, focus: [i], ptr: { i }, raus: [...geprueft], line: 2, cnt: { Vergleiche: cmp },
              msg: `Vergleich ${cmp}: liste[${i}] ist ${liste[i]} – ${gleich ? 'gleich ' + gesucht + '. Gefunden!' : 'nicht ' + gesucht + '.'}` };
      if (gleich) {
        yield { arr: liste, gefunden: i, ptr: { i }, raus: [...geprueft], line: 3, cnt: { Vergleiche: cmp }, ende: true,
                msg: `return ${i} – gefunden bei Index ${i} nach ${cmp} Vergleichen.` };
        return;
      }
      geprueft.push(i);
    }
    yield { arr: liste, raus: [...geprueft], line: 4, cnt: { Vergleiche: cmp }, ende: true,
            msg: `Die Liste ist zu Ende: ${gesucht} fehlt. return -1 – nach ${cmp} Vergleichen.` };
  },
  parsons: {
    zeilen: [
      { code: 'def lineare_suche(liste, gesucht):', e: 0 },
      { code: 'for i in range(len(liste)):', e: 1 },
      { code: 'if liste[i] == gesucht:', e: 2 },
      { code: 'return i', e: 3 },
      { code: 'return -1', e: 1 },
    ],
    stoerer: [{ code: 'return gesucht', e: 3 }],
  },
  aufgabe: {
    text: 'Schreibe die Funktion <code>lineare_suche(liste, gesucht)</code>. Sie gibt den Index des gesuchten Werts zurück – oder <code>-1</code>, wenn er fehlt.',
    starter: 'def lineare_suche(liste, gesucht):\n    # dein Code\n    pass\n',
    tests: [
      { name: 'Ticket 2290 (Fall)', call: 'lineare_suche([4711, 1204, 3390, 2875, 4102, 1560, 3921, 2290, 4488, 1733, 3057, 2601], 2290)', expect: '7' },
      { name: 'Ticket 3333 (gefälscht)', call: 'lineare_suche([4711, 1204, 3390, 2875, 4102, 1560, 3921, 2290, 4488, 1733, 3057, 2601], 3333)', expect: '-1' },
      { name: 'erstes Element', call: 'lineare_suche([4711, 1204, 3390], 4711)', expect: '0' },
      { name: 'letztes Element', call: 'lineare_suche([4711, 1204, 3390], 3390)', expect: '2' },
      { name: 'leere Liste', call: 'lineare_suche([], 5)', expect: '-1' },
    ],
    tipps: [
      'Eine <code>for</code>-Schleife über <code>range(len(liste))</code> liefert dir jeden Index.',
      'Innerhalb der Schleife: Wenn <code>liste[i]</code> gleich <code>gesucht</code> ist, gib <code>i</code> zurück – <code>return</code> beendet die Funktion sofort.',
      'Das <code>return -1</code> gehört <b>hinter</b> die Schleife (gleiche Einrückung wie <code>for</code>), sonst bricht die Suche nach dem ersten Vergleich ab.',
    ],
  },
  vertiefung: {
    text: 'Erweiterung: Die Funktion soll zusätzlich zählen, wie viele Vergleiche sie gemacht hat, und beides zurückgeben: <code>return index, vergleiche</code>.',
    starter: 'def lineare_suche(liste, gesucht):\n    vergleiche = 0\n    # dein Code\n',
    tests: [
      { name: 'Ticket 2290: Index 7, 8 Vergleiche', call: 'lineare_suche([4711, 1204, 3390, 2875, 4102, 1560, 3921, 2290, 4488, 1733, 3057, 2601], 2290)', expect: '(7, 8)' },
      { name: 'Ticket 3333: fehlt, 12 Vergleiche', call: 'lineare_suche([4711, 1204, 3390, 2875, 4102, 1560, 3921, 2290, 4488, 1733, 3057, 2601], 3333)', expect: '(-1, 12)' },
      { name: 'leere Liste: fehlt, 0 Vergleiche', call: 'lineare_suche([], 1)', expect: '(-1, 0)' },
    ],
    tipps: [
      'Erhöhe den Zähler in jedem Schleifendurchlauf, <b>bevor</b> du vergleichst – dann zählt auch der Treffer mit.',
      'Beide <code>return</code>-Zeilen geben zwei Werte zurück: <code>return i, vergleiche</code> und <code>return -1, vergleiche</code>.',
    ],
  },
};

/* ------------------------------------------------------------ Binaere Suche */
ALGOS.binary = {
  id: 'binary', name: 'Binäre Suche', art: 'suche', sortiert: true, datei: 'binaere-suche.html',
  fall: 'Die Wette: 1000 Zahlen, zehn Fragen',
  kurz: 'In einer sortierten Liste schaut der Rechner in die Mitte und weiß danach, in welcher Hälfte es weitergeht. Jeder Vergleich halbiert den Suchbereich.',
  fallText: '<b>Der Fall:</b> Lea wettet, dass sie jede Zahl zwischen 1 und 1000 mit höchstens zehn Fragen findet. Mit demselben Trick prüft sie Ausweisnummern in einer sortierten Liste.',
  liste: [1012, 1158, 1207, 1349, 1420, 1585, 1633, 1701, 1876, 1988, 2105, 2233, 2417, 2560, 2678],
  gesucht: 2417, alternative: 1900,
  zufall() {
    const l = zufallZahlen(15, 1000, 2999).sort((a, b) => a - b);
    const g = Math.random() < 0.7 ? zufallAus(l) : nichtEnthalten(l, 1000, 2999);
    return { liste: l, gesucht: g };
  },
  code: [
    'def binaere_suche(liste, gesucht):',
    '    links = 0',
    '    rechts = len(liste) - 1',
    '    while links <= rechts:',
    '        mitte = (links + rechts) // 2',
    '        if liste[mitte] == gesucht:',
    '            return mitte',
    '        elif liste[mitte] < gesucht:',
    '            links = mitte + 1',
    '        else:',
    '            rechts = mitte - 1',
    '    return -1',
  ],
  *schritte(liste, gesucht) {
    const n = liste.length; let links = 0, rechts = n - 1, cmp = 0;
    const raus = () => alleIdx(n).filter(i => i < links || i > rechts);
    yield { arr: liste, ptr: { links, rechts }, line: 2, cnt: { Vergleiche: 0 }, msg: `Suche nach ${gesucht}. Suchbereich: links = 0, rechts = ${rechts} (die ganze Liste).` };
    while (links <= rechts) {
      const mitte = Math.floor((links + rechts) / 2);
      yield { arr: liste, ptr: { links, rechts, mitte }, raus: raus(), line: 4, cnt: { Vergleiche: cmp },
              msg: `Mitte = (${links} + ${rechts}) // 2 = ${mitte}.` };
      cmp += 1;
      if (liste[mitte] === gesucht) {
        yield { arr: liste, ptr: { links, rechts, mitte }, gefunden: mitte, raus: raus(), line: 6, cnt: { Vergleiche: cmp }, ende: true,
                msg: `Vergleich ${cmp}: liste[${mitte}] ist ${liste[mitte]} – gleich ${gesucht}. return ${mitte} nach ${cmp} Vergleichen.` };
        return;
      }
      if (liste[mitte] < gesucht) {
        yield { arr: liste, ptr: { links, rechts, mitte }, focus: [mitte], raus: raus(), line: 7, cnt: { Vergleiche: cmp },
                msg: `Vergleich ${cmp}: ${liste[mitte]} ist kleiner als ${gesucht} – rechts weitersuchen.` };
        links = mitte + 1;
        yield { arr: liste, ptr: { links, rechts }, raus: raus(), line: 8, cnt: { Vergleiche: cmp }, msg: `links = ${mitte} + 1 = ${links}. Alles links davon fällt weg.` };
      } else {
        yield { arr: liste, ptr: { links, rechts, mitte }, focus: [mitte], raus: raus(), line: 9, cnt: { Vergleiche: cmp },
                msg: `Vergleich ${cmp}: ${liste[mitte]} ist größer als ${gesucht} – links weitersuchen.` };
        rechts = mitte - 1;
        yield { arr: liste, ptr: { links, rechts }, raus: raus(), line: 10, cnt: { Vergleiche: cmp }, msg: `rechts = ${mitte} − 1 = ${rechts}. Alles rechts davon fällt weg.` };
      }
    }
    yield { arr: liste, ptr: { links, rechts }, raus: alleIdx(n), line: 11, cnt: { Vergleiche: cmp }, ende: true,
            msg: `links (${links}) ist größer als rechts (${rechts}): Der Suchbereich ist leer, ${gesucht} fehlt. return -1 nach ${cmp} Vergleichen.` };
  },
  parsons: {
    zeilen: [
      { code: 'def binaere_suche(liste, gesucht):', e: 0 },
      { code: 'links = 0', e: 1 },
      { code: 'rechts = len(liste) - 1', e: 1 },
      { code: 'while links <= rechts:', e: 1 },
      { code: 'mitte = (links + rechts) // 2', e: 2 },
      { code: 'if liste[mitte] == gesucht:', e: 2 },
      { code: 'return mitte', e: 3 },
      { code: 'elif liste[mitte] < gesucht:', e: 2 },
      { code: 'links = mitte + 1', e: 3 },
      { code: 'else:', e: 2 },
      { code: 'rechts = mitte - 1', e: 3 },
      { code: 'return -1', e: 1 },
    ],
    stoerer: [{ code: 'links = mitte', e: 3 }],
  },
  aufgabe: {
    text: 'Schreibe die Funktion <code>binaere_suche(liste, gesucht)</code> für eine <b>sortierte</b> Liste. Sie gibt den Index des gesuchten Werts zurück – oder <code>-1</code>, wenn er fehlt.',
    starter: 'def binaere_suche(liste, gesucht):\n    links = 0\n    rechts = len(liste) - 1\n    # dein Code\n',
    tests: [
      { name: 'Nummer 2417 (Fall)', call: 'binaere_suche([1012, 1158, 1207, 1349, 1420, 1585, 1633, 1701, 1876, 1988, 2105, 2233, 2417, 2560, 2678], 2417)', expect: '12' },
      { name: 'Nummer 1900 (fehlt)', call: 'binaere_suche([1012, 1158, 1207, 1349, 1420, 1585, 1633, 1701, 1876, 1988, 2105, 2233, 2417, 2560, 2678], 1900)', expect: '-1' },
      { name: 'erstes Element', call: 'binaere_suche([1012, 1158, 1207, 1349, 1420], 1012)', expect: '0' },
      { name: 'letztes Element', call: 'binaere_suche([1012, 1158, 1207, 1349, 1420], 1420)', expect: '4' },
      { name: 'kleiner als alle', call: 'binaere_suche([1012, 1158, 1207], 900)', expect: '-1' },
      { name: 'leere Liste', call: 'binaere_suche([], 5)', expect: '-1' },
    ],
    tipps: [
      'Solange <code>links &lt;= rechts</code> gilt, ist der Suchbereich nicht leer – das ist die Bedingung der <code>while</code>-Schleife.',
      'Die Mitte: <code>mitte = (links + rechts) // 2</code>. Vergleiche <code>liste[mitte]</code> mit <code>gesucht</code>: gleich → <code>return mitte</code>; kleiner → <code>links = mitte + 1</code>; größer → <code>rechts = mitte - 1</code>.',
      'Das <code>return -1</code> steht nach der Schleife. Läuft dein Programm endlos, fehlt wahrscheinlich das <code>+ 1</code> oder <code>- 1</code>.',
    ],
  },
  vertiefung: {
    text: 'Erweiterung: Gib zusätzlich die Anzahl der Vergleiche zurück: <code>return index, vergleiche</code>.',
    starter: 'def binaere_suche(liste, gesucht):\n    links = 0\n    rechts = len(liste) - 1\n    vergleiche = 0\n    # dein Code\n',
    tests: [
      { name: '2417: Index 12, 4 Vergleiche', call: 'binaere_suche([1012, 1158, 1207, 1349, 1420, 1585, 1633, 1701, 1876, 1988, 2105, 2233, 2417, 2560, 2678], 2417)', expect: '(12, 4)' },
      { name: '1900: fehlt, 4 Vergleiche', call: 'binaere_suche([1012, 1158, 1207, 1349, 1420, 1585, 1633, 1701, 1876, 1988, 2105, 2233, 2417, 2560, 2678], 1900)', expect: '(-1, 4)' },
      { name: '1349: Index 3, 2 Vergleiche', call: 'binaere_suche([1012, 1158, 1207, 1349, 1420, 1585, 1633, 1701, 1876, 1988, 2105, 2233, 2417, 2560, 2678], 1349)', expect: '(3, 2)' },
    ],
    tipps: [
      'Ein Vergleich ist jeder Blick auf <code>liste[mitte]</code> – zähle also einmal pro Schleifendurchlauf, direkt nach der Berechnung der Mitte.',
    ],
  },
};

/* ------------------------------------------------------------ Bubble Sort */
ALGOS.bubble = {
  id: 'bubble', name: 'Bubble Sort', art: 'sortieren', datei: 'bubble-sort.html',
  fall: 'Das Klassenfoto',
  kurz: 'Nachbarn werden verglichen und getauscht, wenn der linke größer ist. Nach jedem Durchgang steht das größte Element des Restes ganz rechts fest.',
  fallText: '<b>Der Fall:</b> Acht Personen sollen nach Größe in einer Reihe stehen. Der Fotograf lässt immer nur Nachbarn tauschen – wie viele Durchgänge braucht das?',
  liste: [172, 158, 181, 165, 190, 160, 177, 169],
  zufall() { return { liste: zufallZahlen(8, 150, 195) }; },
  code: [
    'def bubble_sort(liste):',
    '    n = len(liste)',
    '    for durchgang in range(n - 1):',
    '        for i in range(n - 1 - durchgang):',
    '            if liste[i] > liste[i + 1]:',
    '                liste[i], liste[i + 1] = liste[i + 1], liste[i]',
    '    return liste',
  ],
  *schritte(start) {
    const a = start.slice(); const n = a.length; let cmp = 0, tausch = 0;
    yield { arr: a.slice(), line: 1, cnt: { Durchgang: 0, Vergleiche: 0, Tausch: 0 }, msg: `Start: ${n} Elemente, unsortiert. Es folgen höchstens ${n - 1} Durchgänge.` };
    for (let d = 0; d < n - 1; d++) {
      const fest = alleIdx(n).filter(i => i >= n - d);
      let tauschImDurchgang = 0;
      yield { arr: a.slice(), fertig: fest, line: 2, cnt: { Durchgang: d + 1, Vergleiche: cmp, Tausch: tausch }, msg: `Durchgang ${d + 1}: ${n - 1 - d} Nachbarpaare werden verglichen.` };
      for (let i = 0; i < n - 1 - d; i++) {
        cmp += 1;
        const groesser = a[i] > a[i + 1];
        yield { arr: a.slice(), focus: [i, i + 1], fertig: fest, line: 4, cnt: { Durchgang: d + 1, Vergleiche: cmp, Tausch: tausch },
                msg: `Vergleich ${cmp}: ${a[i]} ${groesser ? '>' : '≤'} ${a[i + 1]} – ${groesser ? 'tauschen.' : 'nichts tun.'}` };
        if (groesser) {
          [a[i], a[i + 1]] = [a[i + 1], a[i]]; tausch += 1; tauschImDurchgang += 1;
          yield { arr: a.slice(), focus: [i, i + 1], tausch: [i, i + 1], fertig: fest, line: 5, cnt: { Durchgang: d + 1, Vergleiche: cmp, Tausch: tausch },
                  msg: `Getauscht: jetzt ${a[i]} vor ${a[i + 1]}. (Tausch Nr. ${tausch})` };
        }
      }
      const festNeu = alleIdx(n).filter(i => i >= n - 1 - d);
      yield { arr: a.slice(), fertig: festNeu, line: 2, cnt: { Durchgang: d + 1, Vergleiche: cmp, Tausch: tausch },
              msg: `Durchgang ${d + 1} beendet: ${tauschImDurchgang} Tauschvorgänge. ${a[n - 1 - d]} steht jetzt fest.${tauschImDurchgang === 0 ? ' Nichts getauscht – die Liste war schon sortiert.' : ''}` };
    }
    yield { arr: a.slice(), fertig: alleIdx(n), line: 6, cnt: { Durchgang: n - 1, Vergleiche: cmp, Tausch: tausch }, ende: true,
            msg: `Fertig sortiert nach ${n - 1} Durchgängen, ${cmp} Vergleichen und ${tausch} Tauschvorgängen. return liste` };
  },
  parsons: {
    zeilen: [
      { code: 'def bubble_sort(liste):', e: 0 },
      { code: 'n = len(liste)', e: 1 },
      { code: 'for durchgang in range(n - 1):', e: 1 },
      { code: 'for i in range(n - 1 - durchgang):', e: 2 },
      { code: 'if liste[i] > liste[i + 1]:', e: 3 },
      { code: 'liste[i], liste[i + 1] = liste[i + 1], liste[i]', e: 4 },
      { code: 'return liste', e: 1 },
    ],
    stoerer: [{ code: 'if liste[i] < liste[i + 1]:', e: 3 }],
  },
  aufgabe: {
    text: 'Schreibe die Funktion <code>bubble_sort(liste)</code>. Sie sortiert die Liste aufsteigend und gibt sie zurück.',
    starter: 'def bubble_sort(liste):\n    n = len(liste)\n    # dein Code\n',
    tests: [
      { name: 'Reihe vom Foto', call: 'bubble_sort([172, 158, 181, 165, 190, 160, 177, 169])', expect: '[158, 160, 165, 169, 172, 177, 181, 190]' },
      { name: 'schon sortiert', call: 'bubble_sort([1, 2, 3])', expect: '[1, 2, 3]' },
      { name: 'absteigend', call: 'bubble_sort([3, 2, 1])', expect: '[1, 2, 3]' },
      { name: 'doppelte Werte', call: 'bubble_sort([5, 1, 5, 1])', expect: '[1, 1, 5, 5]' },
      { name: 'leere Liste', call: 'bubble_sort([])', expect: '[]' },
    ],
    tipps: [
      'Zwei Schleifen: die äußere über die Durchgänge (<code>range(n - 1)</code>), die innere über die Nachbarpaare.',
      'Im Vergleich <code>if liste[i] &gt; liste[i + 1]:</code> tauschst du mit <code>liste[i], liste[i + 1] = liste[i + 1], liste[i]</code>.',
      'Vergiss das <code>return liste</code> am Ende nicht – sonst kommt <code>None</code> zurück.',
    ],
  },
  vertiefung: {
    text: 'Erweiterung: Die Funktion soll die Tauschvorgänge zählen und beides zurückgeben: <code>return liste, tausch</code>.',
    starter: 'def bubble_sort(liste):\n    n = len(liste)\n    tausch = 0\n    # dein Code\n',
    tests: [
      { name: 'Reihe vom Foto: 13 Tauschvorgänge', call: 'bubble_sort([172, 158, 181, 165, 190, 160, 177, 169])', expect: '([158, 160, 165, 169, 172, 177, 181, 190], 13)' },
      { name: 'schon sortiert: 0', call: 'bubble_sort([1, 2, 3])', expect: '([1, 2, 3], 0)' },
      { name: 'absteigend: 3', call: 'bubble_sort([3, 2, 1])', expect: '([1, 2, 3], 3)' },
    ],
    tipps: ['Erhöhe den Zähler nur innerhalb des <code>if</code>, also nur wenn wirklich getauscht wird.'],
  },
};

/* ------------------------------------------------------------ Selection Sort */
ALGOS.selection = {
  id: 'selection', name: 'Selection Sort', art: 'sortieren', datei: 'selection-sort.html',
  fall: 'Die Palettenreihe im Lager',
  kurz: 'In jedem Durchgang wird das kleinste Element des unsortierten Teils gesucht und einmal nach vorn getauscht. Wenige Tauschvorgänge – aber genauso viele Vergleiche wie Bubble Sort.',
  fallText: '<b>Der Fall:</b> Ahmed soll acht Paletten nach Tournummer ordnen. Schauen kostet nichts, jede Fahrt mit dem Hubwagen zwei Minuten – wie oft muss er höchstens tauschen?',
  liste: [41, 17, 58, 23, 66, 12, 35, 29],
  zufall() { return { liste: zufallZahlen(8, 10, 99) }; },
  code: [
    'def selection_sort(liste):',
    '    n = len(liste)',
    '    for start in range(n - 1):',
    '        kleinster = start',
    '        for i in range(start + 1, n):',
    '            if liste[i] < liste[kleinster]:',
    '                kleinster = i',
    '        liste[start], liste[kleinster] = liste[kleinster], liste[start]',
    '    return liste',
  ],
  *schritte(startListe) {
    const a = startListe.slice(); const n = a.length; let cmp = 0, tausch = 0;
    yield { arr: a.slice(), line: 1, cnt: { Durchgang: 0, Vergleiche: 0, Tausch: 0 }, msg: `Start: ${n} Elemente. Der sortierte Teil (links) ist noch leer.` };
    for (let s = 0; s < n - 1; s++) {
      const fest = alleIdx(s);
      let k = s;
      yield { arr: a.slice(), ptr: { start: s, min: k }, fertig: fest, line: 3, cnt: { Durchgang: s + 1, Vergleiche: cmp, Tausch: tausch },
              msg: `Durchgang ${s + 1}: Suche das kleinste Element ab Index ${s}. Bisher kleinstes: ${a[k]} (Index ${k}).` };
      for (let i = s + 1; i < n; i++) {
        cmp += 1;
        const kleiner = a[i] < a[k];
        yield { arr: a.slice(), ptr: { start: s, min: k, i }, focus: [i], fertig: fest, line: 5, cnt: { Durchgang: s + 1, Vergleiche: cmp, Tausch: tausch },
                msg: `Vergleich ${cmp}: ${a[i]} ${kleiner ? '<' : '≥'} ${a[k]} – ${kleiner ? 'neues kleinstes Element.' : 'bleibt.'}` };
        if (kleiner) {
          k = i;
          yield { arr: a.slice(), ptr: { start: s, min: k }, fertig: fest, line: 6, cnt: { Durchgang: s + 1, Vergleiche: cmp, Tausch: tausch }, msg: `kleinster = ${k}` };
        }
      }
      if (k !== s) {
        [a[s], a[k]] = [a[k], a[s]]; tausch += 1;
        yield { arr: a.slice(), tausch: [s, k], focus: [s, k], fertig: fest, line: 7, cnt: { Durchgang: s + 1, Vergleiche: cmp, Tausch: tausch },
                msg: `Tausch Nr. ${tausch}: ${a[s]} (Index ${k}) kommt nach vorn auf Index ${s}.` };
      } else {
        yield { arr: a.slice(), ptr: { start: s }, fertig: fest, line: 7, cnt: { Durchgang: s + 1, Vergleiche: cmp, Tausch: tausch },
                msg: `${a[s]} steht schon vorn – der Tausch mit sich selbst ändert nichts.` };
      }
      yield { arr: a.slice(), fertig: alleIdx(s + 1), line: 2, cnt: { Durchgang: s + 1, Vergleiche: cmp, Tausch: tausch },
              msg: `Der sortierte Teil reicht jetzt bis Index ${s}.` };
    }
    yield { arr: a.slice(), fertig: alleIdx(n), line: 8, cnt: { Durchgang: n - 1, Vergleiche: cmp, Tausch: tausch }, ende: true,
            msg: `Fertig sortiert: ${cmp} Vergleiche, ${tausch} Tauschvorgänge (höchstens ${n - 1} wären möglich). return liste` };
  },
  parsons: {
    zeilen: [
      { code: 'def selection_sort(liste):', e: 0 },
      { code: 'n = len(liste)', e: 1 },
      { code: 'for start in range(n - 1):', e: 1 },
      { code: 'kleinster = start', e: 2 },
      { code: 'for i in range(start + 1, n):', e: 2 },
      { code: 'if liste[i] < liste[kleinster]:', e: 3 },
      { code: 'kleinster = i', e: 4 },
      { code: 'liste[start], liste[kleinster] = liste[kleinster], liste[start]', e: 2 },
      { code: 'return liste', e: 1 },
    ],
    stoerer: [{ code: 'kleinster = liste[i]', e: 4 }],
  },
  aufgabe: {
    text: 'Schreibe die Funktion <code>selection_sort(liste)</code>. Sie sortiert die Liste aufsteigend und gibt sie zurück.',
    starter: 'def selection_sort(liste):\n    n = len(liste)\n    # dein Code\n',
    tests: [
      { name: 'Palettenreihe', call: 'selection_sort([41, 17, 58, 23, 66, 12, 35, 29])', expect: '[12, 17, 23, 29, 35, 41, 58, 66]' },
      { name: 'schon sortiert', call: 'selection_sort([1, 2, 3])', expect: '[1, 2, 3]' },
      { name: 'absteigend', call: 'selection_sort([3, 2, 1])', expect: '[1, 2, 3]' },
      { name: 'doppelte Werte', call: 'selection_sort([5, 1, 5, 1])', expect: '[1, 1, 5, 5]' },
      { name: 'leere Liste', call: 'selection_sort([])', expect: '[]' },
    ],
    tipps: [
      'Die äußere Schleife läuft über <code>start</code>; merke dir am Anfang <code>kleinster = start</code>.',
      'Die innere Schleife läuft von <code>start + 1</code> bis <code>n</code> und merkt sich den <b>Index</b> des kleinsten Werts: <code>kleinster = i</code>.',
      'Nach der inneren Schleife einmal tauschen: <code>liste[start], liste[kleinster] = liste[kleinster], liste[start]</code>. Am Ende <code>return liste</code>.',
    ],
  },
  vertiefung: {
    text: 'Erweiterung: <code>selection_sort_absteigend(liste)</code> sortiert die Bestenliste so, dass die höchste Zahl zuerst steht.',
    starter: 'def selection_sort_absteigend(liste):\n    n = len(liste)\n    # dein Code\n',
    tests: [
      { name: 'Palettenreihe absteigend', call: 'selection_sort_absteigend([41, 17, 58, 23, 66, 12, 35, 29])', expect: '[66, 58, 41, 35, 29, 23, 17, 12]' },
      { name: '[1, 2, 3] → [3, 2, 1]', call: 'selection_sort_absteigend([1, 2, 3])', expect: '[3, 2, 1]' },
      { name: 'leere Liste', call: 'selection_sort_absteigend([])', expect: '[]' },
    ],
    tipps: ['Suche statt des kleinsten das <b>größte</b> Element: Vergleich mit <code>&gt;</code>, Variable zum Beispiel <code>groesster</code>.'],
  },
};
