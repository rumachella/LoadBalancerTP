# Sistema de Microservicios con Load Balancer

Un sistema simple de 6 microservicios con load balancer que distribuye las peticiones automáticamente.

## 🚀 Instalación

```bash
npm install express axios
```

## 📁 Archivos

* **🧹 cleanup.js** - Limpia procesos que puedan estar corriendo en los puertos 3000-3010. Es como "apagar todo" antes de empezar.
* **🚀 start-services.js** - Inicia todos los servicios de una vez. Levanta 6 microservicios (puertos 3001-3006) y después el load balancer.
* **⚖️ load-balancer.js** - Recibe todas las peticiones en el puerto 3000 y las distribuye entre los 6 servicios usando Round Robin (va rotando).
* **🔧 server.js** - Es el código de cada microservicio individual. Simula procesamiento y responde con información del servicio.

## 🎯 Uso Rápido

### 1. Limpiar procesos anteriores

```bash
node cleanup.js
```

### 2. Iniciar todo el sistema

```bash
node start-services.js
```

¡Listo! Ya tenemos:

* 6 microservicios corriendo (puertos 3001-3006)
* 1 load balancer (puerto 3000)

## 🧪 Probar el Sistema

### Hacer una petición

```bash
http://localhost:3000/api/process
```

### Ver estadísticas

```bash
http://localhost:3000/stats
```

### Verificar salud del sistema

```bash
http://localhost:3000/health
```

### Hacer múltiples peticiones para ver el balanceo

```bash
for i in {1..10}; do curl -s http://localhost:3000/api/process | jq .serviceId; done
```

## 📊 Lo que verás

Cada petición nos va a mostrar algo como:

```json
{
  "serviceId": "service-3002",
  "port": 3002,
  "message": "Procesado por service-3002",
  "processingTime": "234ms",
  "timestamp": "2025-06-02T15:30:45.123Z"
}
```

## 🛑 Detener el Sistema

Presionar `Ctrl+C` en la terminal donde ejecutamos `start-services.js`

## ⚙️ Cómo Funciona

1. **Load Balancer** recibe peticiones en puerto 3000
2. **Round Robin** distribuye las peticiones entre servicios (3001→3002→3003→...)
3. **Health Check** verifica cada 10 segundos que los servicios estén funcionando
4. **Estadísticas** muestra el uso de cada servicio

## 🔧 Personalización

* **Cambiar puertos** : Modifica el array `PORTS` en `start-services.js`
* **Agregar servicios** : Añade más puertos al array
* **Tiempo de procesamiento** : Modifica el random en `server.js`

## 🐛 Solución de Problemas

* **Error "puerto ya en uso"** : Ejecutar `node cleanup.js`
* **No responde** : Verificar que todos los servicios estén corriendo con `/health`
* **Dependencias faltantes** : `npm install express axios`
# loadbalancer
