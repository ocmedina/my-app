/**
 * keepalive.worker.js
 * Web Worker para mantener la conexión con Supabase activa en background.
 * Los Web Workers NO son throttleados por el browser aunque la pestaña esté inactiva,
 * a diferencia de setInterval en el hilo principal que se limita a ~1/min en background.
 */

let intervalId = null;
const PING_INTERVAL_MS = 20000; // 20 segundos — suficientemente frecuente para que Supabase no cierre la conexión

function startPing() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    self.postMessage({ type: 'ping' });
  }, PING_INTERVAL_MS);
}

function stopPing() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

self.onmessage = (event) => {
  const { type } = event.data || {};
  if (type === 'start') {
    startPing();
  } else if (type === 'stop') {
    stopPing();
  }
};

// Auto-start al crear el worker
startPing();
