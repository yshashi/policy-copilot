import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, RefreshCw, FileText, Download, Trash2, CheckCircle, XCircle, Clock } from 'lucide-angular';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../models/document.model';

@Component({
  selector: 'app-document-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Documents</h2>
          <button 
            class="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            (click)="loadDocuments()" 
            [disabled]="isLoading()">
            <lucide-icon name="refresh-cw" class="w-3 h-3"></lucide-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4">
        @if (isLoading()) {
          <div class="flex flex-col items-center justify-center py-12 space-y-3">
            <div class="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p class="text-sm text-gray-600">Loading documents...</p>
          </div>
        } @else if (documents().length === 0) {
          <div class="flex flex-col items-center justify-center py-16 space-y-3 text-center">
            <lucide-icon name="file-text" class="w-12 h-12 text-gray-300"></lucide-icon>
            <h3 class="text-sm font-medium text-gray-900">No documents yet</h3>
            <p class="text-xs text-gray-500">Upload your first PDF document to get started</p>
          </div>
        } @else {
          <div class="space-y-3">
            @for (doc of documents(); track doc.id) {
              <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                   [class.ring-1]="doc.processingStatus === 'Processing'"
                   [class.ring-blue-200]="doc.processingStatus === 'Processing'">
                
                <!-- Document Header -->
                <div class="flex items-start gap-3 mb-3">
                  <div class="p-1.5 bg-gray-100 rounded-md flex-shrink-0">
                    <lucide-icon name="file-text" class="w-4 h-4 text-gray-600"></lucide-icon>
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="text-sm font-medium text-gray-900 truncate" [title]="doc.fileName">{{ doc.fileName }}</h4>
                    <p class="text-xs text-gray-500">{{ formatDate(doc.uploadedAt) }}</p>
                  </div>
                  <div class="flex items-center gap-1">
                    <button 
                      class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      (click)="downloadDocument(doc)" 
                      title="Download">
                      <lucide-icon name="download" class="w-3 h-3"></lucide-icon>
                    </button>
                    <button 
                      class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      (click)="deleteDocument(doc)" 
                      title="Delete">
                      <lucide-icon name="trash-2" class="w-3 h-3"></lucide-icon>
                    </button>
                  </div>
                </div>
                
                <!-- Status -->
                <div class="mb-3">
                  @switch (doc.processingStatus) {
                    @case ('Processing') {
                      <div class="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        <div class="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                        <span class="font-medium">Processing...</span>
                      </div>
                    }
                    @case ('Completed') {
                      <div class="flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                        <lucide-icon name="check-circle" class="w-3 h-3"></lucide-icon>
                        <span class="font-medium">Ready</span>
                      </div>
                    }
                    @case ('Failed') {
                      <div class="flex items-center gap-2 px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
                        <lucide-icon name="x-circle" class="w-3 h-3"></lucide-icon>
                        <span class="font-medium">Failed</span>
                      </div>
                    }
                    @default {
                      <div class="flex items-center gap-2 px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">
                        <lucide-icon name="clock" class="w-3 h-3"></lucide-icon>
                        <span class="font-medium">Pending</span>
                      </div>
                    }
                  }
                </div>

                <!-- File Info -->
                @if (doc.processingStatus === 'Completed') {
                  <div class="text-xs text-gray-500">
                    <span>Size: {{ formatFileSize(doc.size) }}</span>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, LucideAngularModule]
})
export class DocumentListComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  
  documents = signal<Document[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading.set(true);
    this.documentService.getDocuments().subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.isLoading.set(false);
      }
    });
  }

  downloadDocument(doc: Document): void {
    // Implementation for document download
    console.log('Download document:', doc.fileName);
  }

  deleteDocument(doc: Document): void {
    if (confirm(`Are you sure you want to delete ${doc.fileName}?`)) {
      // TODO: Implement delete functionality when backend API is available
      console.log('Delete document:', doc.fileName);
      // For now, just remove from local state
      this.documents.update(docs => docs.filter(d => d.id !== doc.id));
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
