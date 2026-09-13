'use strict';

/* ===================================================================
   Calculadora de infusión de drogas inotrópicas / vasoactivas
   Lógica de cálculo adaptada de la calculadora ARUCIP original
   (cálculos: Dr. Eduardo Motto). Se conserva la aritmética original;
   Se agregaron drogas, validaciones de rango, etc.
   =================================================================== */

// ---- Utilidades numéricas (idénticas a la calculadora original) ----
function multiploSuperior(valor, multiplo) {
  const r = valor % multiplo;
  if (r === 0) return valor;
  return valor + (multiplo - r);
}
function multiploInferior(valor, multiplo) {
  const r = valor % multiplo;
  if (r === 0) return valor;
  return valor - r;
}
function multiploMult(valor, multiplo) {
  const r = valor % multiplo;
  if (r === 0) return valor;
  if (r >= multiplo / 2) return multiploSuperior(valor, multiplo);
  return multiploInferior(valor, multiplo);
}

// ---- Catálogo de drogas ----
// concentracionAmpolla: mg/ml (o UI/ml) tal cual viene la ampolla, para
// calcular cuántos ml hay que extraer de la ampolla. null cuando la
// presentación no tiene una concentración fija lista para usar (ej.
// frasco liofilizado que se reconstituye antes de diluir).

const DROGAS = {
  '1': {
    nombre: 'Dopamina',
    dot: '#217491',
    presentacion: 'Ampolla 200 mg (40 mg/ml)',
    concentracionAmpolla: 40,
    dosisRecomendada: '4 a 16 µg/Kg/min',
    unidadDosis: 'µg/Kg/min',
    unidadMasa: 'mg',
  },
  '2': {
    nombre: 'Adrenalina',
    dot: '#A63446',
    presentacion: 'Ampolla 1 mg (1 mg/ml)',
    concentracionAmpolla: 1,
    dosisRecomendada: '0,05 a 2 µg/Kg/min',
    unidadDosis: 'µg/Kg/min',
    unidadMasa: 'mg',
  },
  '3': {
    nombre: 'Noradrenalina',
    dot: '#8E4585',
    presentacion: 'Ampolla 4 mg (1 mg/ml)',
    concentracionAmpolla: 1,
    dosisRecomendada: '0,05 a 2 µg/Kg/min',
    unidadDosis: 'µg/Kg/min',
    unidadMasa: 'mg',
  },
  '4': {
    nombre: 'Milrinona',
    dot: '#4FB6AC',
    presentacion: 'Ampolla 10 mg (1 mg = 1 ml)',
    concentracionAmpolla: 1,
    dosisRecomendada: '0,25 a 0,75 µg/Kg/min',
    unidadDosis: 'µg/Kg/min',
    unidadMasa: 'mg',
  },
  '5': {
    nombre: 'Nitroprusiato',
    dot: '#D9A441',
    presentacion: 'Frasco ampolla de 50 mg',
    concentracionAmpolla: null,
    dosisRecomendada: '0,5 a 5 µg/Kg/min',
    unidadDosis: 'µg/Kg/min',
    unidadMasa: 'mg',
  },
  '6': {
    nombre: 'Vasopresina',
    dot: '#5C6B73',
    presentacion: 'Ampolla 1 ml / 20 UI',
    concentracionAmpolla: 20,
    dosisRecomendada: '0,0001 a 0,003 UI/Kg/min',
    unidadDosis: 'UI/Kg/min',
    unidadMasa: 'UI',
  },
  '7': {
    nombre: 'Dobutamina',
    dot: '#217491',
    presentacion: 'Ampolla 250 mg (12,5 mg/ml)',
    concentracionAmpolla: 12.5,
    dosisRecomendada: '2 a 20 µg/Kg/min',
    unidadDosis: 'µg/Kg/min',
    unidadMasa: 'mg',
  },
  '8': {
    nombre: 'Isoproterenol',
    dot: '#217491',
    presentacion: 'Ampolla 1 mg (0,2 mg/ml)',
    concentracionAmpolla: 0.2,
    dosisRecomendada: '0,05 a 1 µg/Kg/min',
    unidadDosis: 'µg/Kg/min',
    unidadMasa: 'mg',
  },
};

const ORDEN_DROGAS = ['2', '3','1','7', '4', '5', '6', '8'];

/**
 * Calcula la preparación y dosis para una droga inotrópica.
 * Reproduce fielmente las fórmulas de la calculadora original.
 * @returns {object|null} resultado, o null si el peso está fuera de rango soportado.
 */
