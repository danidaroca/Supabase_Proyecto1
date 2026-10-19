import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService, StorageItem } from '../services/supabase.service';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonBadge, IonToast, IonSpinner, IonButtons,
  IonNote, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  imagesOutline,
  refreshOutline,
  cloudUploadOutline,
  openOutline,
  copyOutline,
  peopleOutline,
  shieldCheckmarkOutline,
  arrowBackOutline,
  sparklesOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-storage',
  templateUrl: './storage.page.html',
  styleUrls: ['./storage.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonGrid, IonRow, IonCol, IonBadge, IonToast, IonSpinner, IonButtons,
    IonNote, IonLabel
  ]
})
export class StoragePage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  bucketName = 'imagenes';
  storageItems: StorageItem[] = [];
  isLoading = true;
  toastMessage = '';
  isToastOpen = false;

  currentUser = this.supabaseService.currentUser;
  userRole = this.supabaseService.userRole;

  constructor() {
    addIcons({
      imagesOutline,
      refreshOutline,
      cloudUploadOutline,
      openOutline,
      copyOutline,
      peopleOutline,
      shieldCheckmarkOutline,
      arrowBackOutline,
      sparklesOutline
    });
  }

  async ngOnInit() {
    await this.loadImages();
  }

  async loadImages() {
    this.isLoading = true;
    try {
      this.storageItems = await this.supabaseService.getStorageImages(this.bucketName);
    } catch (e: any) {
      this.showToast('Error cargando imágenes de Storage: ' + e.message);
    } finally {
      this.isLoading = false;
    }
  }

  goToCrud() {
    this.router.navigate(['/home']);
  }

  copyUrl(url: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      this.showToast('¡Enlace público copiado al portapapeles!');
    } else {
      this.showToast('URL: ' + url);
    }
  }

  openUrl(url: string) {
    window.open(url, '_blank');
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  setToastOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }
}
