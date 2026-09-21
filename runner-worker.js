/* Python-Ausfuehrung in einem Web Worker (Pyodide). Der Hauptthread bricht nach
   einem Zeitlimit ab (Endlosschleifen), indem er den Worker beendet. */
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');

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

// Laden und aufwaermen: Der allererste Python-Lauf nach dem Laden ist sonst
// deutlich langsamer und wuerde ins Zeitlimit des Hauptthreads laufen.
const bereit = loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' }).then(py => {
  py.runPython(HARNESS);
  py.runPython('import json\ndef __warm(liste, x):\n    return liste.index(x) if x in liste else -1\n__werkstatt_tests(json.dumps([{"name": "w", "call": "__warm([1, 2], 2)", "expect": "1"}]))');
  return py;
});
bereit.then(() => postMessage({ typ: 'bereit' }))
      .catch(() => postMessage({ typ: 'ladefehler', text: 'Python konnte nicht geladen werden. Bist du online? Beim ersten Start werden rund 10 MB geladen.' }));

onmessage = async (ev) => {
  const { id, code, tests } = ev.data;
  let py;
  try { py = await bereit; }
  catch (e) { postMessage({ id, fehler: 'Python konnte nicht geladen werden. Bist du online? Beim ersten Start werden rund 10 MB geladen.' }); return; }
  const out = [];
  py.setStdout({ batched: s => out.push(s) });
  py.setStderr({ batched: s => out.push(s) });
  try {
    // Frischer Namensraum je Lauf: alte Funktionen sollen keine Tests bestehen
    py.runPython('for __n in [n for n in list(globals()) if not n.startswith("__")]:\n    del globals()[__n]');
    py.runPython(code);
    let results = null;
    if (tests) {
      py.runPython(HARNESS);
      const fn = py.globals.get('__werkstatt_tests');
      results = JSON.parse(fn(JSON.stringify(tests)));
      fn.destroy();
    }
    postMessage({ id, stdout: out.join('\n'), results });
  } catch (e) {
    postMessage({ id, stdout: out.join('\n'), fehler: String(e.message || e) });
  }
};
