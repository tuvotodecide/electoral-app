import axios from 'axios';
import RNFS from 'react-native-fs';
import {
  PINATA_API_KEY,
  PINATA_API_SECRET,
  PINATA_JWT,
  BACKEND_RESULT,
} from '@env';

class PinataService {
  constructor() {
    this.apiKey = PINATA_API_KEY;
    this.apiSecret = PINATA_API_SECRET;
    this.jwt = PINATA_JWT;

    this.baseURL = 'https://api.pinata.cloud';
  }

  isHttpUrl(u) {
    return /^https?:\/\//i.test(String(u || ''));
  }

  isIpfsUrl(u) {
    return /^ipfs:\/\//i.test(String(u || ''));
  }

  toHttpFromIpfs(u) {
    return String(u || '').replace(
      /^ipfs:\/\//i,
      'https://gateway.pinata.cloud/ipfs/',
    );
  }

  async downloadToCache(url, preferredName = 'electoral-act.jpg') {
    const src = this.isIpfsUrl(url) ? this.toHttpFromIpfs(url) : url;
    const target = `${RNFS.CachesDirectoryPath}/${Date.now()}-${preferredName}`;
    const res = await RNFS.downloadFile({fromUrl: src, toFile: target}).promise;
    if (res.statusCode >= 200 && res.statusCode < 300) return target;
    throw new Error(`HTTP ${res.statusCode} al descargar imagen`);
  }

  async checkDuplicateBallot(voteData) {
    //console.log('[PINATA-SERVICE] 🔍 checkDuplicateBallot iniciado');
    /*     console.log('[PINATA-SERVICE] 📋 Datos de verificación:', {
      tableNumber: voteData.tableNumber,
      hasVotes: !!voteData.votes,
    }); */
    try {
      // Extraer número de mesa
      const tableNumber = voteData.tableNumber || 'N/A';

      // Hacer la petición al backend
      console.log(
        '[PINATA-SERVICE] 🌐 Consultando backend:',
        `${BACKEND_RESULT}/api/v1/ballots/by-table/${tableNumber}`,
      );
      const response = await axios.get(
        `${BACKEND_RESULT}/api/v1/ballots/by-table/${tableNumber}`,
        {timeout: 10000}, // 10 segundos timeout
      );
      const data = response.data;

      // Normalizar para siempre tener un array
      const existingBallots = Array.isArray(data) ? data : data ? [data] : [];

      // Comparar datos de votación (recibe directamente los objetos .votes)
      const isEqual = (votes1, votes2) => {
        try {
          const partiesEqual =
            votes1.parties.validVotes === votes2.parties.validVotes &&
            votes1.parties.nullVotes === votes2.parties.nullVotes &&
            votes1.parties.blankVotes === votes2.parties.blankVotes &&
            votes1.parties.totalVotes === votes2.parties.totalVotes &&
            Array.isArray(votes1.parties.partyVotes) &&
            Array.isArray(votes2.parties.partyVotes) &&
            votes1.parties.partyVotes.length ===
              votes2.parties.partyVotes.length &&
            votes1.parties.partyVotes.every(
              (p, i) =>
                p.partyId === votes2.parties.partyVotes[i].partyId &&
                p.votes === votes2.parties.partyVotes[i].votes,
            );

          // const deputiesEqual =
          //   votes1.deputies.validVotes === votes2.deputies.validVotes &&
          //   votes1.deputies.nullVotes === votes2.deputies.nullVotes &&
          //   votes1.deputies.blankVotes === votes2.deputies.blankVotes &&
          //   votes1.deputies.totalVotes === votes2.deputies.totalVotes &&
          //   Array.isArray(votes1.deputies.partyVotes) &&
          //   Array.isArray(votes2.deputies.partyVotes) &&
          //   votes1.deputies.partyVotes.length ===
          //     votes2.deputies.partyVotes.length &&
          //   votes1.deputies.partyVotes.every(
          //     (p, i) =>
          //       p.partyId === votes2.deputies.partyVotes[i].partyId &&
          //       p.votes === votes2.deputies.partyVotes[i].votes,
          //   );

          return partiesEqual;
          // && deputiesEqual;
        } catch {
          return false;
        }
      };

      // Buscar duplicado
      const duplicate = existingBallots.find(ballot =>
        isEqual(ballot.votes, voteData.votes),
      );

      /*      console.log('[PINATA-SERVICE] 📊 Resultado checkDuplicateBallot:', {
        exists: Boolean(duplicate),
        ballotId: duplicate?.id,
        existingBallotsCount: existingBallots.length,
      }); */

      return {
        exists: Boolean(duplicate),
        ballot: duplicate || null,
      };
    } catch (error) {
      // Manejar específicamente el error 404 (no encontrado)
      if (error.response?.status === 404) {
        return {
          exists: false,
          ballot: null,
        };
      }

      // Para otros errores, loguear pero continuar

      return {
        exists: false,
        ballot: null,
      };
    }
  }

