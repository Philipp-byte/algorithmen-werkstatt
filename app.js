/* Algorithmen-Werkstatt — Seitenlogik: Ansehen (Player), Selbst machen (Trainer),
   Code bauen (Puzzle), Code schreiben (Editor + Python-Tests). Vanilla JS, keine Abhaengigkeiten. */
'use strict';
(function () {
  const key = document.body.dataset.algo;
  const A = ALGOS[key];
  if (!A) return;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const istSuche = A.art === 'suche';

  /* ---------------------------------------------------------- Fortschritt */
  const SPEICHER = 'algowerkstatt.v1';
  function ladeAlles() { try { return JSON.parse(localStorage.getItem(SPEICHER) || '{}'); } catch (e) { return {}; } }
  function merke(feld, wert) {
    const f = ladeAlles(); f[key] = f[key] || {}; f[key][feld] = wert;
    try { localStorage.setItem(SPEICHER, JSON.stringify(f)); } catch (e) { /* privater Modus */ }
    zeigeFortschritt();
  }
  function zeigeFortschritt() {
    const f = ladeAlles()[key] || {};
    $$('.tabs button').forEach(b => b.classList.toggle('fertig', !!f[b.dataset.tab]));
  }

  /* ---------------------------------------------------------- Kopf und Tabs */
  document.title = A.name + ' – Algorithmen-Werkstatt';
  $('#titel').textContent = A.name;
  $('#kurz').textContent = A.kurz;
  $('#fall').innerHTML = A.fallText;
  $$('.top nav a').forEach(a => a.classList.toggle('aktiv', a.getAttribute('href') === A.datei));

  function zeigeTab(name) {
    $$('.tabs button').forEach(b => b.classList.toggle('aktiv', b.dataset.tab === name));
    $$('.panel').forEach(p => p.classList.toggle('aktiv', p.id === 'tab-' + name));
    if (history.replaceState) history.replaceState(null, '', '#' + name);
    if (name !== 'ansehen') animStop();
  }
  $$('.tabs button').forEach(b => b.addEventListener('click', () => zeigeTab(b.dataset.tab)));

  /* ---------------------------------------------------------- Darstellung der Liste */
  function renderListe(el, st, opts) {
    opts = opts || {};
    el.innerHTML = '';
    const ptr = st.ptr || {};
    st.arr.forEach((v, i) => {
      const z = document.createElement('div'); z.className = 'zelle';
      const chips = document.createElement('div'); chips.className = 'chips';
      Object.keys(ptr).forEach(name => {
        if (ptr[name] === i) { const c = document.createElement('span'); c.className = 'chip ' + name; c.textContent = name; chips.appendChild(c); }
      });
      const box = document.createElement('div'); box.className = 'box'; box.textContent = v;
      if ((st.focus || []).includes(i)) box.classList.add('fokus');
      if ((st.raus || []).includes(i)) box.classList.add('raus');
      if ((st.fertig || []).includes(i)) box.classList.add('fertig');
      if (st.gefunden === i) box.classList.add('gefunden');
      if ((st.tausch || []).includes(i)) box.classList.add('tausch');
      if (ptr.min === i) box.classList.add('min');
      if (opts.klickbar && (typeof opts.klickbar !== 'function' || opts.klickbar(i))) {
        box.classList.add('klickbar');
        box.addEventListener('click', () => opts.onClick(i));
      }
      const idx = document.createElement('div'); idx.className = 'idx'; idx.textContent = i;
      z.append(chips, box, idx);
      el.appendChild(z);
    });
  }

  function hervorheben(zeile) {
    let s = zeile.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/(#.*)$/, '<span class="cmt">$1</span>');
    s = s.replace(/\b(def|for|in|if|elif|else|while|return|range|len|and|or|not|True|False|None|pass|break)\b/g, '<span class="kw">$1</span>');
    s = s.replace(/\b(-?\d+)\b/g, '<span class="num">$1</span>');
    s = s.replace(/<span class="kw">def<\/span> (\w+)/, '<span class="kw">def</span> <span class="fn">$1</span>');
    return s;
  }
  function renderCode(pre, zeilen, aktiv) {
    pre.innerHTML = zeilen.map((z, i) =>
      `<span class="z${i === aktiv ? ' aktiv' : ''}"><span class="ln">${i + 1}</span>${hervorheben(z)}</span>`).join('');
  }
  function zaehlerAnzeigen(el, cnt) {
    el.innerHTML = Object.keys(cnt || {}).map(k => `<span>${k}: <b>${cnt[k]}</b></span>`).join('');
  }
  const GANZZAHL = /^[+-]?\d+$/;
  function parseListe(text) {
    const teile = text.split(/[,;\s]+/).filter(Boolean);
    if (!teile.length || teile.some(t => !GANZZAHL.test(t))) return null;
    return teile.map(t => Number(t));
  }
  function meldung(el, text, art) {
    el.textContent = text; el.className = 'meldung' + (art ? ' ' + art : '');
  }

  /* ---------------------------------------------------------- Eingaben (Liste / gesuchter Wert) */
  // Aenderungen gelten sofort: kurz nach dem Tippen, bei Enter und beim Verlassen des Feldes.
  // Ungueltige Eingaben werden unter den Feldern gemeldet; die Anzeige behaelt dann den letzten gueltigen Stand.
  function pruefeEingaben(textListe, textZiel) {
    const liste = parseListe(textListe);
    if (!liste || liste.length < 2 || liste.length > 16) return { feld: 'liste', fehler: 'Bitte 2 bis 16 ganze Zahlen eingeben, durch Kommas getrennt.' };
    if (liste.some(z => z < -999 || z > 9999)) return { feld: 'liste', fehler: 'Bitte nur Zahlen von −999 bis 9999 verwenden.' };
    const sortiert = A.sortiert ? liste.slice().sort((a, b) => a - b) : liste;
    const umsortiert = sortiert.some((z, i) => z !== liste[i]);
    if (!istSuche) return { liste: sortiert, gesucht: null, umsortiert };
    const t = textZiel.trim();
    if (!t) return { feld: 'ziel', fehler: 'Bitte einen gesuchten Wert eingeben.' };
    if (!GANZZAHL.test(t)) return { feld: 'ziel', fehler: 'Der gesuchte Wert muss eine ganze Zahl sein.' };
    return { liste: sortiert, gesucht: Number(t), umsortiert };
  }
  function eingabenBauen(container, onUebernehmen, tipp) {
    container.innerHTML = `
      <div class="zeile"><span>Liste:</span><input type="text" class="liste" spellcheck="false" aria-label="Liste"></div>
      <div class="zeile">${istSuche ? '<span>gesucht:</span><input type="text" class="ziel" inputmode="numeric" aria-label="gesuchter Wert">' : ''}
        <button class="btn klein sekundaer fallknopf">Fall-Daten</button>
        <button class="btn klein sekundaer zufallknopf">Zufallsliste</button>
        <button class="btn klein uebernehmen">Übernehmen</button></div>
      <div class="eingabe-status" aria-live="polite"></div>`;
    const inListe = $('.liste', container), inZiel = $('.ziel', container), statusEl = $('.eingabe-status', container);
    let zuletzt = null, timer = null;
    function zeigeStatus(text, art) { statusEl.textContent = text; statusEl.className = 'eingabe-status' + (art ? ' ' + art : ''); }
    function zeigeOk(liste, gesucht, umsortiert) {
      [inListe, inZiel].forEach(f => f && f.classList.remove('ungueltig'));
      let text = istSuche ? `Angezeigt: Suche nach ${gesucht} in einer Liste mit ${liste.length} Zahlen.` : `Angezeigt: Liste mit ${liste.length} Zahlen.`;
      if (umsortiert) text += ' Die binäre Suche braucht eine sortierte Liste – deine Zahlen wurden der Größe nach sortiert.';
      if (tipp) text += ' ' + tipp;
      zeigeStatus(text, umsortiert ? 'hinweis' : '');
    }
    function uebernehme(liste, gesucht, umsortiert) {
      clearTimeout(timer);
      inListe.value = liste.join(', '); if (inZiel) inZiel.value = gesucht;
      zuletzt = JSON.stringify([liste, gesucht]);
      zeigeOk(liste, gesucht, umsortiert);
      onUebernehmen(liste.slice(), gesucht);
    }
    // art: 'tippen' (waehrend der Eingabe), 'fertig' (Enter / Feld verlassen), 'knopf' (Übernehmen, startet immer neu)
    function ausFeldern(art) {
      clearTimeout(timer);
      const e = pruefeEingaben(inListe.value, inZiel ? inZiel.value : '');
      if (e.fehler) {
        [inListe, inZiel].forEach(f => f && f.classList.toggle('ungueltig', f === (e.feld === 'ziel' ? inZiel : inListe)));
        zeigeStatus(e.fehler + (zuletzt ? ' Angezeigt wird noch die letzte gültige Eingabe.' : ''), 'err');
        return;
      }
      if (art !== 'knopf' && JSON.stringify([e.liste, e.gesucht]) === zuletzt) {
        if (art === 'fertig') inListe.value = e.liste.join(', ');
        zeigeOk(e.liste, e.gesucht, e.umsortiert);
        return;
      }
      if (art === 'tippen') {
        // das Feld nicht umschreiben, solange getippt wird
        zuletzt = JSON.stringify([e.liste, e.gesucht]);
        zeigeOk(e.liste, e.gesucht, e.umsortiert);
        onUebernehmen(e.liste.slice(), e.gesucht);
        return;
      }
      uebernehme(e.liste, e.gesucht, e.umsortiert);
    }
    [inListe, inZiel].forEach(f => {
      if (!f) return;
      f.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => ausFeldern('tippen'), 600); });
      f.addEventListener('change', () => ausFeldern('fertig'));
      f.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); ausFeldern('fertig'); } });
    });
    $('.fallknopf', container).addEventListener('click', () => uebernehme(A.liste.slice(), A.gesucht, false));
    $('.zufallknopf', container).addEventListener('click', () => { const z = A.zufall(); uebernehme(z.liste, z.gesucht, false); });
    $('.uebernehmen', container).addEventListener('click', () => ausFeldern('knopf'));
    inListe.value = A.liste.join(', '); if (inZiel) inZiel.value = A.gesucht;
    zuletzt = JSON.stringify([A.liste, istSuche ? A.gesucht : null]);
    zeigeOk(A.liste, A.gesucht, false);
    return {
      setze(liste, gesucht) { uebernehme(liste.slice(), gesucht, false); },
      waehle(gesucht) { if (inZiel) { inZiel.value = gesucht; ausFeldern('fertig'); } },
    };
  }

  /* ============================================================ 1 ANSEHEN */
  const anim = { schritte: [], k: 0, timer: null, liste: A.liste.slice(), gesucht: A.gesucht };
  const animListe = $('#anim-liste'), animMsg = $('#anim-msg'), animCnt = $('#anim-zaehler'), animCode = $('#anim-code'), animPos = $('#anim-pos');

  function animNeu() {
    anim.schritte = Array.from(istSuche ? A.schritte(anim.liste, anim.gesucht) : A.schritte(anim.liste));
    anim.k = 0; animStop(); animZeige();
  }
  function animZeige() {
    const s = anim.schritte[anim.k];
    // bei den Suchen: eine Zahl anklicken = als gesuchten Wert nehmen
    renderListe(animListe, s, istSuche ? { klickbar: true, onClick: i => animEin.waehle(anim.liste[i]) } : {});
    meldung(animMsg, s.msg, s.ende ? 'ok' : '');
    zaehlerAnzeigen(animCnt, s.cnt);
    renderCode(animCode, A.code, s.line);
    animPos.textContent = `Schritt ${anim.k + 1} von ${anim.schritte.length}`;
    $('#anim-zurueck').disabled = anim.k === 0;
    $('#anim-vor').disabled = anim.k >= anim.schritte.length - 1;
    if (s.ende) { merke('ansehen', true); animStop(); }
  }
  function animStop() { if (anim.timer) { clearInterval(anim.timer); anim.timer = null; } const b = $('#anim-play'); if (b) b.textContent = '▶ Abspielen'; }
  function animPlay() {
    if (anim.timer) { animStop(); return; }
    if (anim.k >= anim.schritte.length - 1) { anim.k = 0; animZeige(); }
    const tempo = () => 1700 - Number($('#anim-tempo').value) * 150;
    $('#anim-play').textContent = '⏸ Pause';
    anim.timer = setInterval(() => {
      if (anim.k >= anim.schritte.length - 1) { animStop(); return; }
      anim.k += 1; animZeige();
    }, tempo());
  }
  $('#anim-start').addEventListener('click', () => { anim.k = 0; animStop(); animZeige(); });
  $('#anim-zurueck').addEventListener('click', () => { animStop(); if (anim.k > 0) { anim.k -= 1; animZeige(); } });
  $('#anim-vor').addEventListener('click', () => { animStop(); if (anim.k < anim.schritte.length - 1) { anim.k += 1; animZeige(); } });
  $('#anim-play').addEventListener('click', animPlay);
  $('#anim-tempo').addEventListener('input', () => { if (anim.timer) { animStop(); animPlay(); } });
  const animEin = eingabenBauen($('#anim-eingaben'), (liste, gesucht) => { anim.liste = liste; anim.gesucht = gesucht; animNeu(); },
    istSuche ? 'Tipp: Klicke eine Zahl in der Liste an, um sie zu suchen.' : '');
  if (istSuche && A.alternative) {
    const b = document.createElement('button'); b.className = 'btn klein sekundaer'; b.textContent = `Fall: ${A.alternative} (fehlt)`;
    $('#anim-eingaben .uebernehmen').before(b);
    b.addEventListener('click', () => animEin.setze(A.liste, A.alternative));
  }
  document.addEventListener('keydown', e => {
    if (!$('#tab-ansehen').classList.contains('aktiv') || /INPUT|TEXTAREA/.test(document.activeElement.tagName) || document.activeElement.classList.contains('CodeMirror-code')) return;
    if (e.key === 'ArrowRight') { $('#anim-vor').click(); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { $('#anim-zurueck').click(); e.preventDefault(); }
    if (e.key === ' ') { animPlay(); e.preventDefault(); }
  });
  animNeu();

  /* ============================================================ 2 SELBST MACHEN */
  const trListe = $('#tr-liste'), trFrage = $('#tr-frage'), trWahl = $('#tr-wahl'), trMsg = $('#tr-msg'), trCnt = $('#tr-zaehler'), trZusammen = $('#tr-zusammenfassung');
  let T = null, trDaten = { liste: A.liste.slice(), gesucht: A.gesucht };

  const TRAINER = {
    linear: {
      start(d) { return { liste: d.liste, gesucht: d.gesucht, i: 0, cmp: 0, fehler: 0, phase: 'klick', gepr: [], fertig: false, ergebnis: null }; },
      sicht(t) {
        const st = { arr: t.liste, raus: t.gepr.slice(), ptr: {}, focus: [] };
        if (t.phase === 'frage') { st.ptr.i = t.i; st.focus = [t.i]; }
        if (t.fertig && t.ergebnis >= 0) { st.gefunden = t.ergebnis; st.ptr.i = t.ergebnis; }
        const v = { st, cnt: { Vergleiche: t.cmp, Fehler: t.fehler } };
        if (t.fertig) { v.frage = ''; v.wahl = []; return v; }
        if (t.phase === 'klick') { v.frage = 'Welches Element wird als Nächstes verglichen? Klicke es an.'; v.klickbar = i => !t.gepr.includes(i); v.wahl = []; }
        if (t.phase === 'frage') { v.frage = `liste[${t.i}] ist ${t.liste[t.i]}. Ist das der gesuchte Wert ${t.gesucht}?`; v.wahl = [{ id: 'ja', label: 'Ja – gefunden!' }, { id: 'nein', label: 'Nein – weiter' }]; }
        if (t.phase === 'ende') { v.frage = 'Alle Elemente wurden verglichen. Was gilt jetzt?'; v.wahl = [{ id: 'weiter', label: 'Weiter suchen' }, { id: 'fehlt', label: `${t.gesucht} ist nicht in der Liste` }]; }
        return v;
      },
      klick(t, i) {
        if (t.phase !== 'klick') return null;
        if (i === t.i) { t.cmp += 1; t.phase = 'frage'; return { ok: true, text: `Richtig: Vergleich ${t.cmp} mit Index ${t.i}.` }; }
        t.fehler += 1;
        return { ok: false, text: t.i === 0 ? 'Die lineare Suche beginnt beim ersten Element (Index 0).' : `Nicht dieses Element. Die lineare Suche geht der Reihe nach weiter – welcher Index kommt nach ${t.i - 1}?` };
      },
      wahl(t, id) {
        const v = t.liste[t.i], g = t.gesucht;
        if (t.phase === 'frage') {
          const richtig = v === g ? 'ja' : 'nein';
          if (id !== richtig) { t.fehler += 1; return { ok: false, text: `Schau genau hin: ${v} und ${g} sind ${v === g ? 'gleich' : 'verschieden'}.` }; }
          if (id === 'ja') { t.fertig = true; t.ergebnis = t.i; return { ok: true, text: `Gefunden bei Index ${t.i} nach ${t.cmp} Vergleichen.` }; }
          t.gepr.push(t.i); t.i += 1;
          t.phase = t.i >= t.liste.length ? 'ende' : 'klick';
          return { ok: true, text: 'Richtig, nicht gleich – weiter zum nächsten Element.' };
        }
        if (t.phase === 'ende') {
          if (id === 'fehlt') { t.fertig = true; t.ergebnis = -1; return { ok: true, text: `Richtig: ${g} fehlt. Die Funktion gibt -1 zurück – nach ${t.cmp} Vergleichen.` }; }
          t.fehler += 1; return { ok: false, text: 'Es gibt kein nächstes Element mehr – die Liste ist zu Ende. Was bedeutet das für den gesuchten Wert?' };
        }
        return null;
      },
      zusammenfassung(t) { return `<b>Fertig!</b> ${t.cmp} Vergleiche · ${t.ergebnis >= 0 ? 'gefunden bei Index ' + t.ergebnis : t.gesucht + ' ist nicht in der Liste'} · Fehler: ${t.fehler}<br>Trag Liste, gesuchten Wert, Index und Vergleiche in dein Arbeitsblatt ein.`; },
    },

    binary: {
      start(d) { return { liste: d.liste, gesucht: d.gesucht, l: 0, r: d.liste.length - 1, m: null, cmp: 0, fehler: 0, phase: 'mitte', fertig: false, ergebnis: null }; },
      sicht(t) {
        const n = t.liste.length;
        const st = { arr: t.liste, ptr: { links: t.l, rechts: t.r }, raus: [], focus: [] };
        for (let i = 0; i < n; i++) if (i < t.l || i > t.r) st.raus.push(i);
        if (t.phase === 'richtung') { st.ptr.mitte = t.m; st.focus = [t.m]; }
        if (t.fertig && t.ergebnis >= 0) { st.gefunden = t.ergebnis; st.ptr = { mitte: t.ergebnis }; st.raus = []; }
        if (t.fertig && t.ergebnis < 0) { st.raus = st.arr.map((_, i) => i); st.ptr = {}; }
        const v = { st, cnt: { Vergleiche: t.cmp, Fehler: t.fehler } };
        if (t.fertig) { v.frage = ''; v.wahl = []; return v; }
        if (t.phase === 'mitte') { v.frage = `Suchbereich: links = ${t.l}, rechts = ${t.r}. Klicke die Mitte an.`; v.klickbar = i => i >= t.l && i <= t.r; v.wahl = []; }
        if (t.phase === 'richtung') { v.frage = `liste[${t.m}] ist ${t.liste[t.m]}. Wie geht es weiter mit dem gesuchten Wert ${t.gesucht}?`; v.wahl = [{ id: 'gefunden', label: 'Gefunden!' }, { id: 'links', label: 'Links weitersuchen' }, { id: 'rechts', label: 'Rechts weitersuchen' }]; }
        if (t.phase === 'leer') { v.frage = `Jetzt ist links = ${t.l} und rechts = ${t.r}. Was gilt?`; v.wahl = [{ id: 'weiter', label: 'Weiter suchen' }, { id: 'fehlt', label: `${t.gesucht} fehlt` }]; }
        return v;
      },
      klick(t, i) {
        if (t.phase !== 'mitte') return null;
        const m = Math.floor((t.l + t.r) / 2);
        if (i === m) { t.m = m; t.cmp += 1; t.phase = 'richtung'; return { ok: true, text: `Richtig: (${t.l} + ${t.r}) // 2 = ${m}.` }; }
        t.fehler += 1;
        return { ok: false, text: `Das ist nicht die Mitte. Rechne (links + rechts) // 2 mit links = ${t.l} und rechts = ${t.r} – abgerundet.` };
      },
      wahl(t, id) {
        const v = t.liste[t.m], g = t.gesucht;
        if (t.phase === 'richtung') {
          const richtig = v === g ? 'gefunden' : (v < g ? 'rechts' : 'links');
          if (id !== richtig) { t.fehler += 1; return { ok: false, text: v === g ? `${v} ist genau der gesuchte Wert.` : `Vergleiche: ${v} ist ${v < g ? 'kleiner' : 'größer'} als ${g}. In welcher Hälfte kann ${g} dann noch stehen?` }; }
          if (id === 'gefunden') { t.fertig = true; t.ergebnis = t.m; return { ok: true, text: `Gefunden bei Index ${t.m} nach ${t.cmp} Vergleichen.` }; }
          if (id === 'rechts') t.l = t.m + 1; else t.r = t.m - 1;
          t.phase = t.l > t.r ? 'leer' : 'mitte';
          return { ok: true, text: id === 'rechts' ? `Richtig: links = ${t.m} + 1 = ${t.l}.` : `Richtig: rechts = ${t.m} − 1 = ${t.r}.` };
        }
        if (t.phase === 'leer') {
          if (id === 'fehlt') { t.fertig = true; t.ergebnis = -1; return { ok: true, text: `Richtig: links ist größer als rechts, der Bereich ist leer. ${g} fehlt – nach ${t.cmp} Vergleichen.` }; }
          t.fehler += 1; return { ok: false, text: 'Der Suchbereich hat kein Element mehr – links liegt rechts von rechts. Kann der Wert noch irgendwo stehen?' };
        }
        return null;
      },
      zusammenfassung(t) { return `<b>Fertig!</b> ${t.cmp} Vergleiche · ${t.ergebnis >= 0 ? 'gefunden bei Index ' + t.ergebnis : t.gesucht + ' fehlt'} · Fehler: ${t.fehler}<br>Bei ${t.liste.length} Einträgen braucht die binäre Suche höchstens ${Math.floor(Math.log2(t.liste.length)) + 1} Vergleiche.`; },
    },

    bubble: {
      start(d) { return { a: d.liste.slice(), n: d.liste.length, d: 0, j: 0, cmp: 0, tausch: 0, tauschD: 0, fehler: 0, phase: 'paar', fertig: false, fertigNach: null }; },
      sicht(t) {
        const fest = []; for (let i = 0; i < t.n; i++) if (i >= t.n - t.d - (t.phase === 'durchgang' ? 1 : 0)) fest.push(i);
        const st = { arr: t.a, fertig: t.fertig ? t.a.map((_, i) => i) : fest, focus: t.phase === 'paar' && !t.fertig ? [t.j, t.j + 1] : [] };
        const v = { st, cnt: { Durchgang: t.d + 1 > t.n - 1 ? t.n - 1 : t.d + 1, Vergleiche: t.cmp, Tausch: t.tausch, Fehler: t.fehler } };
        if (t.fertig) { v.frage = ''; v.wahl = []; return v; }
        if (t.phase === 'paar') { v.frage = `Durchgang ${t.d + 1}: Vergleiche ${t.a[t.j]} (Index ${t.j}) und ${t.a[t.j + 1]} (Index ${t.j + 1}). Tauschen?`; v.wahl = [{ id: 'ja', label: 'Tauschen' }, { id: 'nein', label: 'Nicht tauschen' }]; }
        if (t.phase === 'durchgang') {
          if (t.tauschD === 0) { v.frage = `Durchgang ${t.d + 1} beendet – es wurde nichts getauscht. Was heißt das?`; v.wahl = [{ id: 'sortiert', label: 'Die Liste ist fertig sortiert' }, { id: 'weiter', label: 'Weitermachen bis zum letzten Durchgang' }]; }
          else { v.frage = `Durchgang ${t.d + 1} beendet: ${t.tauschD} Tauschvorgänge. ${t.a[t.n - 1 - t.d]} steht jetzt fest.`; v.wahl = [{ id: 'weiter', label: 'Nächster Durchgang' }]; }
        }
        return v;
      },
      klick() { return null; },
      wahl(t, id) {
        if (t.phase === 'paar') {
          const a = t.a[t.j], b = t.a[t.j + 1];
          const richtig = a > b ? 'ja' : 'nein';
          if (id !== richtig) { t.fehler += 1; return { ok: false, text: `Getauscht wird nur, wenn der linke Wert größer ist: ${a} ist ${a > b ? 'größer' : 'nicht größer'} als ${b}.` }; }
          t.cmp += 1;
          if (id === 'ja') { t.a[t.j] = b; t.a[t.j + 1] = a; t.tausch += 1; t.tauschD += 1; }
          t.j += 1;
          if (t.j >= t.n - 1 - t.d) {
            t.phase = 'durchgang';
            if (t.tauschD > 0) t.fertigNach = t.d + 1;
            if (t.d + 1 >= t.n - 1 && t.tauschD > 0) { t.fertig = true; if (t.fertigNach === null) t.fertigNach = 0; }
            return { ok: true, text: `Richtig. Durchgang ${t.d + 1} ist beendet.` };
          }
          return { ok: true, text: id === 'ja' ? `Richtig, getauscht: ${b} vor ${a}.` : 'Richtig, nichts getauscht.' };
        }
        if (t.phase === 'durchgang') {
          if (t.tauschD === 0 && id === 'weiter') { t.fehler += 1; return { ok: false, text: 'Ohne Tausch ist jedes Paar schon in der richtigen Reihenfolge – dann ist die Liste sortiert. Der einfache Bubble Sort würde trotzdem weiterlaufen (ohne etwas zu ändern).' }; }
          if (t.tauschD === 0 && id === 'sortiert') { t.fertig = true; if (t.fertigNach === null) t.fertigNach = 0; return { ok: true, text: 'Richtig. Mit einem Merker (Aufgabe 9 auf dem Blatt) hört der Algorithmus genau hier auf.' }; }
          t.d += 1; t.j = 0; t.tauschD = 0; t.phase = 'paar';
          if (t.d >= t.n - 1) { t.fertig = true; }
          return { ok: true, text: `Durchgang ${t.d + 1} beginnt.` };
        }
        return null;
      },
      zusammenfassung(t) { return `<b>Fertig!</b> Sortiert nach Durchgang ${t.fertigNach} · ${t.tausch} Tauschvorgänge · ${t.cmp} Vergleiche · Fehler: ${t.fehler}<br>Ohne Abbruch macht Bubble Sort bei ${t.n} Elementen immer ${t.n * (t.n - 1) / 2} Vergleiche.`; },
    },

    selection: {
      start(d) { return { a: d.liste.slice(), n: d.liste.length, s: 0, k: null, cmp: 0, tausch: 0, fehler: 0, phase: 'min', fertig: false }; },
      sicht(t) {
        const fest = []; for (let i = 0; i < t.s; i++) fest.push(i);
        const st = { arr: t.a, fertig: t.fertig ? t.a.map((_, i) => i) : fest, ptr: {}, focus: [] };
        if (!t.fertig) { st.ptr.start = t.s; if (t.phase === 'tausch') { st.ptr.min = t.k; st.focus = [t.k]; } }
        const v = { st, cnt: { Durchgang: Math.min(t.s + 1, t.n - 1), Vergleiche: t.cmp, Tausch: t.tausch, Fehler: t.fehler } };
        if (t.fertig) { v.frage = ''; v.wahl = []; return v; }
        if (t.phase === 'min') { v.frage = `Durchgang ${t.s + 1}: Klicke das kleinste Element im unsortierten Teil (ab Index ${t.s}).`; v.klickbar = i => i >= t.s; v.wahl = []; }
        if (t.phase === 'tausch') { v.frage = `Kleinstes Element: ${t.a[t.k]} an Index ${t.k}. Muss getauscht werden?`; v.wahl = [{ id: 'ja', label: `Tauschen mit Index ${t.s}` }, { id: 'nein', label: 'Kein Tausch nötig' }]; }
        return v;
      },
      klick(t, i) {
        if (t.phase !== 'min') return null;
        let min = Infinity; for (let x = t.s; x < t.n; x++) min = Math.min(min, t.a[x]);
        if (t.a[i] === min) { t.k = i; t.cmp += t.n - 1 - t.s; t.phase = 'tausch'; return { ok: true, text: `Richtig: ${t.a[i]} ist das kleinste Element ab Index ${t.s} (${t.n - 1 - t.s} Vergleiche).` }; }
        t.fehler += 1;
        return { ok: false, text: `${t.a[i]} ist nicht das kleinste – ab Index ${t.s} gibt es noch einen kleineren Wert. Schau alle Werte des unsortierten Teils an.` };
      },
      wahl(t, id) {
        if (t.phase !== 'tausch') return null;
        const richtig = t.k !== t.s ? 'ja' : 'nein';
        if (id !== richtig) { t.fehler += 1; return { ok: false, text: t.k === t.s ? `${t.a[t.k]} steht schon auf Index ${t.s} – ein Tausch würde nichts ändern.` : `${t.a[t.k]} steht auf Index ${t.k}, gehört aber auf Index ${t.s}.` }; }
        let text;
        if (id === 'ja') { const tmp = t.a[t.s]; t.a[t.s] = t.a[t.k]; t.a[t.k] = tmp; t.tausch += 1; text = `Getauscht: ${t.a[t.s]} steht jetzt auf Index ${t.s}.`; }
        else text = 'Richtig, kein Tausch nötig.';
        t.s += 1; t.k = null; t.phase = 'min';
        if (t.s >= t.n - 1) t.fertig = true;
        return { ok: true, text };
      },
      zusammenfassung(t) { return `<b>Fertig!</b> ${t.tausch} Tauschvorgänge (höchstens ${t.n - 1} wären möglich) · ${t.cmp} Vergleiche (${t.n} · ${t.n - 1} / 2) · Fehler: ${t.fehler}`; },
    },
  };
  const TR = TRAINER[key];

  function trStart() {
    T = TR.start(trDaten);
    trZusammen.style.display = 'none';
    meldung(trMsg, 'Los geht’s. Die Website prüft jeden Schritt.', '');
    trRender();
  }
  function trRender() {
    const v = TR.sicht(T);
    renderListe(trListe, v.st, { klickbar: v.klickbar || false, onClick: i => { const r = TR.klick(T, i); trFeedback(r); } });
    zaehlerAnzeigen(trCnt, v.cnt);
    trFrage.textContent = v.frage || '';
    trWahl.innerHTML = '';
    (v.wahl || []).forEach(w => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = w.label; b.addEventListener('click', () => trFeedback(TR.wahl(T, w.id))); trWahl.appendChild(b); });
    if (T.fertig) {
      trZusammen.innerHTML = TR.zusammenfassung(T);
      trZusammen.style.display = 'block';
      const f = ladeAlles()[key] || {}; merke('selbst', (Number(f.selbst) || 0) + 1);
    }
  }
  function trFeedback(r) {
    if (!r) return;
    meldung(trMsg, r.text, r.ok ? 'ok' : 'err');
    trRender();
  }
  eingabenBauen($('#tr-eingaben'), (liste, gesucht) => { trDaten = { liste, gesucht }; trStart(); });
  $('#tr-neu').addEventListener('click', trStart);
  trStart();

  /* ============================================================ 3 CODE BAUEN */
  const P = { pool: [], prog: [] };
  const poolEl = $('#p-pool'), progEl = $('#p-prog'), pMsg = $('#p-msg');
  function pMischen(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  function pInit() {
    let id = 0;
    const alle = A.parsons.zeilen.map(z => ({ id: id++, code: z.code, e: 0, stoerer: false }))
      .concat((A.parsons.stoerer || []).map(z => ({ id: id++, code: z.code, e: 0, stoerer: true })));
    P.pool = pMischen(alle); P.prog = [];
    meldung(pMsg, 'Klicke Bausteine an oder ziehe sie nach rechts. Einrückung mit ◀ ▶ einstellen.', '');
    pRender();
  }
  function pZeile(it, imProg) {
    const el = document.createElement('div'); el.className = 'pzeile'; el.draggable = true; el.dataset.id = it.id;
    const text = document.createElement('span'); text.className = 'codetext';
    // Bausteine koennen mehrere Zeilen haben; jede bekommt die Grund-Einrueckung des Bausteins
    text.innerHTML = it.code.split('\n').map(l => (imProg ? `<span class="einr" style="--e:${it.e}"></span>` : '') + hervorheben(l)).join('\n');
    el.appendChild(text);
    if (imProg) {
      const k = document.createElement('span'); k.className = 'knoepfe';
      [['◀', () => { it.e = Math.max(0, it.e - 1); }], ['▶', () => { it.e = Math.min(6, it.e + 1); }],
       ['▲', () => { const i = P.prog.indexOf(it); if (i > 0) { P.prog.splice(i, 1); P.prog.splice(i - 1, 0, it); } }],
       ['▼', () => { const i = P.prog.indexOf(it); if (i < P.prog.length - 1) { P.prog.splice(i, 1); P.prog.splice(i + 1, 0, it); } }],
       ['✕', () => { P.prog = P.prog.filter(x => x !== it); it.e = 0; P.pool.push(it); }]]
      .forEach(([t, f]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.title = t === '✕' ? 'zurück zu den Bausteinen' : ''; b.addEventListener('click', ev => { ev.stopPropagation(); f(); pRender(); }); k.appendChild(b); });
      el.appendChild(k);
    } else {
      el.addEventListener('click', () => { P.pool = P.pool.filter(x => x !== it); P.prog.push(it); pRender(); });
    }
    el.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', String(it.id)); el.classList.add('dragging'); });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    if (imProg) {
      el.addEventListener('dragover', ev => { ev.preventDefault(); });
      el.addEventListener('drop', ev => { ev.preventDefault(); ev.stopPropagation(); pDrop(ev, P.prog.indexOf(it)); });
    }
    return el;
  }
  function pFinde(id) { return P.pool.concat(P.prog).find(x => x.id === Number(id)); }
  function pDrop(ev, position) {
    const it = pFinde(ev.dataTransfer.getData('text/plain')); if (!it) return;
    P.pool = P.pool.filter(x => x !== it); P.prog = P.prog.filter(x => x !== it);
    if (position === null || position < 0 || position > P.prog.length) P.prog.push(it); else P.prog.splice(position, 0, it);
    pRender();
  }
  function pRender() {
    poolEl.innerHTML = ''; progEl.innerHTML = '';
    P.pool.forEach(it => poolEl.appendChild(pZeile(it, false)));
    P.prog.forEach(it => progEl.appendChild(pZeile(it, true)));
    if (!P.prog.length) { const h = document.createElement('div'); h.className = 'hinweis-leer'; h.style.cssText = 'color:var(--muted);font-size:.9rem;padding:.6rem'; h.textContent = 'Hierher ziehen oder Bausteine links anklicken.'; progEl.appendChild(h); }
  }
  [progEl, poolEl].forEach(sp => {
    sp.addEventListener('dragover', ev => { ev.preventDefault(); sp.classList.add('dropziel'); });
    sp.addEventListener('dragleave', () => sp.classList.remove('dropziel'));
    sp.addEventListener('drop', ev => {
      ev.preventDefault(); sp.classList.remove('dropziel');
      if (sp === progEl) pDrop(ev, null);
      else { const it = pFinde(ev.dataTransfer.getData('text/plain')); if (it && P.prog.includes(it)) { P.prog = P.prog.filter(x => x !== it); it.e = 0; P.pool.push(it); pRender(); } }
    });
  });
  function pPruefen() {
    const soll = A.parsons.zeilen;
    $$('.pzeile', progEl).forEach(z => z.classList.remove('falsch', 'richtig'));
    const zeilen = $$('.pzeile', progEl);
    let erste = null;
    P.prog.forEach((it, idx) => {
      const s = soll[idx];
      let problem = null;
      if (it.stoerer) problem = 'gehört nicht ins Programm';
      else if (!s || it.code !== s.code) problem = 'steht an der falschen Stelle';
      else if (it.e !== s.e) problem = 'ist falsch eingerückt';
      if (problem) { zeilen[idx].classList.add('falsch'); if (erste === null) erste = { idx, problem }; }
      else zeilen[idx].classList.add('richtig');
    });
    if (erste === null && P.prog.length < soll.length) { meldung(pMsg, `Bis hierhin stimmt alles – es fehlen noch ${soll.length - P.prog.length} Zeile(n).`, 'hinweis'); return; }
    if (erste === null && P.prog.length > soll.length) { meldung(pMsg, 'Das Programm hat zu viele Zeilen. Eine gehört nicht dazu.', 'err'); return; }
    if (erste !== null) { meldung(pMsg, `Zeile ${erste.idx + 1} ${erste.problem}. Zeilen davor sind richtig – prüfe Reihenfolge und Einrückung ab dort.`, 'err'); return; }
    meldung(pMsg, 'Richtig! Das ist die vollständige Funktion. Du kannst sie in den Editor übernehmen und dort testen.', 'ok');
    merke('parsons', true);
    $('#p-uebernehmen').style.display = 'inline-block';
  }
  function pProgrammText() { return P.prog.map(it => it.code.split('\n').map(l => '    '.repeat(it.e) + l).join('\n')).join('\n') + '\n'; }
  $('#p-pruefen').addEventListener('click', pPruefen);
  $('#p-neu').addEventListener('click', () => { $('#p-uebernehmen').style.display = 'none'; pInit(); });
  $('#p-uebernehmen').addEventListener('click', () => { setzeCode(pProgrammText()); zeigeTab('code'); });
  pInit();

  /* ============================================================ 4 CODE SCHREIBEN */
  let cm = null; const ta = $('#editor-ta');
  let modus = 'grund';
  function editorInit() {
    if (window.CodeMirror) {
      cm = CodeMirror.fromTextArea(ta, { mode: 'python', lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false, lineWrapping: true, extraKeys: { Tab: cmInst => cmInst.replaceSelection('    ', 'end') } });
    } else { ta.className = 'fallback'; ta.style.display = 'block'; ta.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + 4; } }); }
  }
  function holeCode() { return cm ? cm.getValue() : ta.value; }
  function setzeCode(t) { if (cm) cm.setValue(t); else ta.value = t; }
  function aufgabeZeigen() {
    const q = modus === 'grund' ? A.aufgabe : A.vertiefung;
    $('#code-aufgabe').innerHTML = `<p>${q.text}</p>`;
    $('#code-tipps').innerHTML = q.tipps.map((t, i) => `<details><summary>Tipp ${i + 1}</summary><p>${t}</p></details>`).join('');
    $$('.umschalter button').forEach(b => b.classList.toggle('aktiv', b.dataset.modus === modus));
    $('#code-tests').innerHTML = ''; $('#code-ausgabe').textContent = '';
    if (!holeCode().trim() || $('#code-startknopf').dataset.zuletzt !== modus) { /* nichts */ }
  }
  $$('.umschalter button').forEach(b => b.addEventListener('click', () => { modus = b.dataset.modus; aufgabeZeigen(); }));
  $('#code-startknopf').addEventListener('click', () => {
    const q = modus === 'grund' ? A.aufgabe : A.vertiefung;
    if (holeCode().trim() && !confirm('Deinen bisherigen Code durch den Startcode ersetzen?')) return;
    setzeCode(q.starter); $('#code-startknopf').dataset.zuletzt = modus;
  });

  /* --- Python-Ausfuehrung: Worker mit Zeitlimit, Fallback im Hauptthread --- */
  let worker = null, workerBereit = false, workerWarten = null, laufId = 0;
  const statusEl = $('#code-status');
  function status(text, laden) { statusEl.innerHTML = (laden ? '<span class="laden"></span> ' : '') + text; }
  const LADEFEHLER = 'Python konnte nicht gestartet werden. Bist du online? Beim ersten Start werden rund 10 MB geladen.';
  function workerNeu() {
    try {
      worker = new Worker('runner-worker.js'); workerBereit = false;
      const w = worker; w.__erster = true;
      workerWarten = new Promise((ok, nein) => {
        const h = ev => {
          if (!ev.data || !ev.data.typ) return;
          w.removeEventListener('message', h);
          if (ev.data.typ === 'bereit') { workerBereit = true; ok(); } else nein(new Error(ev.data.text || LADEFEHLER));
        };
        w.addEventListener('message', h);
        w.addEventListener('error', () => nein(new Error(LADEFEHLER)), { once: true });
      });
      workerWarten.catch(() => {});
    } catch (e) { worker = null; workerBereit = false; workerWarten = null; }
  }
  async function laufen(code, tests) {
    if (!worker) return hauptthreadLaufen(code, tests);
    // Erst warten, bis Pyodide im Worker geladen ist (einmalig); das Zeitlimit gilt nur fuer den Programmlauf.
    try {
      await Promise.race([workerWarten, new Promise((_, nein) => setTimeout(() => nein(new Error('Python lädt sehr langsam (mehr als zwei Minuten). Prüfe die Internetverbindung und versuche es noch einmal.')), 120000))]);
    } catch (e) { return { fehler: e.message }; }
    return new Promise(resolve => {
      const id = ++laufId;
      const w = worker;
      const limit = w.__erster ? 15000 : 8000; // der erste Lauf direkt nach dem Laden bekommt mehr Luft
      w.__erster = false;
      const zeit = setTimeout(() => {
        w.terminate(); workerNeu();
        resolve({ fehler: 'Zeitüberschreitung: Dein Programm läuft länger als 8 Sekunden – wahrscheinlich eine Endlosschleife. Prüfe die Schleifenbedingung und ob sich links/rechts wirklich verändern.' });
      }, limit);
      const h = ev => { if (!ev.data || ev.data.id !== id) return; clearTimeout(zeit); w.removeEventListener('message', h); resolve(ev.data); };
      w.addEventListener('message', h);
      w.postMessage({ id, code, tests });
    });
  }
  let pyHaupt = null;
  async function hauptthreadLaufen(code, tests) {
    try {
      if (!window.loadPyodide) { await new Promise((ok, nein) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js'; s.onload = ok; s.onerror = nein; document.head.appendChild(s); }); }
      if (!pyHaupt) pyHaupt = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
      const out = []; pyHaupt.setStdout({ batched: s => out.push(s) }); pyHaupt.setStderr({ batched: s => out.push(s) });
      pyHaupt.runPython(code);
      let results = null;
      if (tests) { pyHaupt.runPython(HARNESS); const fn = pyHaupt.globals.get('__werkstatt_tests'); results = JSON.parse(fn(JSON.stringify(tests))); fn.destroy(); }
      return { stdout: out.join('\n'), results };
    } catch (e) { return { fehler: String(e.message || e) }; }
  }
  const HARNESS = `
import json
def __werkstatt_tests(tests_json):
    tests = json.loads(tests_json)
    out = []
    for t in tests:
        try:
            got = eval(t["call"])
            erwartet = eval(t["expect"])
            out.append({"name": t["name"], "ok": got == erwartet, "got": repr(got), "expect": t["expect"]})
        except Exception as e:
            out.append({"name": t["name"], "ok": False, "got": type(e).__name__ + ": " + str(e), "expect": t["expect"]})
    return json.dumps(out)
`;
  function fehlerHinweis(f) {
    if (/SyntaxError|IndentationError/.test(f)) return 'Syntaxfehler: Prüfe Doppelpunkte am Zeilenende, Klammern und die Einrückung (4 Leerzeichen).';
    if (/NameError/.test(f)) return 'NameError: Ein Name ist nicht definiert – Tippfehler im Funktions- oder Variablennamen?';
    if (/TypeError.*NoneType|'NoneType'/.test(f)) return 'Deine Funktion gibt nichts zurück – fehlt das return?';
    if (/IndexError/.test(f)) return 'IndexError: Ein Index liegt außerhalb der Liste – prüfe die Grenzen von range().';
    return '';
  }
  function ausgabeZeigen(text, fehler) {
    const el = $('#code-ausgabe');
    el.innerHTML = '';
    if (text) el.appendChild(document.createTextNode(text + '\n'));
    if (fehler) { const f = document.createElement('span'); f.className = 'fehler'; f.textContent = fehler; el.appendChild(f); const h = fehlerHinweis(fehler); if (h) { el.appendChild(document.createTextNode('\n')); const hs = document.createElement('span'); hs.textContent = '→ ' + h; el.appendChild(hs); } }
    if (!text && !fehler) el.textContent = '(keine Ausgabe – nutze print(...), um etwas zu sehen)';
  }
  async function ausfuehren(mitTests) {
    const code = holeCode();
    if (!code.trim()) { ausgabeZeigen('', 'Der Editor ist leer. Lade den Startcode oder schreib deine Funktion.'); return; }
    const q = modus === 'grund' ? A.aufgabe : A.vertiefung;
    $('#code-run').disabled = $('#code-test').disabled = true;
    status(workerBereit || pyHaupt ? 'läuft …' : 'Python wird geladen (einmalig, ca. 10 MB) …', true);
    const r = await laufen(code, mitTests ? q.tests : null);
    $('#code-run').disabled = $('#code-test').disabled = false;
    status('');
    if (r.fehler) { ausgabeZeigen(r.stdout || '', r.fehler); $('#code-tests').innerHTML = ''; return; }
    ausgabeZeigen(r.stdout || '', '');
    if (r.results) {
      const ok = r.results.filter(x => x.ok).length;
      let html = `<table class="tests"><thead><tr><th>Test</th><th>erwartet</th><th>bekommen</th></tr></thead><tbody>`;
      r.results.forEach(t => { html += `<tr class="${t.ok ? 'ok' : 'fail'}"><td>${t.name}</td><td>${t.expect}</td><td>${escapeHtml(t.got)}</td></tr>`; });
      html += '</tbody></table>';
      const alle = ok === r.results.length;
      html = `<div class="meldung ${alle ? 'ok' : 'hinweis'}">${alle ? 'Alle Tests bestanden – ' + ok + ' von ' + r.results.length + '. Trag das Ergebnis in dein Arbeitsblatt ein.' : ok + ' von ' + r.results.length + ' Tests bestanden. Schau dir die Zeilen mit ✗ an.'}${r.results.some(t => t.got === 'None') ? ' Hinweis: „None“ heißt, die Funktion gibt nichts zurück – fehlt ein return?' : ''}</div>` + html;
      $('#code-tests').innerHTML = html;
      if (alle) merke(modus === 'grund' ? 'code' : 'vertiefung', true);
    }
  }
  function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  $('#code-run').addEventListener('click', () => ausfuehren(false));
  $('#code-test').addEventListener('click', () => ausfuehren(true));

  editorInit(); aufgabeZeigen();
  if (!holeCode().trim()) setzeCode(A.aufgabe.starter);
  if (location.protocol !== 'file:') workerNeu(); else status('Hinweis: Direkt aus einer Datei geöffnet – Python läuft ohne Zeitlimit. Über einen Link (Moodle) läuft alles rund.');

  /* ---------------------------------------------------------- Start */
  zeigeFortschritt();
  const start = (location.hash || '#ansehen').slice(1);
  zeigeTab(['ansehen', 'selbst', 'parsons', 'code'].includes(start) ? start : 'ansehen');
})();