function calcularInotropico(peso, droga) {
  let F14 = 0;     // mg (o UI) a diluir
  let F15 = null;  // volumen de solvente sugerido (ml) — hasta X ml
  let porMlHora = null; // dosis (unidad/Kg/min) que representa 1 ml/hora
  let fueraRango = false;

  switch (droga) {
    case '1': // DOPAMINA
      if (peso < 25) F14 = multiploMult(12 * peso, 10);
      else if (peso < 300) F14 = 300;
      else fueraRango = true;
      F15 = 50;
      if (!fueraRango) porMlHora = (F14 / F15 / peso / 60) * 1000;
      break;

    case '2': // ADRENALINA
    case '3': // NORADRENALINA
      F14 = peso < 3.5 ? 1 : multiploInferior(peso * 0.3, 0.5);
      F15 = 50;
      if (peso < 161) porMlHora = (F14 / peso / F15 / 60) * 1000;
      else fueraRango = true;
      break;

    case '4': // MILRINONA
      if (peso < 13.9) F14 = multiploSuperior(0.5 * peso * 1.44, 0.5);
      else if (peso < 27.7) F14 = multiploSuperior(0.5 * peso * 1.44, 2.5);
      else if (peso < 150) F14 = 20;
      else fueraRango = true;
      F15 = 24;
      if (!fueraRango) porMlHora = F14 / peso / 1.44;
      break;

    case '5': // NITROPRUSIATO
      if (peso < 14) F15 = 75;
      else if (peso < 20) F15 = 50;
      else if (peso < 151) F15 = 100;
      else fueraRango = true;
      F14 = peso < 8 ? 25 : peso < 20 ? 50 : peso < 2222 ? 100 : 0;
      if (!fueraRango) porMlHora = (F14 / F15 / peso / 60) * 1000;
      break;

    case '6': // VASOPRESINA
      F14 = peso < 12 ? 5 : peso < 16 ? 10 : peso < 150 ? 20 : 0;
      if (peso < 8) {
        F15 = 48;
        porMlHora = F14 / peso / 48 / 60;
      } else if (peso < 151) {
        F15 = 24;
        porMlHora = F14 / peso / 24 / 60;
      } else {
        fueraRango = true;
      }
      break;

   case '7': // DOBUTAMINA
      if (peso < 25) F14 = multiploMult(12 * peso, 10);
      else if (peso < 300) F14 = 300;
      else fueraRango = true;
      F15 = 50;
      if (!fueraRango) porMlHora = (F14 / F15 / peso / 60) * 1000;
      break;

 case '8': // ISOPROTERENOL
      F14 = peso < 3.5 ? 1 : multiploInferior(peso * 0.15, 0.5);
      F15 = 50;
      if (peso < 161) porMlHora = (F14 / peso / F15 / 60) * 1000;
      else fueraRango = true;
      break;

    default:
      return null;
  }

  if (fueraRango || !isFinite(porMlHora) || peso <= 0) {
    return { fueraDeRango: true };
  }

  const decimales = droga === '6' ? 4 : (droga === '1' || droga === '5') ? 1 : 2;

  let concentracionMaxima = null;
  if (droga === '1') {
    concentracionMaxima = F14 / F15; // mg/ml al diluir en F15 ml
  }

  return {
    fueraDeRango: false,
    F14,
    F15,
    porMlHora,
    decimales,
    concentracionMaxima,
  };
}

// ---- Formato numérico ----
function fmt(n, decimales) {
  return Number(n).toFixed(decimales).replace('.', ',');
}
// Igual que fmt, pero recorta ceros decimales sobrantes (1.50 -> 1,5 / 4.00 -> 4)
function fmtTrim(n, maxDecimales) {
  let s = Number(n).toFixed(maxDecimales);
  if (s.indexOf('.') !== -1) {
    s = s.replace(/0+$/, '').replace(/\.$/, '');
  }
  if (s === '' || s === '-0') s = '0';
  return s.replace('.', ',');
}

// ---- Estado ----
let drogaSeleccionada = '2';

// ---- Referencias DOM ----
const $ = (id) => document.getElementById(id);
const drogaSelect = $('drogaSelect');
const drogaDot = $('drogaDot');
const pesoInput = $('peso');
const goteoInput = $('goteo');

const resultEmpty = $('resultEmpty');
const resultBody = $('resultBody');
const outPresentacion = $('outPresentacion');
const outDosisRec = $('outDosisRec');
const outPreparacion = $('outPreparacion');
const blockConcentracion = $('blockConcentracion');
const outConcentracion = $('outConcentracion');
const blockDosisRecibida = $('blockDosisRecibida');
const outDosisRecibida = $('outDosisRecibida');
const blockReferencia = $('blockReferencia');
const outReferencia = $('outReferencia');
const blockOutOfRange = $('blockOutOfRange');
const outOfRangeMsg = $('outOfRangeMsg');

