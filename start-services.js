const { spawn } = require('child_process');
const path = require('path');

const services = [];
const PORTS = [3001, 3002, 3003, 3004, 3005, 3006];

console.log('🚀 Iniciando microservicios...\n');

// Función para iniciar un servicio
function startService(port) {
  return new Promise((resolve) => {
    const service = spawn('node', ['server.js', port], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname
    });

    service.stdout.on('data', (data) => {
      console.log(`[Puerto ${port}] ${data.toString().trim()}`);
    });

    service.stderr.on('data', (data) => {
      console.error(`[Puerto ${port}] ERROR: ${data.toString().trim()}`);
    });

    service.on('close', (code) => {
      console.log(`[Puerto ${port}] Servicio cerrado con código ${code}`);
    });

    services.push({ port, process: service });
    
    // Dar tiempo para que el servicio se inicie
    setTimeout(() => resolve(), 1000);
  });
}

// Función para iniciar el load balancer
function startLoadBalancer() {
  console.log('\n🔥 Iniciando Load Balancer...\n');
  
  const loadBalancer = spawn('node', ['load-balancer.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });

  loadBalancer.stdout.on('data', (data) => {
    console.log(`[Load Balancer] ${data.toString().trim()}`);
  });

  loadBalancer.stderr.on('data', (data) => {
    console.error(`[Load Balancer] ERROR: ${data.toString().trim()}`);
  });

  loadBalancer.on('close', (code) => {
    console.log(`[Load Balancer] Cerrado con código ${code}`);
  });

  return loadBalancer;
}

// Iniciar todos los servicios
async function startAllServices() {
  // Iniciar microservicios
  for (const port of PORTS) {
    await startService(port);
  }

  console.log(`\n✅ ${PORTS.length} microservicios iniciados correctamente\n`);

  // Esperar un poco más para asegurar que todos estén listos
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Iniciar load balancer
  const loadBalancer = startLoadBalancer();

  console.log('\n📋 Comandos útiles:');
  console.log('   curl http://localhost:3000/api/process   # Petición balanceada');
  console.log('   curl http://localhost:3000/stats         # Ver estadísticas');
  console.log('   curl http://localhost:3000/health        # Health check');
  console.log('\n🔄 Para hacer múltiples peticiones:');
  console.log('   for i in {1..10}; do curl -s http://localhost:3000/api/process | jq .serviceId; done');

  // Manejo de cierre
  const cleanup = () => {
    console.log('\n🛑 Cerrando todos los servicios...');
    
    // Cerrar load balancer
    if (loadBalancer) {
      loadBalancer.kill('SIGTERM');
    }
    
    // Cerrar microservicios
    services.forEach(({ port, process }) => {
      console.log(`   Cerrando servicio en puerto ${port}`);
      process.kill('SIGTERM');
    });

    setTimeout(() => {
      console.log('✅ Todos los servicios cerrados');
      process.exit(0);
    }, 2000);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// Verificar dependencias
function checkDependencies() {
  try {
    require('express');
    require('axios');
    return true;
  } catch (error) {
    console.error('❌ Dependencias faltantes. Instala con:');
    console.error('   npm install express axios');
    return false;
  }
}

// Ejecutar
if (checkDependencies()) {
  startAllServices().catch(console.error);
} else {
  process.exit(1);
}