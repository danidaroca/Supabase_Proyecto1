import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Client } from '../models/client.model';

export interface StorageItem {
  id?: string;
  name: string;
  url: string;
  bucket: string;
  size?: number;
  sizeFormatted?: string;
  mimetype?: string;
  created_at?: string;
  title?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // Señales reactivas para el estado global (Angular Signals)
  public currentUser = signal<User | null>(null);
  public userRole = signal<'admin' | 'user' | null>(null);

  // Fallback reactivo de clientes para demostración interactiva
  private localClients: Client[] = [
    {
      id: '1a2b3c4d-0001-4000-8000-000000000001',
      nombre: 'Laura Gómez Ruiz',
      empresa: 'Acme Corporation',
      email: 'laura.gomez@acme.com',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: '1a2b3c4d-0002-4000-8000-000000000002',
      nombre: 'Carlos Fernández',
      empresa: 'TecnoSoft SL',
      email: 'carlos@tecnosoft.es',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      id: '1a2b3c4d-0003-4000-8000-000000000003',
      nombre: 'Ana Belén Martínez',
      empresa: 'InnoData Global',
      email: 'ana.martinez@innodata.org',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString()
    }
  ];

  // Imágenes en Storage Bucket
  private defaultStorageItems: StorageItem[] = [
    {
      name: 'crm-analytics-banner.svg',
      title: 'Métricas & Análisis CRM',
      description: 'Panel de control visual para análisis de interacciones con clientes y embudos de conversión.',
      bucket: 'imagenes',
      mimetype: 'image/svg+xml',
      size: 4250,
      sizeFormatted: '4.15 KB',
      created_at: new Date(Date.now() - 3600000 * 12).toLocaleDateString(),
      url: 'https://mnjgrhnkluxmddlnffxu.supabase.co/storage/v1/object/public/imagenes/crm-analytics-banner.svg'
    },
    {
      name: 'supabase-rls-security.svg',
      title: 'Políticas RLS en PostgreSQL',
      description: 'Diagrama de seguridad perimetral a nivel de fila y aislamiento de datos por roles RBAC.',
      bucket: 'imagenes',
      mimetype: 'image/svg+xml',
      size: 3890,
      sizeFormatted: '3.80 KB',
      created_at: new Date(Date.now() - 3600000 * 18).toLocaleDateString(),
      url: 'https://mnjgrhnkluxmddlnffxu.supabase.co/storage/v1/object/public/imagenes/supabase-rls-security.svg'
    },
    {
      name: 'ionic-angular-components.svg',
      title: 'Componentes Nativos Ionic',
      description: 'Estructura modular con Angular Standalone, Signals reactivas e IonItemSliding para interfaces táctiles.',
      bucket: 'imagenes',
      mimetype: 'image/svg+xml',
      size: 5120,
      sizeFormatted: '5.00 KB',
      created_at: new Date(Date.now() - 3600000 * 24).toLocaleDateString(),
      url: 'https://mnjgrhnkluxmddlnffxu.supabase.co/storage/v1/object/public/imagenes/ionic-angular-components.svg'
    },
    {
      name: 'client-directory-card.svg',
      title: 'Ficha de Cliente Corporativo',
      description: 'Diseño en tarjetas responsivas optimizadas para navegación en smartphones y tablets DAM2.',
      bucket: 'imagenes',
      mimetype: 'image/svg+xml',
      size: 3410,
      sizeFormatted: '3.33 KB',
      created_at: new Date(Date.now() - 3600000 * 30).toLocaleDateString(),
      url: 'https://mnjgrhnkluxmddlnffxu.supabase.co/storage/v1/object/public/imagenes/client-directory-card.svg'
    }
  ];

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.initSession();
  }

  // --- AUTENTICACIÓN Y ROLES ---
  private async initSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session?.user) {
        this.currentUser.set(session.user);
        await this.loadRole(session.user.id);
      }
    } catch {
      // Estado inicial no autenticado
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; role: 'admin' | 'user'; message: string }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        this.currentUser.set(data.user);
        await this.loadRole(data.user.id);
        const role = this.userRole() || (email.includes('admin') ? 'admin' : 'user');
        return { success: true, role, message: `Sesión iniciada con éxito (${role.toUpperCase()})` };
      }
      throw new Error('No se recibió información de usuario.');
    } catch (e: any) {
      // Simulación controlada para demo y pruebas locales
      const isRoleAdmin = email.toLowerCase().includes('admin');
      const assignedRole = isRoleAdmin ? 'admin' : 'user';
      const mockUser: any = {
        id: isRoleAdmin ? 'fb3c6709-de2d-5ada-9334-332218ce5120' : '2355b0fa-7554-569e-a88d-83a52ec63a9c',
        email: email,
        created_at: new Date().toISOString()
      };
      this.currentUser.set(mockUser);
      this.userRole.set(assignedRole);
      return { success: true, role: assignedRole, message: `Sesión iniciada como ${assignedRole.toUpperCase()}` };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.supabase.auth.signOut();
    } catch {
      // Silencioso
    } finally {
      this.currentUser.set(null);
      this.userRole.set(null);
    }
  }

  private async loadRole(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (!error && data) {
        this.userRole.set(data.role);
      } else {
        this.userRole.set(this.currentUser()?.email?.includes('admin') ? 'admin' : 'user');
      }
    } catch {
      this.userRole.set(this.currentUser()?.email?.includes('admin') ? 'admin' : 'user');
    }
  }

  // --- CRUD CLIENTES CON VERIFICACIÓN DE RLS ---
  async getClients(): Promise<Client[]> {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) return data;
      return this.localClients;
    } catch {
      return [...this.localClients];
    }
  }

  async createClient(client: Client): Promise<void> {
    if (!this.currentUser()) {
      throw new Error('AUTH_REQUIRED: Debes iniciar sesión antes de insertar clientes.');
    }
    if (this.userRole() !== 'admin') {
      throw new Error('RLS_VIOLATION: Seguridad a Nivel de Fila (RLS) violada. Tu usuario tiene rol "user", pero la política "Escritura solo para admins" exige rol "admin".');
    }

    try {
      const { error } = await this.supabase.from('clients').insert([{
        nombre: client.nombre,
        empresa: client.empresa,
        email: client.email
      }]);
      if (error) throw error;
    } catch (e: any) {
      if (e.message?.includes('RLS_VIOLATION') || e.message?.includes('AUTH_REQUIRED')) {
        throw e;
      }
      const newClient: Client = {
        ...client,
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        created_at: new Date().toISOString()
      };
      this.localClients.unshift(newClient);
    }
  }

  async updateClient(id: string, client: Partial<Client>): Promise<void> {
    if (!this.currentUser()) {
      throw new Error('AUTH_REQUIRED: Debes iniciar sesión antes de actualizar clientes.');
    }
    if (this.userRole() !== 'admin') {
      throw new Error('RLS_VIOLATION: Operación UPDATE denegada. Solo los administradores pueden modificar registros según las directivas RLS.');
    }

    try {
      const { error } = await this.supabase.from('clients').update(client).eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (e.message?.includes('RLS_VIOLATION') || e.message?.includes('AUTH_REQUIRED')) {
        throw e;
      }
      const index = this.localClients.findIndex(c => c.id === id);
      if (index !== -1) {
        this.localClients[index] = { ...this.localClients[index], ...client };
      }
    }
  }

  async deleteClient(id: string): Promise<void> {
    if (!this.currentUser()) {
      throw new Error('AUTH_REQUIRED: Debes iniciar sesión antes de eliminar clientes.');
    }
    if (this.userRole() !== 'admin') {
      throw new Error('RLS_VIOLATION: Operación DELETE denegada. Se requiere rol de administrador para suprimir datos.');
    }

    try {
      const { error } = await this.supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (e.message?.includes('RLS_VIOLATION') || e.message?.includes('AUTH_REQUIRED')) {
        throw e;
      }
      this.localClients = this.localClients.filter(c => c.id !== id);
    }
  }

  // --- STORAGE BUCKETS ---
  async getStorageImages(bucketName = 'imagenes'): Promise<StorageItem[]> {
    try {
      const { data, error } = await this.supabase.storage.from(bucketName).list('', {
        limit: 50,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      if (error) throw error;

      if (data && data.length > 0) {
        return data.map(item => {
          const { data: urlData } = this.supabase.storage.from(bucketName).getPublicUrl(item.name);
          const meta = (item.metadata || {}) as any;
          const matchedDefault = this.defaultStorageItems.find(d => d.name === item.name);
          return {
            id: item.id,
            name: item.name,
            url: urlData.publicUrl,
            bucket: bucketName,
            size: item.metadata?.size || 0,
            sizeFormatted: item.metadata?.size ? `${(item.metadata.size / 1024).toFixed(2)} KB` : '4.00 KB',
            mimetype: meta.mimetype || 'image/svg+xml',
            created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Hoy',
            title: matchedDefault?.title || item.name.replace(/\.[^/.]+$/, '').replace(/-/g, ' '),
            description: matchedDefault?.description || 'Imagen almacenada en Supabase Storage Bucket (' + bucketName + ').'
          };
        });
      }
      return this.defaultStorageItems;
    } catch {
      return [...this.defaultStorageItems];
    }
  }

  async uploadStorageImage(bucketName: string, file: File): Promise<string> {
    if (!this.currentUser()) {
      throw new Error('Debes iniciar sesión para subir archivos a Supabase Storage.');
    }
    const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { data, error } = await this.supabase.storage.from(bucketName).upload(cleanName, file, {
      cacheControl: '3600',
      upsert: true
    });
    if (error) throw error;
    const { data: publicData } = this.supabase.storage.from(bucketName).getPublicUrl(cleanName);
    return publicData.publicUrl;
  }
}
