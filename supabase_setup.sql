-- ==============================================================================
-- LABORATORIO: Gestión Completa CRUD con Roles (Ionic Standalone + Supabase)
-- Módulo: Desarrollo de Interfaces (0488) - DAM2
-- Alumno: Daniel Daroca
-- ==============================================================================

-- 1. Crear enumeración de roles
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- 2. Crear tabla de perfiles (vinculada a autenticación)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.user_role DEFAULT 'user' NOT NULL
);

-- 3. Crear tabla de clientes
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  empresa TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para Perfiles (Lectura propia)
CREATE POLICY "Leer perfil propio" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- 6. Políticas para Clientes (RBAC)
-- Lectura: Todos los usuarios autenticados
CREATE POLICY "Lectura para autenticados" ON public.clients
FOR SELECT TO authenticated USING (true);

-- Escritura (Insert, Update, Delete): SOLO Administradores
CREATE POLICY "Escritura solo para admins" ON public.clients
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. Configuración de Storage Bucket ('imagenes')
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('imagenes', 'imagenes', true, 5242880, '{image/png,image/jpeg,image/webp,image/svg+xml}')
ON CONFLICT (id) DO UPDATE SET public = true;

-- 8. Políticas RLS para Storage Bucket
CREATE POLICY "Lectura publica imagenes" ON storage.objects
FOR SELECT USING (bucket_id = 'imagenes');

CREATE POLICY "Subida para autenticados imagenes" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'imagenes');
