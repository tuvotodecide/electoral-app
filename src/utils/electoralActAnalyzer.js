import {GoogleGenAI} from '@google/genai';
import {getProvision} from './provisionClient';
import RNFS from 'react-native-fs';
import {API_GEMINI} from '@env';

class ElectoralActAnalyzer {
  constructor() {
    this.genAI = null;
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

  /**
   * Convierte imagen a base64
   */
  async imageToBase64(imagePath) {
    try {
      return await RNFS.readFile(imagePath, 'base64');
    } catch (error) {
      throw new Error('No se pudo procesar la imagen');
    }
  }

  /**
   * Prompt especifico para analisis de actas electorales bolivianas
   */
  getAnalysisPrompt() {
    return `Analiza la imagen proporcionada.
PRIMERO, comprueba si la imagen exhibe TODOS estos rasgos inequivocos de un acta electoral boliviana.
Debe mostrar inequivocamente:
  - Logotipo del OEP (esquina superior izquierda).
  - Titulo exacto "ACTA ELECTORAL DE ESCRUTINIO Y CONTEO".
  - Leyenda "ELECCION DE PRESIDENTE Y VICEPRESIDENTE DEL ESTADO PLURINACIONAL DE BOLIVIA - SEGUNDA VUELTA" debajo del titulo.
  - Tabla "CODIGO DE MESA" con un numero y un codigo de barras en la parte izquierda.
  - Cuadro de resultados con solamente dos partidos politicos.
  - Campos de resumen "VOTOS VALIDOS", "VOTOS BLANCOS" y "VOTOS NULOS".

Si falta alguno de esos elementos o es ilegible, responde EXCLUSIVAMENTE:
{"if_electoral_act": false}

Si la foto esta borrosa o los campos clave no se distinguen con nitidez suficiente, responde EXCLUSIVAMENTE:
{"image_not_clear": true}

SOLO si la imagen cumple todos los criterios y se lee claramente, responde con un UNICO JSON siguiendo EXACTAMENTE esta estructura.

Reglas de negocio:
1. Si alguna casilla de votos esta vacia, registrala como "0".
2. Observaciones: transcribe el texto del campo "OBSERVACIONES".
3. Validacion de observacion:
   - Marca "is_observed": false si el campo:
     a) Esta vacio.
     b) Contiene una LINEA DIAGONAL (/) cruzada para anular el espacio.
     c) Contiene UNICAMENTE la frase "CORRE Y VALE" (ignorando mayusculas, tildes y puntos).
   - Marca "is_observed": true si detectas cualquier otro texto descriptivo, incidentes o aclaraciones numéricas.
{
  "if_electoral_act": true,
  "table_number": "<numero de mesa, parte superior izquierda>",
  "table_code": "<codigo de mesa, parte superior izquierda>",
  "president_vote_counts": {
    "candidate_votes": [
      { "candidate_id": "LIBRE", "votes": "<n o 0>" },
      { "candidate_id": "PDC", "votes": "<n o 0>" }
    ],
    "blank_votes": "<n o 0>",
    "valid_votes": "<n o 0>",
    "null_votes": "<n o 0>",
    "total_votes": "<n o 0>"
  },
  "time": "<hora de cierre HH:MM>",
  "observations": {
    "text": "<transcripcion literal del campo observaciones>",
    "is_observed": <true o false>
  }
}

Devuelve SOLO el JSON solicitado, sin texto adicional, sin Markdown, sin comillas invertidas.
`;
  }

  normalizeObservationText(value) {
    return String(value ?? '').trim();
  }

  normalizeComparableObservation(value) {
    return this.normalizeObservationText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  isObservationFromText(value) {
    const normalized = this.normalizeComparableObservation(value);
    if (!normalized) return false;
    return normalized !== 'correyvale';
  }

  /**
   * Analiza una imagen de acta electoral
   */
  async analyzeElectoralAct(imagePath) {
    try {
      const genAI = await this.ensureClient();
      const base64Image = await this.imageToBase64(imagePath);
      const prompt = this.getAnalysisPrompt();

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {text: prompt},
        ],
      });

      const text = response.text.trim();
      try {
        const analysisResult = JSON.parse(text);
        return {
          success: true,
          data: analysisResult,
          rawResponse: text,
        };
      } catch (parseError) {
        return {
          success: false,
          error: 'La respuesta de la IA no es un JSON valido',
          rawResponse: text,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error al analizar la imagen',
      };
    }
  }

  /**
   * Mapea los datos de la IA al formato esperado por la app
   */
  mapToAppFormat(aiData) {
    if (!aiData.if_electoral_act) {
      return null;
    }

    const partyMapping = {
      LIBRE: 'libre',
      PDC: 'pdc',
    };

    const partyResults = (aiData?.president_vote_counts?.candidate_votes || []).map(
      candidate => ({
        id:
          partyMapping[candidate.candidate_id] ||
          String(candidate.candidate_id || '').toLowerCase(),
        partido: candidate.candidate_id,
        presidente: String(candidate.votes ?? '0'),
      }),
    );

    const voteSummaryResults = [
      {
        id: 'validos',
        label: 'Votos Validos',
        value1: String(aiData?.president_vote_counts?.valid_votes ?? '0'),
      },
      {
        id: 'blancos',
        label: 'Votos en Blanco',
        value1: String(aiData?.president_vote_counts?.blank_votes ?? '0'),
      },
      {
        id: 'nulos',
        label: 'Votos Nulos',
        value1: String(aiData?.president_vote_counts?.null_votes ?? '0'),
      },
    ];

    const rawObservationText = aiData?.observations?.text;
    const hasObservationFromAi = aiData?.observations?.is_observed;
    const hasObservation =
      typeof hasObservationFromAi === 'boolean'
        ? hasObservationFromAi
        : this.isObservationFromText(rawObservationText);

    return {
      tableNumber: aiData.table_number,
      tableCode: aiData.table_code,
      time: aiData.time,
      partyResults,
      voteSummaryResults,
      isObserved: hasObservation,
      observationText: this.normalizeObservationText(rawObservationText),
    };
  }
}

export default new ElectoralActAnalyzer();
