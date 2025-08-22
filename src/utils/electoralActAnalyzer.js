import { GoogleGenAI } from '@google/genai';
import RNFS from 'react-native-fs';

class ElectoralActAnalyzer {
  constructor() {
    this.genAI = new GoogleGenAI({ apiKey: API_KEY });
  }

  /**
   * Convierte imagen a base64
   */
  async imageToBase64(imagePath) {
    try {
      const base64 = await RNFS.readFile(imagePath, 'base64');
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('No se pudo procesar la imagen');
    }
  }

  /**
   * Prompt específico para análisis de actas electorales bolivianas
   */
  getAnalysisPrompt() {
    return `Analiza la imagen proporcionada.
PRIMERO, comprueba si la imagen exhibe TODOS estos rasgos inequívocos de un acta electoral boliviana:
  • Logotipo del OEP (esquina superior izquierda).
  • Título exacto “ACTA ELECTORAL DE ESCRUTINIO Y CÓMPUTO”.
  • Leyenda “ELECCIONES GENERALES” debajo del título.
  • Tabla “CÓDIGO DE MESA” con un número grande en la parte izquierda.
  • Cuadros numerados en rojo para los votos de 9 candidaturas.

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
      { "candidate_id": "AP",     "votes": "<n o 0>" },
      { "candidate_id": "LYP-ADN",      "votes": "<n o 0>" },
      { "candidate_id": "APBSUMATE", "votes": "<n o 0>" },
      { "candidate_id": "LIBRE",      "votes": "<n o 0>" },
      { "candidate_id": "FP",      "votes": "<n o 0>" },
      { "candidate_id": "MAS-IPSP",  "votes": "<n o 0>" }
      { "candidate_id": "MORENA",      "votes": "<n o 0>" },
      { "candidate_id": "UNIDAD",  "votes": "<n o 0>" }
      { "candidate_id": "PDC",      "votes": "<n o 0>" },
      { "candidate_id": "NGP",      "votes": "<n o 0>" },
    ],
    "blank_votes":  "<n o 0>",
    "valid_votes":  "<n o 0>",
    "null_votes":   "<n o 0>",
    "total_votes":  "<n o 0>"
  },
  "deputy_vote_counts": {
    "candidate_votes": [ …mismo orden y reglas… ],
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
      console.log('🔍 Iniciando análisis de acta electoral...');

      // Convertir imagen a base64
      const base64Image = await this.imageToBase64(imagePath);

      // Preparar el contenido para Gemini
      const prompt = this.getAnalysisPrompt();

      // Usar la nueva API de genai:
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      });

      // La respuesta es ahora response.text (no .text())
      const text = response.text.trim();

      console.log('📄 Respuesta de Gemini:', text);

      // Intentar parsear como JSON
      try {
        const analysisResult = JSON.parse(text);
        console.log('✅ Análisis completado:', analysisResult);
        return {
          success: true,
          data: analysisResult,
          rawResponse: text,
        };
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        return {
          success: false,
          error: 'La respuesta de la IA no es un JSON válido',
          rawResponse: text,
        };
      }
    } catch (error) {
      console.error('❌ Error en análisis:', error);
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
      AP: 'ap',
      'LYP-ADN': 'lyp-adn',
      APBSUMATE: 'apbsumate',
      LIBRE: 'libre',
      FP: 'fp',
      'MAS-IPSP': 'mas-ipsp',
      MORENA: 'morena',
      'UNIDAD': 'pan-bol',
      PDC: 'pdc',
      NGP: 'ngp',
    };

    // Mapear resultados de partidos para presidente
    const partyResults = aiData.president_vote_counts.candidate_votes.map(
      candidate => ({
        id:
          partyMapping[candidate.candidate_id] ||
          candidate.candidate_id.toLowerCase(),
        partido: candidate.candidate_id,
        presidente: candidate.votes.toString(),
        diputado:
          aiData.deputy_vote_counts.candidate_votes
            .find(dep => dep.candidate_id === candidate.candidate_id)
            ?.votes.toString() || '0',
      }),
    );

    // Mapear resumen de votos
    const voteSummaryResults = [
      {
        id: 'validos',
        label: 'Votos Válidos',
        value1: aiData.president_vote_counts.valid_votes.toString(),
        value2: aiData.deputy_vote_counts.valid_votes.toString(),
      },
      {
        id: 'blancos',
        label: 'Votos en Blanco',
        value1: aiData.president_vote_counts.blank_votes.toString(),
        value2: aiData.deputy_vote_counts.blank_votes.toString(),
      },
      {
        id: 'nulos',
        label: 'Votos Nulos',
        value1: aiData.president_vote_counts.null_votes.toString(),
        value2: aiData.deputy_vote_counts.null_votes.toString(),
      },
    ];

    return {
      tableNumber: aiData.table_number,
      tableCode: aiData.table_code,
      time: aiData.time,
      partyResults,
      voteSummaryResults,
    };
  }
}

export default new ElectoralActAnalyzer();
