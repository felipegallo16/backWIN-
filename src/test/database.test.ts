import { getActiveRaffles, getAllRaffles } from '../models/database';

async function testDatabase() {
  try {
    console.log('Probando conexión a la base de datos...');
    
    // Prueba 1: Obtener todos los sorteos
    console.log('\n1. Obteniendo todos los sorteos:');
    const allRaffles = await getAllRaffles();
    console.log(`Total de sorteos encontrados: ${allRaffles.length}`);
    console.log('Muestra de sorteos:', allRaffles.slice(0, 2));

    // Prueba 2: Obtener sorteos activos
    console.log('\n2. Obteniendo sorteos activos:');
    const activeRaffles = await getActiveRaffles();
    console.log(`Total de sorteos activos: ${activeRaffles.length}`);
    console.log('Muestra de sorteos activos:', activeRaffles.slice(0, 2));

    console.log('\n✅ Pruebas completadas exitosamente');
  } catch (error) {
    console.error('❌ Error al probar la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar la prueba
testDatabase(); 