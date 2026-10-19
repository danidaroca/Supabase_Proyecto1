import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { Client } from '../models/client.model';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonButton,
  IonInput, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonToast,
  IonBadge, IonSegment, IonSegmentButton, IonNote
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
  alertCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption,
    IonIcon, IonButton, IonInput, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonToast, IonBadge, IonSegment, IonSegmentButton, IonNote
  ],
})
export class HomePage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);

  clients: Client[] = [];
  clientForm: FormGroup;
  editingClientId: string | null = null;
  toastMessage = '';
  isToastOpen = false;

  // Señales expuestas a la vista (Angular Signals)
  isAdmin = this.supabaseService.userRole;

  constructor() {
    addIcons({
      createOutline,
      trashOutline,
      shieldCheckmarkOutline,
      personOutline,
      businessOutline,
      mailOutline,
      checkmarkCircleOutline,
      alertCircleOutline
    });

    this.clientForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      empresa: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async ngOnInit() {
    // En un entorno real, hacer login antes de cargar
    // Para simplificar esta demo, asumimos que el servicio ya está logueado
    // await this.supabaseService.login('admin@test.com', '123456');
    await this.loadClients();
  }

  async loadClients() {
    try {
      this.clients = await this.supabaseService.getClients();
    } catch (e: any) {
      this.showToast('Error cargando clientes: ' + e.message);
    }
  }

  async saveClient() {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.clientForm.value;
      if (this.editingClientId) {
        await this.supabaseService.updateClient(this.editingClientId, formValue);
        this.showToast('Cliente actualizado con éxito');
      } else {
        await this.supabaseService.createClient(formValue);
        this.showToast('Cliente insertado correctamente');
      }
      this.resetForm();
      await this.loadClients();
    } catch (e: any) {
      this.showToast('Error de guardado (¿Eres admin?): ' + e.message);
    }
  }

  editClient(client: Client) {
    this.editingClientId = client.id!;
    this.clientForm.patchValue({
      nombre: client.nombre,
      empresa: client.empresa,
      email: client.email
    });
    // Scroll arriba para edición
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteClient(id: string) {
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

  // Cambio dinámico de rol para verificación de RBAC en tiempo real (CE 3.d)
  onRoleChange(event: any) {
    const selectedRole = event.detail.value as 'admin' | 'user';
    this.supabaseService.setDemoRole(selectedRole);
    if (selectedRole === 'user') {
      this.resetForm();
    }
    this.showToast(`Modo cambiado a: ${selectedRole === 'admin' ? 'Administrador (CRUD Total)' : 'Usuario (Solo Lectura)'}`);
  }
}
