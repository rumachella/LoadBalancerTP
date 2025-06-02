const express = require('express');
const app = express();

// Puerto viene como argumento o por defecto 3001
const PORT = process.argv[2] || 3001;
const SERVICE_ID = `service-${PORT}`;

app.use(express.json());

// Endpoint principal que simula procesamiento
app.get('/api/process', (req, res) => {
  const startTime = Date.now();
  
  // Simular algo de procesamiento (100-500ms random)
  const processingTime = Math.floor(Math.random() * 400) + 100;
  
  setTimeout(() => {
    const endTime = Date.now();
    res.json({
      serviceId: SERVICE_ID,
      port: PORT,
      message: `Procesado por ${SERVICE_ID}`,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
      totalTime: `${endTime - startTime}ms`
    });
  }, processingTime);
});

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    serviceId: SERVICE_ID,
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});


// Endpoint para obtener info del servicio
app.get('/info', (req, res) => {
  res.json({
    serviceId: SERVICE_ID,
    port: PORT,
    pid: process.pid,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ${SERVICE_ID} corriendo en puerto ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Process: http://localhost:${PORT}/api/process`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log(`📴 ${SERVICE_ID} cerrando...`);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`📴 ${SERVICE_ID} cerrando...`);
  process.exit(0);
});