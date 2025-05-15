# WinTrust Backend API

API backend para el sistema de sorteos WinTrust.

## Tecnologías

- Node.js
- Express
- TypeScript
- World ID para verificación de identidad

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/wintrust-backend.git
cd wintrust-backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```
Editar `.env` con tus valores.

## Desarrollo

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3001`

## Endpoints

### Sorteos

- `GET /sorteos` - Lista todos los sorteos activos
- `GET /sorteos/:id` - Obtiene detalles de un sorteo
- `POST /sorteos/participar` - Permite participar en un sorteo
- `GET /sorteos/:id/ganador` - Obtiene el ganador de un sorteo
- `POST /sorteos/crear` - Crea un nuevo sorteo (solo admin)
- `PATCH /sorteos/:id` - Actualiza la configuración de un sorteo
- `GET /sorteos/notificaciones/:userId` - Obtiene notificaciones de un usuario
- `GET /sorteos/status/:id` - Obtiene el estado de un sorteo

## Variables de Entorno

- `WORLD_ID_APP_ID`: ID de la aplicación en World ID
- `WORLD_ID_ACTION`: ID de la acción para la participación
- `PORT`: Puerto del servidor (default: 3001)
- `NODE_ENV`: Ambiente (development/production)
- `FRONTEND_URL`: URL del frontend para CORS
- `RATE_LIMIT_WINDOW_MS`: Ventana de tiempo para rate limiting
- `RATE_LIMIT_MAX_REQUESTS`: Máximo de requests permitidos

## Despliegue

El backend está configurado para desplegarse en Render.

1. Crear una nueva aplicación web en Render
2. Conectar con el repositorio de GitHub
3. Configurar las variables de entorno en Render
4. Deploy automático con cada push a main

## Contribución

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 