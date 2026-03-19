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
  getAnalysisPrompt(context = {}) {
    const normalizedType = String(context?.electionType || '')
      .trim()
      .toLowerCase();
    const isMunicipal = normalizedType === 'municipal';
    const isDepartmental = normalizedType === 'departamental';
    const parties = Array.isArray(context?.allowedParties)
      ? context.allowedParties
          .map(
            party =>
              String(party?.shortName || party?.partyId || party?.fullName || '')
                .trim()
                .toUpperCase(),
          )
          .filter(Boolean)
      : [];
    const partyContext = (isMunicipal || isDepartmental) && parties.length
      ? `\nPARTIDOS HABILITADOS PARA ESTA ACTA ${isMunicipal ? 'MUNICIPAL' : 'DEPARTAMENTAL'}\n- Usa preferentemente estas siglas oficiales si aparecen visualmente: ${parties.join(
          ', ',
        )}.\n- No inventes partidos fuera de la imagen, pero usa esta lista para desambiguar siglas borrosas cuando coincidan claramente.\n`
      : '';
    const typeConstraint = isMunicipal
      ? `\nRESTRICCION DE CONTEXTO\nLa eleccion seleccionada por el usuario es MUNICIPAL.\n- Prioriza reconocer un acta municipal.\n- Si la imagen corresponde claramente a otro tipo de eleccion, responde {"if_electoral_act": false}.\n`
      : isDepartmental
      ? `\nRESTRICCION DE CONTEXTO\nLa eleccion seleccionada por el usuario es DEPARTAMENTAL.\n- Prioriza reconocer un acta departamental.\n- Para esta fase, extrae SOLO los bloques GOBERNADOR/A y ASAMBLEÍSTA TERRITORIO.\n- Ignora cualquier bloque de ASAMBLEÍSTA POBLACIÓN aunque exista en la plantilla.\n- Si la imagen corresponde claramente a otro tipo de eleccion, responde {"if_electoral_act": false}.\n`
      : '';

    return `Analiza la imagen proporcionada.

OBJETIVO
Determinar si la imagen corresponde a un acta electoral boliviana oficial de escrutinio y conteo, identificar su tipo y extraer los resultados en formato JSON estructurado.

PRIMERO, valida si la imagen corresponde inequívocamente a un acta electoral boliviana del OEP.
Debe mostrar inequívocamente la mayoría de estos elementos:
- Logotipo del OEP en la esquina superior izquierda.
- Título que incluya la frase "ACTA ELECTORAL DE ESCRUTINIO Y CONTEO".
- Código de verificación y/o QR.
- Número o código de mesa.
- Sección de ubicación de la mesa.
- Sección de apertura y cierre.
- Sección de conteo de votos por candidaturas.
- Resúmenes de votos válidos, votos blancos y votos nulos.
- Sección de observaciones.
- Sección de jurados de mesa.

Si NO corresponde claramente a un acta electoral boliviana, responde EXCLUSIVAMENTE:
{"if_electoral_act": false}

Si la imagen está demasiado borrosa, incompleta, recortada o los campos clave no se distinguen con suficiente claridad, responde EXCLUSIVAMENTE:
{"image_not_clear": true}

TIPOS DE ACTA A RECONOCER
Debes identificar uno de estos tipos:
1. PRESIDENTIAL_SECOND_ROUND
   - Debe incluir la leyenda de elección presidencial/vicepresidencial.
   - Tiene un solo bloque principal de resultados presidenciales.
   - Puede tener solo dos partidos.

2. DEPARTMENTAL
   - Debe corresponder a elecciones departamentales.
   - Para esta fase solo interesan estos bloques:
     - GOBERNADOR/A
     - ASAMBLEÍSTA TERRITORIO

3. MUNICIPAL
   - Debe corresponder a elecciones municipales.
   - Tiene bloques de resultados como:
     - ALCALDE/ALCALDESA
     - CONCEJAL/CONCEJALES

Si el tipo no puede determinarse con seguridad, responde:
{"if_electoral_act": false}

REGLAS GENERALES DE EXTRACCIÓN
- Devuelve SOLO un JSON válido.
- No incluyas explicación, texto extra, Markdown ni comillas invertidas.
- Si una casilla de votos está vacía, regístrala como "0".
- Conserva los números como strings.
- No inventes siglas ni números.
- Si una sigla de partido no se distingue claramente, usa el texto visible más cercano solo si es legible; si no, omite esa fila.
- Si una fila existe pero su sigla no es legible y sus votos tampoco, puedes omitirla.
- Extrae únicamente información visible en la imagen.
${partyContext}${typeConstraint}

REGLAS DE OBSERVACIONES
La sección "OBSERVACIONES" es EXCLUSIVAMENTE el recuadro grande con líneas horizontales ubicado en la parte inferior del bloque de resultados.
- Ignora totalmente cualquier texto fuera de ese recuadro.
- Ignora el texto rojo preimpreso inferior.
- Ignora títulos, etiquetas, firmas, nombres, huellas, códigos y cualquier texto fuera del interior del recuadro.
- Solo considera observación válida si existe escritura manuscrita o texto claramente escrito dentro del recuadro.
- Si el recuadro está vacío o tiene únicamente una línea diagonal de anulación, responde:
  "text": "",
  "is_observed": false
- Si contiene únicamente "CORRE Y VALE" (ignorando mayúsculas, tildes y puntuación), responde:
  "text": "CORRE Y VALE",
  "is_observed": false
- No inventes texto.
- No completes palabras faltantes.
- Si no se distingue con suficiente claridad escritura dentro del recuadro, responde:
  "text": "",
  "is_observed": false

REGLAS DE TIEMPO
- Extrae preferentemente la hora de cierre en formato "HH:MM".
- Si no es legible, usa "".

FORMATO DE SALIDA
Debes responder SOLO con este JSON:

{
  "if_electoral_act": true,
  "act_type": "PRESIDENTIAL_SECOND_ROUND | DEPARTMENTAL | MUNICIPAL",
  "table_number": "<numero de mesa o ''>",
  "table_code": "<codigo de mesa o ''>",
  "time": "<hora de cierre HH:MM o ''>",
  "offices": [
    {
      "office_id": "<PRESIDENTE | GOBERNADOR | ASAMBLEISTA_TERRITORIO | ALCALDE | CONCEJAL>",
      "office_label": "<texto visible del bloque>",
      "candidate_votes": [
        {
          "candidate_id": "<sigla visible, por ejemplo LIBRE, PDC, MTS, MAS, etc.>",
          "votes": "<numero o 0>"
        }
      ],
      "valid_votes": "<numero o 0>",
      "blank_votes": "<numero o 0>",
      "null_votes": "<numero o 0>"
    }
  ],
  "observations": {
    "text": "<transcripcion literal del campo observaciones>",
    "is_observed": true
  }
}

REGLAS IMPORTANTES PARA "offices"
- PRESIDENTIAL_SECOND_ROUND:
  - Debe devolver un solo bloque en "offices" con office_id = "PRESIDENTE".

- DEPARTMENTAL:
  - Para esta fase solo debe devolver los bloques visibles de:
    - "GOBERNADOR"
    - "ASAMBLEISTA_TERRITORIO"

- MUNICIPAL:
  - Debe devolver un bloque por cada sección visible:
    - "ALCALDE"
    - "CONCEJAL"

- Si un bloque existe en el acta pero algunos números no se distinguen, usa "0" en esos campos.
- Si un bloque no existe en esa plantilla, no lo inventes y no lo incluyas.

Devuelve SOLO el JSON solicitado.
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
  async analyzeElectoralAct(imagePath, electionContext = null) {
    try {
      const genAI = await this.ensureClient();
      const base64Image = await this.imageToBase64(imagePath);
      const prompt = this.getAnalysisPrompt(electionContext || {});

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
  mapToAppFormat(aiData, electionContext = null) {
    if (!aiData.if_electoral_act) {
      return null;
    }

    const normalizedElectionType = String(
      electionContext?.electionType || aiData?.act_type || '',
    )
      .trim()
      .toLowerCase();

    const mapTwoBlockElection = ({primaryOfficeId, secondaryOfficeId}) => {
      const allowedParties = Array.isArray(electionContext?.allowedParties)
        ? electionContext.allowedParties
        : [];
      const partyBaseMap = new Map();

      allowedParties.forEach((party, index) => {
        const partyId = String(
          party?.partyId || party?.shortName || party?.fullName || `party-${index + 1}`,
        )
          .trim()
          .toLowerCase();
        if (!partyId) return;
        partyBaseMap.set(partyId, {
          id: partyId,
          partido: String(
            party?.shortName || party?.partyId || party?.fullName || partyId,
          ).trim(),
          presidente: '0',
          diputado: '0',
        });
      });

      const officeMap = Array.isArray(aiData?.offices) ? aiData.offices : [];
      const officeById = officeId =>
        officeMap.find(
          office =>
            String(office?.office_id || '')
              .trim()
              .toUpperCase() === officeId,
        ) || {};

      const mergeOfficeVotes = (office, field) => {
        const rows = Array.isArray(office?.candidate_votes)
          ? office.candidate_votes
          : [];
        rows.forEach((candidate, index) => {
          const visibleId = String(candidate?.candidate_id || '').trim();
          const normalizedId = visibleId.toLowerCase() || `party-${index + 1}`;
          const existing = partyBaseMap.get(normalizedId) || {
            id: normalizedId,
            partido: visibleId || `PARTIDO ${index + 1}`,
            presidente: '0',
            diputado: '0',
          };
          existing[field] = String(candidate?.votes ?? '0');
          if (!existing.partido && visibleId) {
            existing.partido = visibleId;
          }
          partyBaseMap.set(normalizedId, existing);
        });
      };

      const primaryOffice = officeById(primaryOfficeId);
      const secondaryOffice = officeById(secondaryOfficeId);
      mergeOfficeVotes(primaryOffice, 'presidente');
      mergeOfficeVotes(secondaryOffice, 'diputado');

      const partyResults = Array.from(partyBaseMap.values());
      const voteSummaryResults = [
        {
          id: 'validos',
          label: 'Votos Válidos',
          value1: String(primaryOffice?.valid_votes ?? '0'),
          value2: String(secondaryOffice?.valid_votes ?? '0'),
        },
        {
          id: 'blancos',
          label: 'Votos en Blanco',
          value1: String(primaryOffice?.blank_votes ?? '0'),
          value2: String(secondaryOffice?.blank_votes ?? '0'),
        },
        {
          id: 'nulos',
          label: 'Votos Nulos',
          value1: String(primaryOffice?.null_votes ?? '0'),
          value2: String(secondaryOffice?.null_votes ?? '0'),
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
    };

    if (normalizedElectionType === 'municipal' || aiData?.act_type === 'MUNICIPAL') {
      return mapTwoBlockElection({
        primaryOfficeId: 'ALCALDE',
        secondaryOfficeId: 'CONCEJAL',
      });
    }

    if (
      normalizedElectionType === 'departamental' ||
      aiData?.act_type === 'DEPARTMENTAL'
    ) {
      return mapTwoBlockElection({
        primaryOfficeId: 'GOBERNADOR',
        secondaryOfficeId: 'ASAMBLEISTA_TERRITORIO',
      });
    }

    const officeMap = Array.isArray(aiData?.offices) ? aiData.offices : [];
    const presidentialOffice =
      officeMap.find(
        office =>
          String(office?.office_id || '')
            .trim()
            .toUpperCase() === 'PRESIDENTE',
      ) || aiData?.president_vote_counts || {};

    const partyMapping = {
      LIBRE: 'libre',
      PDC: 'pdc',
    };

    const partyResults = (
      presidentialOffice?.candidate_votes || []
    ).map(candidate => ({
      id:
        partyMapping[candidate.candidate_id] ||
        String(candidate.candidate_id || '').toLowerCase(),
      partido: candidate.candidate_id,
      presidente: String(candidate.votes ?? '0'),
    }));

    const voteSummaryResults = [
      {
        id: 'validos',
        label: 'Votos Validos',
        value1: String(presidentialOffice?.valid_votes ?? '0'),
      },
      {
        id: 'blancos',
        label: 'Votos en Blanco',
        value1: String(presidentialOffice?.blank_votes ?? '0'),
      },
      {
        id: 'nulos',
        label: 'Votos Nulos',
        value1: String(presidentialOffice?.null_votes ?? '0'),
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
