# Policy & Document Copilot

A production-grade RAG (Retrieval-Augmented Generation) system built with .NET 8 and Angular 18, powered by Google's Gemini Pro AI model.

## Features

- **Document Upload**: Upload PDF documents with drag-and-drop interface
- **AI-Powered Q&A**: Ask natural language questions about your documents
- **Source Citations**: Get answers with relevant document excerpts and similarity scores
- **Real-time Processing**: Automatic document chunking and embedding generation
- **Modern UI**: Beautiful, responsive Angular interface with signals and standalone components

## Architecture

### Backend (.NET 8 Web API)
- **Entity Framework Core** with SQLite for data persistence
- **PDF Processing** using PdfPig for text extraction
- **Vector Embeddings** via Google Gemini API
- **RAG Pipeline** with semantic search and context-aware responses

### Frontend (Angular 18)
- **Standalone Components** following latest Angular best practices
- **Signals** for reactive state management
- **Modern UI** with CSS Grid and Flexbox
- **TypeScript** with strict type checking

## Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js 18+ and npm
- Google Gemini API key

### Backend Setup

1. Navigate to the API project:
```bash
cd PolicyCopilot.Api
```

2. Add your Gemini API key to `appsettings.json`:
```json
{
  "GeminiApiKey": "your-actual-api-key-here"
}
```

3. Restore packages and run:
```bash
dotnet restore
dotnet run
```

The API will be available at `https://localhost:7000`

### Frontend Setup

1. Navigate to the UI project:
```bash
cd policy-copilot-ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
ng serve
```

The application will be available at `http://localhost:4200`

## Usage

1. **Upload Documents**: Drag and drop PDF files or click to browse
2. **Wait for Processing**: Documents are automatically chunked and embedded
3. **Ask Questions**: Use natural language to query your documents
4. **Review Answers**: Get AI responses with source citations and similarity scores

## API Endpoints

- `POST /api/documents/upload` - Upload a PDF document
- `GET /api/documents` - List all uploaded documents
- `POST /api/query` - Process a natural language query

## Technology Stack

- **.NET 8** - Backend API framework
- **Entity Framework Core** - ORM and database access
- **SQLite** - Lightweight database
- **Angular 18** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **Google Gemini Pro** - AI model for embeddings and text generation
- **PdfPig** - PDF text extraction

## Security Notes

- Store your Gemini API key securely (use environment variables in production)
- Implement proper authentication and authorization for production use
- Consider file upload limits and validation
- Use HTTPS in production environments
