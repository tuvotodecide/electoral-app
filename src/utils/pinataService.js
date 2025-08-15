import axios from 'axios';
import RNFS from 'react-native-fs';
import { PINATA_API_KEY, PINATA_API_SECRET, PINATA_JWT, BACKEND_RESULT } from "@env"

class PinataService {
  constructor() {
    this.apiKey = PINATA_API_KEY;
    this.apiSecret = PINATA_API_SECRET
    this.jwt = PINATA_JWT

    this.baseURL = 'https://api.pinata.cloud';
  }

  async checkDuplicateBallot(voteData) {
    try {
      // Extraer número de mesa
      const tableNumber = voteData.tableNumber || 'N/A';
      console.log("Verificando duplicados para mesa:", tableNumber);

      // Hacer la petición al backend
      const response = await axios.get(
        `${BACKEND_RESULT}/api/v1/ballots/by-table/${tableNumber}`
      );

      const data = response.data;

      // Normalizar para siempre tener un array
      const existingBallots = Array.isArray(data)
        ? data
        : data
          ? [data]
          : [];

      console.log('Actas existentes encontradas:', existingBallots.length);

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
            votes1.parties.partyVotes.length === votes2.parties.partyVotes.length &&
            votes1.parties.partyVotes.every((p, i) =>
              p.partyId === votes2.parties.partyVotes[i].partyId &&
              p.votes === votes2.parties.partyVotes[i].votes
            );

          const deputiesEqual =
            votes1.deputies.validVotes === votes2.deputies.validVotes &&
            votes1.deputies.nullVotes === votes2.deputies.nullVotes &&
            votes1.deputies.blankVotes === votes2.deputies.blankVotes &&
            votes1.deputies.totalVotes === votes2.deputies.totalVotes &&
            Array.isArray(votes1.deputies.partyVotes) &&
            Array.isArray(votes2.deputies.partyVotes) &&
            votes1.deputies.partyVotes.length === votes2.deputies.partyVotes.length &&
            votes1.deputies.partyVotes.every((p, i) =>
              p.partyId === votes2.deputies.partyVotes[i].partyId &&
              p.votes === votes2.deputies.partyVotes[i].votes
            );

          return partiesEqual && deputiesEqual;
        } catch {
          return false;
        }
      };


      console.log("EXISTING BALLOTS", existingBallots);
      console.log("VOTEDATA", voteData);

      // Buscar duplicado
      const duplicate = existingBallots.find(ballot =>
        isEqual(ballot.votes, voteData.votes)
      );

