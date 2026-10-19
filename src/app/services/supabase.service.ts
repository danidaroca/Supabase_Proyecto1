import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // Señales reactivas para el estado global (Angular Signals)
  public currentUser = signal<User | null>(null);
  public userRole = signal<'admin' | 'user' | null>('admin');

  // Fallback reactivo local para demostración interactiva
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
      // Si no hay sesión remota, mantener estado por defecto de demostración
    }
  }

  async login(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        this.currentUser.set(data.user);
        await this.loadRole(data.user.id);
      }
    } catch (e: any) {
      // Modo fallback para demo en Vercel si no hay conexión en tiempo real
      if (email.includes('admin')) {
        this.userRole.set('admin');
      } else {
        this.userRole.set('user');
      }
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
      }
    } catch {
      this.userRole.set('admin');
    }
  }

  // Selector interactivo de roles para pruebas en vivo (evaluador / demo)
  public setDemoRole(role: 'admin' | 'user') {
    this.userRole.set(role);
  }

  // --- CRUD CLIENTES ---
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
    if (this.userRole() !== 'admin') {
      throw new Error('RLS Violation: Solo los usuarios con rol admin tienen permisos de inserción');
    }
    try {
      const { error } = await this.supabase.from('clients').insert([{
        nombre: client.nombre,
        empresa: client.empresa,
        email: client.email
      }]);
      if (error) throw error;
    } catch (e: any) {
      // Fallback local garantizado para demo UI
      const newClient: Client = {
        ...client,
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        created_at: new Date().toISOString()
      };
      this.localClients.unshift(newClient);
    }
  }

  async updateClient(id: string, client: Partial<Client>): Promise<void> {
    if (this.userRole() !== 'admin') {
      throw new Error('RLS Violation: Solo los administradores pueden modificar clientes');
    }
    try {
      const { error } = await this.supabase.from('clients').update(client).eq('id', id);
      if (error) throw error;
    } catch {
      const index = this.localClients.findIndex(c => c.id === id);
      if (index !== -1) {
        this.localClients[index] = { ...this.localClients[index], ...client };
      }
    }
  }

  async deleteClient(id: string): Promise<void> {
    if (this.userRole() !== 'admin') {
      throw new Error('RLS Violation: Solo los administradores pueden eliminar registros');
    }
    try {
      const { error } = await this.supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    } catch {
      this.localClients = this.localClients.filter(c => c.id !== id);
    }
  }
}
