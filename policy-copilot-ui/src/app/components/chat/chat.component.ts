import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DocumentService } from '../../services/document.service';
import { QueryResponse } from '../../models/document.model';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: any[];
}

@Component({
  selector: 'app-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 bg-gray-50">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Ask Questions</h2>
        <p class="text-sm text-gray-600">Query your uploaded documents using natural language</p>
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" #messagesContainer>
        @for (message of messages(); track $index) {
          <div class="flex" [class.justify-end]="message.type === 'user'">
            @if (message.type === 'user') {
              <div class="max-w-xs sm:max-w-md">
                <div class="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2.5">
                  <div class="text-sm">{{ message.content }}</div>
                </div>
                <div class="text-xs text-gray-500 mt-1 text-right">{{ formatTime(message.timestamp) }}</div>
              </div>
            } @else {
              <div class="max-w-2xl">
                <div class="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div class="text-sm text-gray-800 leading-relaxed" [innerHTML]="formatAssistantMessage(message.content)"></div>
                  @if (message.sources && message.sources.length > 0) {
                    <div class="mt-3 pt-3 border-t border-gray-100">
                      <h4 class="text-xs font-medium text-gray-700 mb-2">Sources:</h4>
                      <div class="space-y-2">
                        @for (source of message.sources; track $index) {
                          <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div class="flex items-center justify-between mb-2">
                              <span class="text-xs font-medium text-gray-800">{{ source.fileName }}</span>
                              <span class="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{{ (source.similarity * 100).toFixed(1) }}% match</span>
                            </div>
                            <div class="text-xs text-gray-600 leading-relaxed">{{ source.content }}</div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
                <div class="text-xs text-gray-500 mt-1">{{ formatTime(message.timestamp) }}</div>
              </div>
            }
          </div>
        }

        @if (isLoading()) {
          <div class="flex">
            <div class="max-w-2xl">
              <div class="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  </div>
                  <span class="text-sm text-gray-600">Assistant is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Input -->
      <div class="p-4 border-t border-gray-200 bg-white">
        <div class="flex gap-3">
          <textarea
            #messageInput
            [(ngModel)]="currentMessage"
            (keydown.enter)="onEnterPress($any($event))"
            placeholder="Ask a question about your documents..."
            rows="1"
            [disabled]="isLoading()"
            class="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"></textarea>
          <button
            (click)="sendMessage()"
            [disabled]="!currentMessage.trim() || isLoading()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            @if (isLoading()) {
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            } @else {
              <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
            }
          </button>
        </div>
        @if (documents().length === 0) {
          <p class="text-xs text-gray-500 mt-2 text-center">Upload documents first to start asking questions</p>
        }
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule]
})
export class ChatComponent {
  private readonly documentService = inject(DocumentService);

  messages = signal<ChatMessage[]>([]);
  currentMessage = '';
  isLoading = signal(false);
  documents = signal<any[]>([]);

  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isLoading()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: this.currentMessage.trim(),
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMessage]);
    const question = this.currentMessage.trim();
    this.currentMessage = '';
    this.isLoading.set(true);

    this.documentService.processQuery({ question, maxResults: 5 }).subscribe({
      next: (response: QueryResponse) => {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources
        };

        this.messages.update(msgs => [...msgs, assistantMessage]);
        this.isLoading.set(false);
      },
      error: (error) => {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: 'Sorry, I encountered an error processing your question. Please try again.',
          timestamp: new Date()
        };

        this.messages.update(msgs => [...msgs, errorMessage]);
        this.isLoading.set(false);
        console.error('Query error:', error);
      }
    });
  }

  onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatAssistantMessage(content: string): string {
    // Simple formatting - convert line breaks to <br> tags
    return content.replace(/\n/g, '<br>');
  }
}