// ---- Construir selector de drogas ----
function renderSelectorDrogas() {
  drogaSelect.innerHTML = '';
  ORDEN_DROGAS.forEach((key) => {
    const d = DROGAS[key];
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = d.nombre;
    if (key === drogaSeleccionada) opt.selected = true;
    drogaSelect.appendChild(opt);
  });
  drogaDot.style.setProperty('--dot', DROGAS[drogaSeleccionada].dot);

  drogaSelect.addEventListener('change', () => {
    drogaSeleccionada = drogaSelect.value;
    drogaDot.style.setProperty('--dot', DROGAS[drogaSeleccionada].dot);
    actualizar();
  });
}

// ---- Actualizar resultados ----
function actualizar() {
  const droga = DROGAS[drogaSeleccionada];
  const peso = parseFloat(pesoInput.value);
  const goteo = parseFloat(goteoInput.value);

  const pesoValido = !isNaN(peso) && peso > 0;

  if (!pesoValido) {
    resultEmpty.classList.remove('hidden');
    resultBody.classList.add('hidden');
    return;
  }

  const r = calcularInotropico(peso, drogaSeleccionada);

  resultEmpty.classList.add('hidden');
  resultBody.classList.remove('hidden');

  outPresentacion.textContent = droga.presentacion;
  outDosisRec.textContent = droga.dosisRecomendada;

  if (r.fueraDeRango) {
    outPreparacion.textContent = '—';
    blockConcentracion.classList.add('hidden');
    blockDosisRecibida.classList.add('hidden');
    blockReferencia.classList.add('hidden');
    blockOutOfRange.classList.remove('hidden');
    outOfRangeMsg.textContent = 'El peso ingresado está fuera del rango soportado por esta calculadora para ' + droga.nombre + '. Verifique el valor o calcule manualmente.';
    return;
  }

  blockOutOfRange.classList.add('hidden');

  if (droga.concentracionAmpolla) {
    const volumenAExtraer = r.F14 / droga.concentracionAmpolla;
    outPreparacion.textContent =
      `${droga.nombre} ${fmtTrim(r.F14, 1)} ${droga.unidadMasa} (${fmtTrim(volumenAExtraer, 2)} ml) ` +
      `llevar hasta ${r.F15} ml totales con solvente (Fisiol. D5%, etc.)`;
  } else {
    // presentación sin concentración fija (ej. frasco liofilizado): se reconstituye antes de diluir
    outPreparacion.textContent =
      `${droga.nombre} ${fmtTrim(r.F14, 1)} ${droga.unidadMasa} ` +
      `llevar hasta ${r.F15} ml totales con solvente (Fisiol. D5%, etc.). Reconstituya el frasco según inserto antes de diluir.`;
  }

  if (r.concentracionMaxima !== null && r.concentracionMaxima > 6) {
    blockConcentracion.classList.remove('hidden');
    outConcentracion.textContent =
      `Concentración resultante: ${fmt(r.concentracionMaxima, 3)} mg/ml (supera la máxima recomendada: 6 mg/ml)`;
  } else {
    blockConcentracion.classList.add('hidden');
  }

  const goteoValido = !isNaN(goteo) && goteo >= 0;

  blockReferencia.classList.remove('hidden');
  outReferencia.textContent = `Referencia: 1 ml/h = ${fmt(r.porMlHora, r.decimales)} ${droga.unidadDosis}`;

  if (goteoValido && goteo > 0) {
    const dosisRecibida = r.porMlHora * goteo;
    blockDosisRecibida.classList.remove('hidden');
    blockDosisRecibida.querySelector('.result-label').innerHTML =
      `A <strong>${fmt(goteo, goteo % 1 === 0 ? 0 : 1)}</strong> ml/h, el paciente recibe`;
    outDosisRecibida.textContent = `${fmt(dosisRecibida, r.decimales)} ${droga.unidadDosis}`;
    flashHighlight();
  } else {
    blockDosisRecibida.classList.add('hidden');
  }
}

let flashTimer = null;
function flashHighlight() {
  const el = blockDosisRecibida;
  el.classList.add('pulse');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove('pulse'), 500);
}

// ---- Listeners ----
pesoInput.addEventListener('input', actualizar);
goteoInput.addEventListener('input', actualizar);

// ---- Modal info ----
const infoModalBackdrop = $('infoModalBackdrop');
$('btnInfo').addEventListener('click', () => infoModalBackdrop.classList.remove('hidden'));
$('btnCloseInfo').addEventListener('click', () => infoModalBackdrop.classList.add('hidden'));
infoModalBackdrop.addEventListener('click', (e) => {
  if (e.target === infoModalBackdrop) infoModalBackdrop.classList.add('hidden');
});

// ---- Init ----
renderSelectorDrogas();
actualizar();

// ---- Registro de Service Worker (PWA) ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', document.baseURI).toString();
    navigator.serviceWorker.register(swUrl).catch(() => {
      /* silencioso: la app funciona igual sin SW */
    });
  });
}
