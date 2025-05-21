import axios, { AxiosError } from 'axios';
import { randomUUID } from 'crypto';

const API_URL = 'http://localhost:3001';

async function testAPI() {
  try {
    console.log('🧪 Iniciando pruebas de la API...\n');

    // 0. Login como admin
    console.log('0. Haciendo login como admin...');
    const loginData = {
      username: 'admin',
      password: 'Tripode123'
    };
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, loginData);
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso. Token:', token);

    // 1. Crear un sorteo de prueba
    console.log('1. Creando sorteo de prueba...');
    const raffleData = {
      nombre: "Sorteo de prueba",
      descripcion: "Un sorteo para probar la API",
      tipo: "TOKEN",
      premio: {
        cantidad: 100,
        token: "WLD"
      },
      configuracion: {
        precio_por_numero: 1,
        total_numeros: 100,
        fecha_fin: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estado: "ACTIVO"
      },
      admin_id: "admin_test"
    };

    const createResponse = await axios.post(`${API_URL}/sorteos/crear`, raffleData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const raffleId = createResponse.data.id;
    console.log('✅ Sorteo creado:', createResponse.data);

    // 2. Obtener todos los sorteos
    console.log('\n2. Obteniendo todos los sorteos...');
    const rafflesResponse = await axios.get(`${API_URL}/sorteos`);
    console.log('✅ Sorteos obtenidos:', rafflesResponse.data);

    // 3. Obtener un sorteo específico
    console.log('\n3. Obteniendo sorteo específico...');
    const raffleResponse = await axios.get(`${API_URL}/sorteos/${raffleId}`);
    console.log('✅ Sorteo obtenido:', raffleResponse.data);

    // 4. Participar en un sorteo (simulado)
    console.log('\n4. Simulando participación en sorteo...');
    const participationData = {
      raffleId,
      numero_elegido: 42,
      proof: {
        nullifier_hash: "test_hash",
        merkle_root: "test_root",
        proof: "test_proof",
        verification_level: "orb"
      },
      action: "participate",
      signal: "test_signal",
      cantidad_numeros: 1
    };

    try {
      const participateResponse = await axios.post(`${API_URL}/sorteos/participar`, participationData);
      console.log('✅ Participación simulada:', participateResponse.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log('⚠️ Participación fallida (esperado por verificación de World ID):', error.response?.data);
      } else {
        console.log('⚠️ Error inesperado:', error);
      }
    }

    // 5. Obtener estado del sorteo
    console.log('\n5. Obteniendo estado del sorteo...');
    const statusResponse = await axios.get(`${API_URL}/sorteos/${raffleId}/status`);
    console.log('✅ Estado del sorteo:', statusResponse.data);

    console.log('\n✨ Pruebas completadas');
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    } else {
      console.error('❌ Error inesperado:', error);
    }
  }
}

// Ejecutar las pruebas
testAPI(); 