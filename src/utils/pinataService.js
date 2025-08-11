import axios from 'axios';
import RNFS from 'react-native-fs';

class PinataService {
  constructor() {
    // Usar las credenciales directamente del .env
    this.apiKey = '06238022e0a0581a30e5';
    this.apiSecret =
      '0de6731c2382f777bc96536904b0d271330110da71d12119e3c1076134d129f9';
    this.jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhNzMyYjA2Zi0yYTYxLTQ2ZWEtYjExYi1mOTE5ODU0ZWU2N2UiLCJlbWFpbCI6ImNoYW1iaWEwNEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMDYyMzgwMjJlMGEwNTgxYTMwZTUiLCJzY29wZWRLZXlTZWNyZXQiOiIwZGU2NzMxYzIzODJmNzc3YmM5NjUzNjkwNGIwZDI3MTMzMDExMGRhNzFkMTIxMTllM2MxMDc2MTM0ZDEyOWY5IiwiZXhwIjoxNzg0MDcxNDgzfQ.XTbeu5IQKnaVnM5NIu5CT3oWDF6PIf5BI38O0pxwgU4';

    this.baseURL = 'https://api.pinata.cloud';
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

      // 1️⃣ Subir imagen a IPFS
      const imageResult = await this.uploadImageToIPFS(imagePath);
      if (!imageResult.success) {
        throw new Error(`Error subiendo imagen: ${imageResult.error}`);
      }

      console.log('✅ Imagen subida con CID:', imageResult.data.ipfsHash);

      // 2️⃣ Crear metadata NFT completa con análisis
      const timestamp = new Date().toISOString();
      const tableNumber =
        additionalData.tableNumber || analysisData?.table_number || 'N/A';
      const tableCode =
        additionalData.tableCode || analysisData?.table_code || 'N/A';
      const time =
        additionalData.time ||
        analysisData?.time ||
        new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });

      // Crear attributes array en formato NFT
      const attributes = [
        {trait_type: 'Table Number', value: tableNumber},
        {trait_type: 'Table Code', value: tableCode},
        {trait_type: 'Time', value: time},
      ];

      // Agregar datos de presidente de partyResults
      if (electoralData && electoralData.partyResults) {
        electoralData.partyResults.forEach(party => {
          if (party.presidente && party.presidente !== '') {
            attributes.push({
              trait_type: `Presidente - ${party.partido}`,
              value: parseInt(party.presidente, 10) || 0,
            });
          }
        });
      }

      // Agregar datos de diputado de partyResults
      if (electoralData && electoralData.partyResults) {
        electoralData.partyResults.forEach(party => {
          if (party.diputado && party.diputado !== '') {
            attributes.push({
              trait_type: `Diputado - ${party.partido}`,
              value: parseInt(party.diputado, 10) || 0,
            });
          }
        });
      }

      // Agregar datos de voteSummaryResults
      if (electoralData && electoralData.voteSummaryResults) {
        electoralData.voteSummaryResults.forEach(summary => {
          if (summary.value1 && summary.value1 !== '') {
            attributes.push({
              trait_type: `Presidente - ${summary.label}`,
              value: parseInt(summary.value1, 10) || 0,
            });
          }
          if (summary.value2 && summary.value2 !== '') {
            attributes.push({
              trait_type: `Diputado - ${summary.label}`,
              value: parseInt(summary.value2, 10) || 0,
            });
          }
        });
      }

      // Metadata en formato NFT
      const metadata = {
        name: `Acta Electoral Mesa ${tableNumber}`,
        description: `Acta de escrutinio para la mesa ${tableNumber} (${tableCode}), registrada a las ${time}. Incluye resultados de votos para presidente y diputado por candidatura, así como el resumen de votos válidos, blancos, nulos y total.`,
        image: `ipfs://${imageResult.data.ipfsHash}`,
        external_url: `https://tuapp.com/acta/${tableCode}`,
        attributes: attributes,

        // Datos adicionales para referencia (no parte del estándar NFT)
        _technical: {
          uploadedAt: timestamp,
          uploadedFrom: 'mobile-app',
          version: '1.0.0',
          imageSize: imageResult.data.size,
          imageCID: imageResult.data.ipfsHash,
          analysisData: analysisData,
          user: {
            userId: additionalData.userId,
            userName: additionalData.userName,
            role: additionalData.role || 'witness',
          },
          verification: {
            isElectoralAct: analysisData?.if_electoral_act || false,
            isImageClear: !analysisData?.image_not_clear,
            verificationDate: timestamp,
          },
        },
      };

      // 3️⃣ Subir JSON con metadata a IPFS
      const jsonResult = await this.uploadJSONToIPFS(
        metadata,
        `electoral-act-${tableCode}-${tableNumber}.json`,
      );

      if (!jsonResult.success) {
        throw new Error(`Error subiendo JSON: ${jsonResult.error}`);
      }

      console.log('✅ JSON subido con CID:', jsonResult.data.ipfsHash);

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
      console.error('❌ Error en subida completa:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido en la subida completa',
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
      console.error('❌ Error verificando estado IPFS:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }
}

export default new PinataService();
