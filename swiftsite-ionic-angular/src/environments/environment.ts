// En desarrollo web, sigue la IP con la que se abre Ionic (local o Wi-Fi).
// Para despliegue o Android, configura una URL HTTPS alcanzable antes de compilar.
const developmentWeb = typeof window !== 'undefined' && ['8100', '4200'].includes(window.location.port);
const host = developmentWeb ? window.location.hostname : '127.0.0.1';
export const environment = { apiUrl: `http://${host}:8000/api` };
