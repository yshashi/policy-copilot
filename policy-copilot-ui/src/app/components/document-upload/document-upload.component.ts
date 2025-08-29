import { Component, signal, inject, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-document-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50"
           [class.border-blue-500]="isDragOver()"
           [class.bg-blue-50]="isDragOver()"
           (drop)="onDrop($event)"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (click)="fileInput.click()">
        <div class="flex flex-col items-center gap-3">
          @if (isUploading()) {
            <div class="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p class="text-gray-700 font-medium">Uploading document...</p>
            <p class="text-sm text-gray-500">Please wait while we process your file</p>
          } @else {
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <lucide-icon name="file-text" class="w-6 h-6 text-blue-600"></lucide-icon>
            </div>
            <div class="space-y-1">
              <p class="text-gray-700 font-medium">Drop PDF files here or click to browse</p>
              <p class="text-sm text-gray-500">Supports PDF documents up to 10MB</p>
            </div>
          }
        </div>
      </div>
      <input #fileInput type="file" accept=".pdf" (change)="onFileSelected($event)" hidden>
      
      @if (uploadError()) {
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          <div class="flex items-center gap-2">
            <lucide-icon name="x" class="w-4 h-4 flex-shrink-0"></lucide-icon>
            {{ uploadError() }}
          </div>
        </div>
      }
    </div>
  `,
  standalone: true,
  imports: [CommonModule, LucideAngularModule]
})
export class DocumentUploadComponent {
  private readonly documentService = inject(DocumentService);
  
  isDragOver = signal(false);
  isUploading = signal(false);
  uploadError = signal<string | null>(null);
  
  documentUploaded = output<void>();

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
  }

  private uploadFile(file: File): void {
    if (!file.type.includes('pdf')) {
      this.uploadError.set('Please select a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.uploadError.set('File size must be less than 10MB');
      return;
    }

    this.uploadError.set(null);
    this.isUploading.set(true);

    this.documentService.uploadDocument(file).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.documentUploaded.emit();
      },
      error: (error) => {
        this.isUploading.set(false);
        this.uploadError.set('Failed to upload document. Please try again.');
        console.error('Upload error:', error);
      }
    });
  }
}
