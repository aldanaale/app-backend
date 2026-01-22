Backend – App de Arriendo de Camiones de Mudanza

Este repositorio contiene el backend de la Aplicación Web para la Gestión y Cotización de Mudanzas, desarrollada como proyecto de título.
El backend expone una API REST que permite la gestión de usuarios administrativos, camiones, cotizaciones y cargas, aplicando reglas de negocio basadas en Unidades de Carga (UC).

🛠️ Tecnologías utilizadas

Node.js (v20 o superior)

Express.js

PostgreSQL

Knex.js (query builder)

JWT (JSON Web Tokens) para autenticación

bcrypt para encriptación de contraseñas

Nodemon (solo en desarrollo)

📂 Estructura del proyecto
backend/
├─ src/
│  ├─ controllers/
│  │  ├─ authController.js
│  │  ├─ trucksController.js
│  │  └─ quotesController.js
│  ├─ middlewares/
│  │  ├─ authMiddleware.js
│  │  └─ validationMiddleware.js
│  ├─ routes/
│  │  ├─ authRoutes.js
│  │  ├─ trucksRoutes.js
│  │  └─ quotesRoutes.js
│  ├─ db.js              # Configuración de Knex y conexión a PostgreSQL
│  └─ index.js           # Punto de entrada del servidor
├─ package.json
└─ README.md

⚙️ Instalación y configuración
1️⃣ Requisitos previos

Node.js v20 o superior

PostgreSQL (local o en la nube)

Git

2️⃣ Clonar el repositorio
git clone https://github.com/USUARIO/NOMBRE_REPOSITORIO.git
cd backend

3️⃣ Instalar dependencias
npm install


Dependencias principales:

express

knex

pg

bcrypt

jsonwebtoken

Dependencias de desarrollo:

nodemon

4️⃣ Configuración de base de datos

Este proyecto NO incluye migraciones.
Se asume que la base de datos y las tablas ya existen.

Configura la conexión a PostgreSQL directamente en el archivo:

// src/db.js
import knex from 'knex';

export default knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    user: 'postgres',
    password: 'password',
    database: 'mudanza_app',
    port: 5432
  }
});


⚠️ Nota: Para este proyecto académico, los datos de conexión pueden ser locales o de prueba.
En producción se recomienda usar variables de entorno.

▶️ Ejecución del servidor
Desarrollo (con reinicio automático)
npm run dev

Producción
npm start


El servidor se ejecutará en:

http://localhost:3000

🔐 Autenticación

La API utiliza JWT para proteger rutas administrativas.

Endpoints de autenticación
Método	Endpoint	Descripción
POST	/auth/register	Crear usuario administrativo
POST	/auth/login	Iniciar sesión y obtener token
GET	/auth/profile	Perfil del usuario (protegido)

Las rutas protegidas requieren el header:

Authorization: Bearer <TOKEN>

🚚 Endpoints principales
Camiones
Método	Endpoint	Descripción
GET	/trucks	Listar camiones
POST	/trucks	Crear camión
PUT	/trucks/:id	Actualizar camión
DELETE	/trucks/:id	Eliminar camión
Cotizaciones
Método	Endpoint	Descripción
POST	/quotes	Crear cotización
GET	/quotes/:id	Ver cotización
PUT	/quotes/:id	Actualizar cotización
DELETE	/quotes/:id	Eliminar cotización
Cargas
Método	Endpoint	Descripción
POST	/quotes/:quoteId/loads	Agregar carga
DELETE	/quotes/:quoteId/loads/:loadId	Eliminar carga
📐 Reglas de negocio (Unidades de Carga – UC)

Cada carga representa un número de bloques UC

Ejemplos:

Caja estándar → 1 UC

Refrigerador → 2 UC

Cama King → 8 UC

Capacidad de camiones:

S: 36 UC

M: 64 UC

XL: 144 UC

📌 La suma de UC de las cargas no puede superar la capacidad del camión asignado.
El sistema puede recomendar automáticamente el camión adecuado según el total de UC.

🧪 Pruebas

Las rutas pueden ser probadas usando:

Postman

cURL

Ejemplo:

curl http://localhost:3000/trucks

🔒 Seguridad

Encriptación de contraseñas con bcrypt

Autenticación con JWT

Validación de datos en middlewares

Manejo básico de errores

No se suben credenciales sensibles al repositorio