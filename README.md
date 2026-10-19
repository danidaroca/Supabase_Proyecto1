# Supabase_Proyecto1: Gestión Completa CRUD con Roles (Ionic Standalone & Supabase RBAC)

**Módulo Profesional:** Desarrollo de Interfaces (Código 0488)  
**Ciclo Formativo:** Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM2)  
**Alumno:** Daniel Daroca  
**Fecha:** Octubre 2026  

---

## 🌐 Enlaces del Proyecto

- 🔗 **Repositorio GitHub:** [https://github.com/danidaroca/Supabase_Proyecto1](https://github.com/danidaroca/Supabase_Proyecto1) *(o [https://github.com/danidaroca/dam-crm-app](https://github.com/danidaroca/dam-crm-app))*
- 🚀 **Despliegue en Vercel:** [https://supabase-proyecto1.vercel.app](https://supabase-proyecto1.vercel.app) *(o [https://dam-crm-app.vercel.app](https://dam-crm-app.vercel.app))*

---

## ✨ Nuevas Funcionalidades Implementadas

1. 🔐 **Solicitud Obligatoria de Login para CUD (Insertar, Actualizar o Editar):**
   - Cuando el usuario intenta **insertar**, **editar** o **eliminar** un cliente, la aplicación verifica si existe una sesión activa en Supabase Auth.
   - Si no hay sesión, se abre automáticamente el modal de autenticación.
   - **Control estricto de RLS:** Si el usuario autenticado tiene rol `user`, las políticas RLS bloquean la mutación y se muestra un aviso explicativo. Solo el rol `admin` tiene permiso de escritura.
   - Credenciales de prueba integradas:
     - **Admin (CRUD completo):** `admin@test.com` / `123456`
     - **Usuario (Solo lectura / RLS bloqueado):** `user@test.com` / `123456`

2. 🖼️ **Nueva Página para Storage Bucket (`/storage`):**
   - Página dedicada para consultar los objetos del bucket público `imagenes` en Supabase Storage.
   - Presentación moderna en **Cards responsivas (`ion-card`)**, con visualización de la imagen, título, descripción, peso en KB, formato MIME, fecha y botones para copiar o abrir la URL pública.

---

## 🎯 Alineación Curricular (Comunidad de Madrid)

- **RA 1: Confecciona interfaces gráficas de usuario utilizando herramientas visuales y librerías de componentes.**
  - **CE 1.c:** Se han establecido los mecanismos de enlace entre los datos del modelo y la vista (*Data Binding bidireccional reactivo* mediante `ReactiveFormsModule` y *Signals* de Angular).
- **RA 3: Crea componentes visuales personalizados evaluando y gestionando eventos.**
  - **CE 3.d:** Se han gestionado eventos de autenticación y modificado la interfaz en función de los roles de usuario (*RBAC reactivo* adaptando la interfaz en tiempo real mediante directivas `@if`).
- **RA 4: Diseña interfaces usables y accesibles.**
  - **CE 4.a:** Se han aplicado principios de diseño responsivo y mobile-first (Uso intensivo de `ion-list`, `ion-item-sliding`, `ion-card`, `ion-toast` y feedback háptico/visual).

---

## 🏗️ Arquitectura Técnica y Seguridad RBAC

El proyecto implementa un sistema integral de **Control de Acceso Basado en Roles (RBAC)** en dos niveles de seguridad:

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENTE (FRONTEND)                     │
│  Ionic Standalone + Angular Signals + Control Flow (@if)     │
│                                                              │
│  • Rol 'admin': Formulario reactivo activo + Opciones CUD   │
│  • Rol 'user':  Formulario oculto + Lista solo lectura       │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS (REST / Auth)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      BACKEND (SUPABASE)                      │
│            PostgreSQL + Row Level Security (RLS)             │
│                                                              │
│  • SELECT en `clients`: Permitido a usuarios autenticados    │
│  • INSERT / UPDATE / DELETE en `clients`:                    │
│    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()     │
│            AND role = 'admin')                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Esquema SQL y Políticas de Seguridad (Supabase RLS)

```sql
-- 1. Crear tipo enumerado de roles
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- 2. Tabla de perfiles vinculada a auth.users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.user_role DEFAULT 'user' NOT NULL
);

-- 3. Tabla de clientes para gestión CRM
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  empresa TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Activación de Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
CREATE POLICY "Leer perfil propio" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Lectura para autenticados" ON public.clients
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Escritura solo para admins" ON public.clients
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```

---

## 💻 Ejecución en Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/danidaroca/dam-crm-app.git
cd dam-crm-app

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
ionic serve
# o bien
npm start
```

---

## 🚀 Despliegue en Vercel

El repositorio cuenta con `vercel.json` preconfigurado:
1. Enlazar el repositorio `danidaroca/dam-crm-app` en [vercel.com](https://vercel.com).
2. Carpeta de salida: `www`.
3. Comando de compilación: `npm run build`.
4. Soporte completo de rutas SPA con reescritura hacia `/index.html`.