      return {
        exists: Boolean(duplicate),
        ballot: duplicate || null
      };
    } catch (error) {
      // Manejar específicamente el error 404 (no encontrado)
      if (error.response?.status === 404) {
        console.log('No se encontraron actas para esta mesa - Continuando...');
        return {
          exists: false,
          ballot: null
        };
      }

      // Para otros errores, loguear pero continuar
      console.error('Error verificando duplicados:', error);
      return {
        exists: false,
        ballot: null
      };
    }
  }



  /**
   * Sube una imagen a IPFS usando Pinata
   * @param {string} filePath - Ruta del archivo de imagen
   * @param {string} fileName - Nombre del archivo
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async uploadImageToIPFS(filePath, fileName = 'electoral-act.jpg') {
    try {
      console.log('📤 Subiendo imagen a IPFS:', filePath);

      // Verificar que el archivo existe
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        throw new Error('El archivo no existe');
      }

      // Obtener información del archivo
      const fileInfo = await RNFS.stat(filePath);

      // Crear FormData para React Native
      const formData = new FormData();
      formData.append('file', {
        uri: filePath.startsWith('file://') ? filePath : `file://${filePath}`,
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

      console.log('✅ Imagen subida exitosamente:', response.data);

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
      console.error('❌ Error subiendo imagen a IPFS:', error);
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
    try {
      console.log('📤 Subiendo JSON a IPFS:', name);

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

      console.log('✅ JSON subido exitosamente:', response.data);

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
      console.error('❌ Error subiendo JSON a IPFS:', error);
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
    try {
      console.log('🚀 Iniciando subida completa del acta electoral');
      console.log('📊 Datos recibidos:', {
        analysisData,
        electoralData,
        additionalData
      });

      // 1. Subir imagen
      const imageResult = await this.uploadImageToIPFS(imagePath);
      if (!imageResult.success) {
        throw new Error(`Error subiendo imagen: ${imageResult.error}`);
      }

      // 2. Extraer datos base
      const timestamp = new Date().toISOString();
      const tableNumber = additionalData.tableNumber || analysisData?.table_number || 'N/A';
      const tableCode = additionalData.tableCode || 'N/A';
      const time = additionalData.time || analysisData?.time || new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // 3. Construir attributes
      const attributes = [
        { trait_type: 'Table Number', value: tableNumber },
        { trait_type: 'Table Code', value: tableCode },
        { trait_type: 'Time', value: time },
      ];

      // Agregar votos por partido
      electoralData.partyResults.forEach(party => {
        attributes.push({
          trait_type: `Presidente - ${party.partido}`,
          value: parseInt(party.presidente, 10) || 0
        });

        attributes.push({
          trait_type: `Diputado - ${party.partido}`,
          value: parseInt(party.diputado, 10) || 0
        });
      });

      // Agregar resumen de votos
      electoralData.voteSummaryResults.forEach(summary => {
        if (summary.label === 'Votos Válidos') {
          attributes.push({
            trait_type: 'Presidente - Votos Válidos',
            value: parseInt(summary.value1, 10) || 0
          });
          attributes.push({
            trait_type: 'Diputado - Votos Válidos',
            value: parseInt(summary.value2, 10) || 0
          });
        } else if (summary.label === 'Votos en Blanco') {
          attributes.push({
            trait_type: 'Presidente - Votos en Blanco',
            value: parseInt(summary.value1, 10) || 0
          });
          attributes.push({
            trait_type: 'Diputado - Votos en Blanco',
            value: parseInt(summary.value2, 10) || 0
          });
        } else if (summary.label === 'Votos Nulos') {
          attributes.push({
            trait_type: 'Presidente - Votos Nulos',
            value: parseInt(summary.value1, 10) || 0
          });
          attributes.push({
            trait_type: 'Diputado - Votos Nulos',
            value: parseInt(summary.value2, 10) || 0
          });
        }
      });

      // 4. Construir campo DATA requerido
      const buildVoteData = (type) => {
        // Función auxiliar para obtener valores de forma segura
        const getValue = (label, defaultValue = 0) => {
          const item = electoralData.voteSummaryResults.find(s => s.label === label);
          if (!item) return defaultValue;

          const value = type === 'presidente' ? item.value1 : item.value2;
          return parseInt(value, 10) || defaultValue;
        };

        return {
          validVotes: getValue('Votos Válidos'),
          nullVotes: getValue('Votos Nulos'),
          blankVotes: getValue('Votos en Blanco'),
          partyVotes: electoralData.partyResults.map(party => ({
            partyId: party.partido,
            votes: parseInt(type === 'presidente' ? party.presidente : party.diputado, 10) || 0
          })),
          totalVotes: getValue('Votos Válidos') + getValue('Votos Nulos') + getValue('Votos en Blanco')
        };
      };

      const dataField = {
        tableCode: tableCode,
        tableNumber: tableNumber,
        locationId: additionalData.idRecinto || 'UNKNOWN',
        votes: {
          parties: buildVoteData('presidente'),
          deputies: buildVoteData('diputado')
        }
      };

      // 5. Construir metadata final
      const metadata = {
        name: `Acta Electoral Mesa ${tableNumber}`,
        description: `Acta de escrutinio para la mesa ${tableNumber} (${tableCode}), registrada a las ${time}. Incluye resultados de votos para presidente y diputado por candidatura, así como el resumen de votos válidos, blancos, nulos y total.`,
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
        data: dataField
      };

      console.log('📝 Metadata completa:', JSON.stringify(metadata, null, 2));

      // 6. Subir metadata
      const jsonResult = await this.uploadJSONToIPFS(
        metadata,
        `electoral-act-${tableCode}-${tableNumber}.json`
      );

      console.log('✅ JSON subido con CID:', jsonResult.data.ipfsHash);

      return {
        success: true,
        data: {
          imageCID: imageResult.data.ipfsHash,
          jsonCID: jsonResult.data.ipfsHash,
          imageUrl: imageResult.data.gatewayUrl,
          jsonUrl: jsonResult.data.gatewayUrl,
          metadata: metadata,
          timestamp: timestamp
        }
      };
    } catch (error) {
      console.error('❌ Error en subida completa:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
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
        { headers },
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Error verificando estado IPFS:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }
}

export default new PinataService();