  /**
   * Sube una imagen a IPFS usando Pinata
   * @param {string} filePath - Ruta del archivo de imagen
   * @param {string} fileName - Nombre del archivo
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async uploadImageToIPFS(filePathOrUrl, fileName = 'electoral-act.jpg') {
    //console.log('[PINATA-SERVICE] 📤 uploadImageToIPFS iniciado');
    /*     console.log('[PINATA-SERVICE] 📁 Archivo:', {
      pathPreview: filePathOrUrl?.substring(0, 60) + '...',
      fileName,
      isHttp: this.isHttpUrl(filePathOrUrl),
      isIpfs: this.isIpfsUrl(filePathOrUrl),
    }); */
    try {
      // 1) Si es URL (http/https/ipfs), descargar a cache
      let localPath = filePathOrUrl;
      if (this.isHttpUrl(filePathOrUrl) || this.isIpfsUrl(filePathOrUrl)) {
        localPath = await this.downloadToCache(filePathOrUrl, fileName);
      }

      // 2) Normalizar ruta para RNFS/stat
      const fsPath = localPath.startsWith('file://')
        ? localPath.slice(7)
        : localPath;

      const fileExists = await RNFS.exists(fsPath);
      if (!fileExists) throw new Error('El archivo no existe');

      // Obtener información del archivo
      const fileInfo = await RNFS.stat(fsPath);

      // Crear FormData para React Native
      const formData = new FormData();
      formData.append('file', {
        uri: fsPath.startsWith('file://') ? fsPath : `file://${fsPath}`,
        type: 'image/jpeg',
        name: fileName,
        size: fileInfo.size,
      });

      // Metadatos opcionales para organizar mejor
      const pinataMetadata = JSON.stringify({
        name: `Electoral Act - ${fileName}`,
        description:
          'Acta electoral boliviana subida desde la aplicación móvil',
        keyvalues: {
          uploadedFrom: 'mobile-app',
          type: 'electoral-act',
          timestamp: new Date().toISOString(),
        },
      });

      formData.append('pinataMetadata', pinataMetadata);

      // Configurar headers
      const headers = {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: this.apiKey,
        pinata_secret_api_key: this.apiSecret,
      };

      // Realizar la petición
      const response = await axios.post(
        `${this.baseURL}/pinning/pinFileToIPFS`,
        formData,
        {
          headers,
          timeout: 30000, // 30 segundos timeout
        },
      );

      const out = {
        success: true,
        data: {
          ipfsHash: response.data.IpfsHash,
          size: response.data.PinSize,
          timestamp: response.data.Timestamp,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
        },
      };
      /*       console.log('[PINATA-SERVICE] ✅ Imagen subida a IPFS exitosamente:', {
        ipfsHash: response.data.IpfsHash,
        size: response.data.PinSize,
        gatewayUrl: out.data.gatewayUrl?.substring(0, 60) + '...',
      }); */
      if (this.isHttpUrl(filePathOrUrl) || this.isIpfsUrl(filePathOrUrl)) {
        RNFS.unlink(fsPath).catch(() => {});
      }

      return out;
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error || error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Sube datos JSON a IPFS usando Pinata
   * @param {Object} jsonData - Datos a subir en formato JSON
   * @param {string} name - Nombre del archivo JSON
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async uploadJSONToIPFS(jsonData, name = 'electoral-act-data.json') {
    //console.log('[PINATA-SERVICE] 📤 uploadJSONToIPFS iniciado');
    //console.log('[PINATA-SERVICE] 📋 JSON name:', name);
    try {
      // Metadatos para el JSON
      const pinataMetadata = {
        name: name,
        description: 'Datos de análisis del acta electoral',
        keyvalues: {
          type: 'electoral-data',
          timestamp: new Date().toISOString(),
          uploadedFrom: 'mobile-app',
        },
      };

      // Configurar headers
      const headers = {
        'Content-Type': 'application/json',
        pinata_api_key: this.apiKey,
        pinata_secret_api_key: this.apiSecret,
      };

      // Preparar payload
      const payload = {
        pinataContent: jsonData,
        pinataMetadata: pinataMetadata,
      };

      // Realizar la petición
      const response = await axios.post(
        `${this.baseURL}/pinning/pinJSONToIPFS`,
        payload,
        {
          headers,
          timeout: 30000, // 30 segundos timeout
        },
      );

      /*       console.log('[PINATA-SERVICE] ✅ JSON subido a IPFS exitosamente:', {
        ipfsHash: response.data.IpfsHash,
        size: response.data.PinSize,
      }); */
      return {
        success: true,
        data: {
          ipfsHash: response.data.IpfsHash,
          size: response.data.PinSize,
          timestamp: response.data.Timestamp,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
        },
      };
    } catch (error) {
      //console.error('[PINATA-SERVICE] ❌ Error subiendo JSON:', error.message);
      return {
        success: false,
        error:
          error.response?.data?.error || error.message || 'Error desconocido',
      };
    }
  }
  /**
   * Función completa para subir imagen y crear metadata con análisis
   * @param {string} imagePath - Ruta de la imagen
   * @param {Object} analysisData - Datos del análisis de la imagen
   * @param {Object} electoralData - Datos del acta electoral (partyResults, voteSummaryResults)
   * @param {Object} additionalData - Datos adicionales (mesa, usuario, etc.)
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async uploadElectoralActComplete(
    imagePath,
    analysisData,
    electoralData,
    additionalData = {},
  ) {
    //console.log('[PINATA-SERVICE] 🚀 uploadElectoralActComplete iniciado');
    /*     console.log('[PINATA-SERVICE] 📋 Datos recibidos:', {
      imagePathPreview: imagePath?.substring(0, 60) + '...',
      hasAnalysisData: !!analysisData,
      hasElectoralData: !!electoralData,
      partyResultsCount: electoralData?.partyResults?.length,
      tableNumber: additionalData?.tableNumber,
      tableCode: additionalData?.tableCode,
    }); */
    try {
      // 1. Subir imagen
      //console.log('[PINATA-SERVICE] 📤 Paso 1: Subiendo imagen...');
      const imageResult = await this.uploadImageToIPFS(imagePath);
      if (!imageResult.success) {
        throw new Error(`Error subiendo imagen: ${imageResult.error}`);
      }

      // 2. Extraer datos base
      const timestamp = new Date().toISOString();
      const tableNumber = String(
        additionalData.tableNumber ?? analysisData?.table_number ?? '',
      );
      //console.log('[ADITIONAL DATA]', additionalData);
      const tableCode = String(additionalData.tableCode ?? '');
      const locationId =
        additionalData.idRecinto ?? additionalData.locationId ?? null;

      if (!tableCode || !tableNumber || !locationId) {
        throw new Error(
          'Offline payload sin campos básicos (tableCode, tableNumber o locationId).',
        );
      }
      const time =
        additionalData.time ||
        analysisData?.time ||
        new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });

