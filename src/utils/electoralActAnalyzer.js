import {GoogleGenAI} from '@google/genai';
import {getProvision} from './provisionClient';
import RNFS from 'react-native-fs';
import {API_GEMINI} from '@env';

class ElectoralActAnalyzer {
  constructor() {
    // this.genAI = new GoogleGenAI({apiKey: API_GEMINI});
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
      const base64 = await RNFS.readFile(imagePath, 'base64');
      return base64;
    } catch (error) {
      throw new Error('No se pudo procesar la imagen');
    }
  }

  /**
   * Prompt específico para análisis de actas electorales bolivianas
   */
  getAnalysisPrompt() {
    return `Analiza la imagen proporcionada.
PRIMERO, comprueba si la imagen exhibe TODOS estos rasgos inequívocos de un acta electoral boliviana.
Debe mostrar inequívocamente:
  • Logotipo del OEP (esquina superior izquierda).
  • Título exacto “ACTA ELECTORAL DE ESCRUTINIO Y CONTEO”.
  • Leyenda “ELECCIÓN DE PRESIDENTE Y VICEPRESIDENTE DEL ESTADO PLURINACIONAL DE BOLIVIA - SEGUNDA VUELTA” debajo del título.
  • Tabla “CÓDIGO DE MESA” con un número y un código de barras en la parte izquierda.
  • Cuadro de resultados con solamente dos partidos políticos.
  • Campos de resumen “VOTOS VÁLIDOS”, “VOTOS BLANCOS” y “VOTOS NULOS”.

Si falta alguno de esos elementos o es ilegible, responde EXCLUSIVAMENTE:
  {"if_electoral_act": false}

Si la foto está borrosa o los campos clave no se distinguen con nitidez suficiente, responde EXCLUSIVAMENTE:
  {"image_not_clear": true}

SOLO si la imagen cumple todos los criterios y se lee claramente, responde con un ÚNICO JSON siguiendo EXACTAMENTE esta estructura.
🔸 **Regla adicional**: si alguna casilla de votos está vacía, regístrala como "0".

{
  "if_electoral_act": true,
  "table_number": "<número de mesa, parte superior izquierda>",
  "table_code": "<código de mesa, parte superior izquierda>",
  "president_vote_counts": {
    "candidate_votes": [
      { "candidate_id": "LIBRE",      "votes": "<n o 0>" },
      { "candidate_id": "PDC",      "votes": "<n o 0>" },
    ],
    "blank_votes":  "<n o 0>",
    "valid_votes":  "<n o 0>",
    "null_votes":   "<n o 0>",
    "total_votes":  "<n o 0>"
  },
  "time": "<hora de cierre en formato HH:MM; deja cadena vacía si no aparece claramente>"
}

⚠️ Devuelve SOLO el JSON solicitado, sin texto adicional, sin Markdown, sin comillas invertidas.
`;
  }

  /**
   * Analiza una imagen de acta electoral
   */
  async analyzeElectoralAct(imagePath) {
    try {
      const genAI = await this.ensureClient();
      // Convertir imagen a base64
      const base64Image = await this.imageToBase64(imagePath);

      // Preparar el contenido para Gemini
      const prompt = this.getAnalysisPrompt();

      // Usar la nueva API de genai:
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

      // La respuesta es ahora response.text (no .text())
      const text = response.text.trim();

      // Intentar parsear como JSON
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
          error: 'La respuesta de la IA no es un JSON válido',
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

    // Mapear resultados de partidos para presidente
    const partyResults = aiData.president_vote_counts.candidate_votes.map(
      candidate => ({
        id:
          partyMapping[candidate.candidate_id] ||
          candidate.candidate_id.toLowerCase(),
        partido: candidate.candidate_id,
        presidente: candidate.votes.toString(),

      }),
    );

    // Mapear resumen de votos
    const voteSummaryResults = [
      {
        id: 'validos',
        label: 'Votos Válidos',
        value1: aiData.president_vote_counts.valid_votes.toString(),
      },
      {
        id: 'blancos',
        label: 'Votos en Blanco',
        value1: aiData.president_vote_counts.blank_votes.toString(),
      },
      {
        id: 'nulos',
        label: 'Votos Nulos',
        value1: aiData.president_vote_counts.null_votes.toString(),
      },
    ];

    const mappedResult = {
      tableNumber: aiData.table_number,
      tableCode: aiData.table_code,
      time: aiData.time,
      partyResults,
      voteSummaryResults,
    };
    return mappedResult;
  }
}

export default new ElectoralActAnalyzer();
