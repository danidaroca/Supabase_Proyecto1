import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { Client } from '../models/client.model';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonButton,
  IonInput, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonToast,
  IonBadge, IonNote, IonModal, IonButtons, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashOutline,
  shieldCheckmarkOutline,
  personOutline,
  businessOutline,
  mailOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  lockClosedOutline,
  logInOutline,
  logOutOutline,
  imagesOutline,
  keyOutline,
  closeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption,
    IonIcon, IonButton, IonInput, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonToast, IonBadge, IonNote, IonModal, IonButtons, IonSpinner
  ],
})
export class HomePage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  clients: Client[] = [];
  clientForm: FormGroup;
  editingClientId: string | null = null;
  toastMessage = '';
  isToastOpen = false;

  // Señales reactivas expuestas desde SupabaseService
  currentUser = this.supabaseService.currentUser;
  userRole = this.supabaseService.userRole;

  // Estado del Modal de Autenticación
  isLoginModalOpen = false;
  loginEmail = 'admin@test.com';
  loginPassword = '123456';
  isLoggingIn = false;
  pendingAction: { type: 'save' | 'edit' | 'delete'; data?: any } | null = null;

  constructor() {
    addIcons({
      createOutline,
      trashOutline,
      shieldCheckmarkOutline,
      personOutline,
      businessOutline,
      mailOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      lockClosedOutline,
      logInOutline,
      logOutOutline,
      imagesOutline,
      keyOutline,
      closeOutline
    });

    this.clientForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      empresa: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async ngOnInit() {
    await this.loadClients();
  }

  async loadClients() {
    try {
      this.clients = await this.supabaseService.getClients();
    } catch (e: any) {
      this.showToast('Error cargando clientes: ' + e.message);
    }
  }

  // --- REQUISITO 1: CONTROL DE LOGIN OBLIGATORIO PARA INSERTAR / EDITAR / ACTUALIZAR ---

  promptLogin(actionType: 'save' | 'edit' | 'delete', data?: any) {
    this.pendingAction = { type: actionType, data };
    this.isLoginModalOpen = true;
  }

  async handleLogin() {
    if (!this.loginEmail || !this.loginPassword) {
      this.showToast('Introduce email y contraseña.');
      return;
    }

    this.isLoggingIn = true;
    try {
      const res = await this.supabaseService.login(this.loginEmail, this.loginPassword);
      this.showToast(res.message);
      this.isLoginModalOpen = false;

      // Si había una acción pendiente, reanudarla si el rol lo autoriza
      if (this.pendingAction) {
        const action = this.pendingAction;
        this.pendingAction = null;
        if (action.type === 'save') {
          this.saveClient();
        } else if (action.type === 'edit') {
          this.editClient(action.data);
        } else if (action.type === 'delete') {
          this.deleteClient(action.data);
        }
      }
    } catch (e: any) {
      this.showToast('Error de autenticación: ' + e.message);
    } finally {
      this.isLoggingIn = false;
    }
  }

  async handleLogout() {
    await this.supabaseService.logout();
    this.resetForm();
    this.showToast('Sesión cerrada. La app solicitará login para operaciones CUD.');
  }

  quickFillUser(role: 'admin' | 'user') {
    if (role === 'admin') {
      this.loginEmail = 'admin@test.com';
      this.loginPassword = '123456';
    } else {
      this.loginEmail = 'user@test.com';
      this.loginPassword = '123456';
    }
  }

  closeLoginModal() {
    this.isLoginModalOpen = false;
    this.pendingAction = null;
  }

  // --- OPERACIONES CUD (INSERTAR, ACTUALIZAR, ELIMINAR) ---

  async saveClient() {
    // 1. Verificación obligatoria de sesión activa
    if (!this.currentUser()) {
      this.showToast('⚠️ Se requiere iniciar sesión con Supabase antes de guardar clientes.');
      this.promptLogin('save');
      return;
    }

    // 2. Verificación de permisos RLS en cliente
    if (this.userRole() !== 'admin') {
      this.showToast(`🛑 RLS Violation: Tu usuario (${this.currentUser()?.email}) tiene rol "user". Supabase RLS solo permite escribir al rol "admin".`);
      return;
    }

    // 3. Validación síncrona del formulario reactivo
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.clientForm.value;
      if (this.editingClientId) {
        await this.supabaseService.updateClient(this.editingClientId, formValue);
        this.showToast('Cliente actualizado con éxito en Supabase');
      } else {
        await this.supabaseService.createClient(formValue);
        this.showToast('Cliente insertado correctamente en Supabase');
      }
      this.resetForm();
      await this.loadClients();
    } catch (e: any) {
      this.showToast('Error RLS: ' + e.message);
    }
  }

  editClient(client: Client) {
    if (!this.currentUser()) {
      this.showToast('⚠️ Inicia sesión con un usuario admin para editar clientes.');
      this.promptLogin('edit', client);
      return;
    }

    if (this.userRole() !== 'admin') {
      this.showToast(`🛑 RLS Violation: No puedes editar registros con rol "${this.userRole()}".`);
      return;
    }

    this.editingClientId = client.id!;
    this.clientForm.patchValue({
      nombre: client.nombre,
      empresa: client.empresa,
      email: client.email
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showToast(`Editando cliente: ${client.nombre}`);
  }

  async deleteClient(id: string) {
    if (!this.currentUser()) {
      this.showToast('⚠️ Inicia sesión antes de eliminar registros.');
      this.promptLogin('delete', id);
      return;
    }

    if (this.userRole() !== 'admin') {
      this.showToast(`🛑 RLS Violation: Operación DELETE denegada para el rol "${this.userRole()}".`);
      return;
    }

    try {
      await this.supabaseService.deleteClient(id);
      this.showToast('Cliente eliminado del sistema');
      await this.loadClients();
    } catch (e: any) {
      this.showToast('Error eliminando: ' + e.message);
    }
  }

  resetForm() {
    this.clientForm.reset();
    this.editingClientId = null;
  }

  setToastOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  // --- REQUISITO 2: NAVEGACIÓN A LA PÁGINA DE STORAGE ---
  goToStorage() {
    this.router.navigate(['/storage']);
  }
}
