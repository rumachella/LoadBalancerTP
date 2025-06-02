const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function cleanup() {
  console.log('🧹 Limpiando procesos de Node.js en puertos 3000-3010...\n');

  try {
    // Buscar procesos usando puertos
    const { stdout } = await execAsync('lsof -ti :3000,:3001,:3002,:3003,:3004,:3005,:3006,:3007,:3008,:3009,:3010 2>/dev/null || echo "no processes"');
    
    if (stdout.trim() === 'no processes' || !stdout.trim()) {
      console.log('✅ No hay procesos usando esos puertos');
      return;
    }

    const pids = stdout.trim().split('\n').filter(pid => pid);
    console.log(`🔍 Encontrados ${pids.length} procesos:`, pids.join(', '));

    // Matar procesos
    for (const pid of pids) {
      try {
        await execAsync(`kill ${pid}`);
        console.log(`✅ Proceso ${pid} terminado`);
      } catch (error) {
        console.log(`⚠️  No se pudo terminar proceso ${pid} (probablemente ya terminó)`);
      }
    }

    // Verificar que se terminaron
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const { stdout: remaining } = await execAsync('lsof -ti :3000,:3001,:3002,:3003,:3004,:3005,:3006 2>/dev/null || echo "no processes"');
      if (remaining.trim() === 'no processes' || !remaining.trim()) {
        console.log('\n🎉 Todos los procesos terminados correctamente');
      } else {
        console.log('\n⚠️  Algunos procesos siguen corriendo, usando kill -9...');
        const stubborn = remaining.trim().split('\n').filter(pid => pid);
        for (const pid of stubborn) {
          await execAsync(`kill -9 ${pid}`).catch(() => {});
        }
      }
    } catch (error) {
      console.log('\n✅ Verificación completada');
    }

  } catch (error) {
    console.log('ℹ️  No se encontraron procesos para limpiar o error al verificar');
  }

  console.log('\n🚀 Ahora puedes ejecutar: npm start');
}

cleanup().catch(console.error);