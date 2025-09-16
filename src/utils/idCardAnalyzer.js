// C:\apps\electoralmobile\src\utils\idCardAnalyzer.js
import {GoogleGenAI} from '@google/genai';
import RNFS from 'react-native-fs';
import {getProvision} from './provisionClient';
import {API_GEMINI} from '@env';

const safeStringify = obj => {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (k, v) => {
      if (typeof v === 'object' && v !== null) {
        if (seen.has(v)) return '[Circular]';
        seen.add(v);
      }
      if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
      return v;
    },
    2,
  );
};

// Extrae texto a prueba de cambios del SDK
async function extractText(resp) {
  if (!resp) return '';
  if (typeof resp.text === 'function') return String(await resp.text()).trim();
  if (typeof resp.text === 'string') return resp.text.trim();
  if (resp.response && typeof resp.response.text === 'function') {
    return String(await resp.response.text()).trim();
  }
  // fallback: intenta leer de candidates->content->parts
  try {
    const parts = resp.response?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const t = parts
        .map(p => (typeof p.text === 'string' ? p.text : ''))
        .join('\n')
        .trim();
      if (t) return t;
    }
  } catch {}
  return '';
}

// Intenta sacar JSON aunque venga con ```json ... ``` o texto extra
function tryParseLooseJSON(s) {
  // 1) si viene en bloque ```json ... ```
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) {
    try {
      return JSON.parse(fence[1]);
    } catch {}
  }
  // 2) busca el mayor bloque que empiece con { y termine con }
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = s.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  // 3) pequeños fixes comunes (comas colgantes)
  const fixed = s.replace(/,\s*([\]}])/g, '$1');
  try {
    return JSON.parse(fixed);
  } catch {}
  return null;
}

function stripFilePrefix(uri = '') {
  return uri.startsWith('file://') ? uri.slice(7) : uri;
}
function onlyDigits(s = '') {
  return (s || '').replace(/\D/g, '');
}
function isISODate(s = '') {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

class IdCardAnalyzer {
  constructor() {
    // this.genAI = new GoogleGenAI({ apiKey: API_GEMINI });
    this.genAI = null;
    this.model = 'gemini-2.5-flash';
  }

  async ensureClient() {
    if (this.genAI) return this.genAI;
    const prov = await getProvision();
    const key =
      prov?.gemini?.mode === 'apiKey' && prov?.gemini?.apiKey
        ? prov.gemini.apiKey
        : API_GEMINI;
    this.genAI = new GoogleGenAI({apiKey: key});
    return this.genAI;
  }

  async fileToBase64(uri) {
    const path = stripFilePrefix(uri);
    try {
      return await RNFS.readFile(path, 'base64');
    } catch (e) {
      throw new Error('No se pudo leer la imagen local');
    }
  }

  getPrompt() {
    return `Eres un verificador de carnets bolivianos.

Tienes 3 IMÁGENES:
  ① — debería ser ANVERSO (foto + datos)
  ② — debería ser REVERSO (sin foto, con texto adicional)
  ③ — SELFIE reciente del titular

Cómo reconocer cada versión:
1) Laminado verde (pre-2019)
   • Anverso → huella grande y título “CÉDULA DE IDENTIDAD”
   • Reverso → encabezado “EL SERVICIO GENERAL DE IDENTIFICACIÓN PERSONAL CERTIFICA …”

2) Policarbonato blanco (2019+)
   • Anverso → fondo ondulado, bandera 🇧🇴, sin MRZ
   • Reverso → QR grande + MRZ “I<BOL…”

Si el orden NO cumple las reglas, responde exactamente:
{"error":"front/back order"}

Si el orden SÍ es correcto, responde SOLO este JSON (sin texto extra):
{
 "numeroDoc":"…",
 "fullName":"…",
 "fechaNacimiento":"yyyy-MM-dd",
 "fechaExpedicion":"yyyy-MM-dd",
 "lugarExpedicion":"…",
 "faceMatch":true|false
}
`;
  }

  async analyze(frontUri, backUri, selfieUri) {
    const genAI = await this.ensureClient();
    const [frontB64, backB64, selfieB64] = await Promise.all([
      this.fileToBase64(frontUri),
      this.fileToBase64(backUri),
      this.fileToBase64(selfieUri),
    ]);

    const contents = [
      {text: this.getPrompt()},
      {inlineData: {mimeType: 'image/jpeg', data: frontB64}},
      {inlineData: {mimeType: 'image/jpeg', data: backB64}},
      {inlineData: {mimeType: 'image/jpeg', data: selfieB64}},
    ];

    const resp = await genAI.models.generateContent({
      model: this.model,
      contents,
    });
    console.log(resp)
    const text = await extractText(resp);

    if (__DEV__) {
      console.log('--- GENAI RAW TEXT (start) ---');
      console.log(text);
      console.log('--- GENAI RAW TEXT (end) ---');
      // Si necesitas más, imprime una vista del objeto respuesta
      try {
        console.log('GENAI resp keys:', Object.keys(resp || {}));
        console.log(
          'GENAI resp snapshot:',
          safeStringify({
            textType: typeof resp?.text,
            hasResponse: !!resp?.response,
            parts: resp?.response?.candidates?.[0]?.content?.parts?.length,
          }),
        );
      } catch {}
    }

    let data;

    try {
      data = JSON.parse(text);
      console.log(data)
    } catch (e) {
      const loose = tryParseLooseJSON(text);
      if (loose) {
        return {success: true, data: loose, raw: text};
      }
      return {
        success: false,
        error: 'La respuesta de la IA no es un JSON válido',
        raw: text,
      };
    }

    if (data?.error === 'front/back order') {
      return {success: false, error: 'front/back order'};
    }

    const missing = [];
    if (!data?.numeroDoc || !onlyDigits(data.numeroDoc))
      missing.push('numeroDoc');
    if (!data?.fullName) missing.push('fullName');
    if (!data?.fechaNacimiento || !isISODate(data.fechaNacimiento))
      missing.push('fechaNacimiento');
    if (!data?.fechaExpedicion || !isISODate(data.fechaExpedicion))
      missing.push('fechaExpedicion');
    if (!data?.lugarExpedicion) missing.push('lugarExpedicion');

    if (missing.length) {
      return {
        success: false,
        error: `Campos faltantes ${missing.join(', ')}`,
        data,
      };
    }
    if (data.faceMatch === false) {
      return {
        success: false,
        error: 'La verificación facial (faceMatch) ha fallado.',
        data,
      };
    }

    try {
      const dob = Date.parse(data.fechaNacimiento);
      const exp = Date.parse(data.fechaExpedicion);
      if (!isFinite(dob) || !isFinite(exp) || exp <= dob) {
        return {
          success: false,
          error: 'Fechas inconsistentes; revisa el orden de imágenes.',
          data,
        };
      }
    } catch (_) {
      /* ignore */
    }

    return {success: true, data};
  }
}

export default new IdCardAnalyzer();
