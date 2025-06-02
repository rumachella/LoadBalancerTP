const express = require('express');
const axios = require('axios');
const app = express();

const LOAD_BALANCER_PORT = 3000;

// Lista de servicios backend
const services = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:3006'
];

let currentServiceIndex = 0;
let requestCount = 0;
const serviceStats = {};

// Inicializar estadísticas
services.forEach(service => {
  serviceStats[service] = {
    requests: 0,
    errors: 0,
    lastUsed: null,
    healthy: true
  };
});

app.use(express.json());

// Función para obtener el siguiente servicio (Round Robin)
function getNextService() {
  const healthyServices = services.filter(service => serviceStats[service].healthy);
  
  if (healthyServices.length === 0) {
    throw new Error('No hay servicios disponibles');
  }
  
  // Si el servicio actual no está saludable, encontrar el siguiente que sí lo esté
  let attempts = 0;
  while (attempts < services.length) {
    const service = services[currentServiceIndex];
    currentServiceIndex = (currentServiceIndex + 1) % services.length;
    
    if (serviceStats[service].healthy) {
      return service;
    }
    attempts++;
  }
  
  // Si llegamos aquí, usar el primer servicio saludable
  return healthyServices[0];
}

// Health check de servicios
async function checkServiceHealth(service) {
  try {
    const response = await axios.get(`${service}/health`, { timeout: 2000 });
    serviceStats[service].healthy = true;
    return true;
  } catch (error) {
    serviceStats[service].healthy = false;
    return false;
  }
}

// Health check periódico
setInterval(async () => {
  console.log('🔍 Verificando salud de servicios...');
  for (const service of services) {
    const isHealthy = await checkServiceHealth(service);
    console.log(`   ${service}: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  }
}, 10000); // Cada 10 segundos

// Endpoint principal que balancea la carga
app.all('/api/*', async (req, res) => {
  requestCount++;
  const requestId = `req-${requestCount}`;
  
  console.log(`📥 ${requestId}: ${req.method} ${req.path}`);
  
  try {
    const targetService = getNextService();
    const targetUrl = `${targetService}${req.path}`;
    
    console.log(`🔄 ${requestId}: Enviando a ${targetService}`);
    
    // Actualizar estadísticas
    serviceStats[targetService].requests++;
    serviceStats[targetService].lastUsed = new Date().toISOString();
    
    const startTime = Date.now();
    
    // Hacer la petición al servicio
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        'x-forwarded-for': req.ip,
        'x-request-id': requestId
      },
      timeout: 5000
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ ${requestId}: Respuesta en ${responseTime}ms desde ${targetService}`);
    
    // Agregar headers del load balancer
    res.set({
      'x-load-balancer': 'custom-lb',
      'x-service-used': targetService,
      'x-request-id': requestId,
      'x-response-time': `${responseTime}ms`
    });
    
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error(`❌ ${requestId}: Error -`, error.message);
    
    if (error.config && error.config.url) {
      const failedService = error.config.url.split('/')[2].replace('localhost:', 'http://localhost:');
      serviceStats[failedService].errors++;
    }
    
    res.status(500).json({
      error: 'Error del load balancer',
      message: error.message,
      requestId: requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// Dashboard de estadísticas
app.get('/stats', (req, res) => {
  const healthyServices = services.filter(service => serviceStats[service].healthy);
  
  res.json({
    loadBalancer: {
      totalRequests: requestCount,
      healthyServices: healthyServices.length,
      totalServices: services.length,
      uptime: process.uptime()
    },
    services: serviceStats,
    healthyServices: healthyServices
  });
});

// Endpoint de salud del load balancer
app.get('/health', (req, res) => {
  const healthyServices = services.filter(service => serviceStats[service].healthy);
  
  res.json({
    status: healthyServices.length > 0 ? 'healthy' : 'unhealthy',
    loadBalancer: 'running',
    servicesHealthy: healthyServices.length,
    servicesTotal: services.length,
    timestamp: new Date().toISOString()
  });
});

app.listen(LOAD_BALANCER_PORT, () => {
  console.log(`🔥 Load Balancer corriendo en puerto ${LOAD_BALANCER_PORT}`);
  console.log(`   Dashboard: http://localhost:${LOAD_BALANCER_PORT}/stats`);
  console.log(`   Health: http://localhost:${LOAD_BALANCER_PORT}/health`);
  console.log(`   API: http://localhost:${LOAD_BALANCER_PORT}/api/process`);
  console.log('');
  console.log('🎯 Servicios backend configurados:');
  services.forEach((service, index) => {
    console.log(`   ${index + 1}. ${service}`);
  });
});