      // 3. Construir attributes
      const attributes = [
        {trait_type: 'Table Number', value: tableNumber},
        {trait_type: 'Table Code', value: tableCode},
        {trait_type: 'Time', value: time},
      ];

      // Agregar votos por partido
      electoralData.partyResults.forEach(party => {
        attributes.push({
          trait_type: `Presidente - ${party.partido}`,
          value: parseInt(party.presidente, 10) || 0,
        });

        // attributes.push({
        //   trait_type: `Diputado - ${party.partido}`,
        //   value: parseInt(party.diputado, 10) || 0,
        // });
      });

      // Agregar resumen de votos
      electoralData.voteSummaryResults.forEach(summary => {
        if (summary.label === 'Votos Válidos') {
          attributes.push({
            trait_type: 'Presidente - Votos Válidos',
            value: parseInt(summary.value1, 10) || 0,
          });
          // attributes.push({
          //   trait_type: 'Diputado - Votos Válidos',
          //   value: parseInt(summary.value2, 10) || 0,
          // });
        } else if (summary.label === 'Votos en Blanco') {
          attributes.push({
            trait_type: 'Presidente - Votos en Blanco',
            value: parseInt(summary.value1, 10) || 0,
          });
          // attributes.push({
          //   trait_type: 'Diputado - Votos en Blanco',
          //   value: parseInt(summary.value2, 10) || 0,
          // });
        } else if (summary.label === 'Votos Nulos') {
          attributes.push({
            trait_type: 'Presidente - Votos Nulos',
            value: parseInt(summary.value1, 10) || 0,
          });
          // attributes.push({
          //   trait_type: 'Diputado - Votos Nulos',
          //   value: parseInt(summary.value2, 10) || 0,
          // });
        }
      });

