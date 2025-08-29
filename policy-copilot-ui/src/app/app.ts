import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentUploadComponent } from './components/document-upload/document-upload.component';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { ChatComponent } from './components/chat/chat.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Policy & Document Copilot</h1>
            <p class="text-gray-600">AI-powered document analysis with natural language queries</p>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Upload Section -->
        <div class="mb-8">
          <app-document-upload (documentUploaded)="onDocumentUploaded()"></app-document-upload>
        </div>

        <!-- Content Layout -->
        <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <!-- Documents Panel -->
          <div class="xl:col-span-1">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 h-[700px] overflow-hidden">
              <app-document-list #documentList></app-document-list>
            </div>
          </div>

          <!-- Chat Panel -->
          <div class="xl:col-span-3">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 h-[700px] overflow-hidden">
              <app-chat></app-chat>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, DocumentUploadComponent, DocumentListComponent, ChatComponent]
})
export class App {
  onDocumentUploaded(): void {
    // Refresh document list when a new document is uploaded
    const documentList = document.querySelector('app-document-list') as any;
    if (documentList?.loadDocuments) {
      documentList.loadDocuments();
    }
  }
}