      // 4. Construir campo DATA requerido
      const buildVoteData = type => {
        // Función auxiliar para obtener valores de forma segura
        const getValue = (label, defaultValue = 0) => {
          const item = (electoralData.voteSummaryResults || []).find(
            s => s.label === label,
          );
          if (!item) return defaultValue;

          const value = type === 'presidente' ? item.value1 : item.value2;
          return parseInt(value, 10) || defaultValue;
        };

        return {
          validVotes: getValue('Votos Válidos'),
          nullVotes: getValue('Votos Nulos'),
          blankVotes: getValue('Votos en Blanco'),
          partyVotes: electoralData.partyResults.map(party => ({
            partyId: String(party.partido || '')
              .trim()
              .toLowerCase(),
            votes: parseInt(party.presidente, 10) || 0,
          })),
          totalVotes:
            getValue('Votos Válidos') +
            getValue('Votos Nulos') +
            getValue('Votos en Blanco'),
        };
      };

      const dataField = {
        tableCode: tableCode,
        tableNumber: tableNumber,
        locationId: additionalData.idRecinto,
        votes: {
          parties: buildVoteData('presidente'),
          // deputies: buildVoteData('diputado'),
        },
      };

      // 5. Construir metadata final
      const metadata = {
        name: `Acta Electoral Mesa ${tableNumber}`,
        description: `Acta de escrutinio para la mesa ${tableNumber} (${tableCode}), registrada a las ${time}. Incluye resultados de votos para presidente por candidatura, así como el resumen de votos válidos, blancos, nulos y total.`,
        image: `ipfs://${imageResult.data.ipfsHash}`,
        external_url: `https://tuapp.com/acta/${tableCode}`,
        attributes: attributes,
        _technical: {
          uploadedAt: timestamp,
          uploadedFrom: 'mobile-app',
          version: '1.0.0',
          imageSize: imageResult.data.size,
          imageCID: imageResult.data.ipfsHash,
          analysisData: analysisData,
        },
        data: dataField,
      };

      // 6. Subir metadata
      const jsonResult = await this.uploadJSONToIPFS(
        metadata,
        `electoral-act-${tableCode}-${tableNumber}.json`,
      );

      return {
        success: true,
        data: {
          imageCID: imageResult.data.ipfsHash,
          jsonCID: jsonResult.data.ipfsHash,
          imageUrl: imageResult.data.gatewayUrl,
          jsonUrl: jsonResult.data.gatewayUrl,
          metadata: metadata,
          timestamp: timestamp,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Verifica el estado de un archivo en IPFS
   * @param {string} ipfsHash - Hash del archivo en IPFS
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async checkIPFSStatus(ipfsHash) {
    try {
      const headers = {
        pinata_api_key: this.apiKey,
        pinata_secret_api_key: this.apiSecret,
      };

      const response = await axios.get(
        `${this.baseURL}/data/pinList?hashContains=${ipfsHash}`,
        {headers},
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }
}

export default new PinataService();
