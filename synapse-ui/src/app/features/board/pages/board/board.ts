import { ChangeDetectorRef, Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BoardResponseDto } from '../../../../services/models/board-response-dto';
import { NoteResponseDto } from '../../../../services/models/note-response-dto';
import { LinkResponse } from '../../../../services/models/link-response';
import { HttpClient } from '@angular/common/http';
import { getById } from '../../../../services/fn/board-controller/get-by-id';
import { getNotes } from '../../../../services/fn/note-controller/get-notes';
import { create1 } from '../../../../services/fn/note-controller/create-1';
import { delete1 } from '../../../../services/fn/note-controller/delete-1';
import { patch1 } from '../../../../services/fn/note-controller/patch-1';
import { getBoardLinks } from '../../../../services/fn/link-controller/get-board-links';
import { deleteLink } from '../../../../services/fn/link-controller/delete-link';
import { createLink } from '../../../../services/fn/link-controller/create-link';
import { NoteRequestDto } from '../../../../services/models/note-request-dto';
import { CreateLinkRequest } from '../../../../services/models/create-link-request';
import { CommonModule } from '@angular/common';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { uploadImage } from '../../../../services/fn/note-controller/upload-image';
import { FormsModule } from '@angular/forms';

const API_URL = 'http://localhost:8080';

// Extended note type with UI properties
interface NoteWithUI extends NoteResponseDto {
  rotation?: number;
  zIndex?: number;
  noteType?: 'sticky' | 'photo' | 'document' | 'clipping';
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './board.html',
  styleUrls: ['./board.scss'],
})
export class BoardPage implements OnInit, AfterViewInit {
  @ViewChild('boardContainer') boardContainer!: ElementRef;

  boardId!: string;
  board?: BoardResponseDto;

  // Card types and colors
  NOTE_TYPES = [
    { value: 'sticky', label: 'Sticky Note' },
    { value: 'photo', label: 'Photo' },
    { value: 'document', label: 'Document' },
    { value: 'clipping', label: 'Clipping' }
  ];

  STICKY_COLORS = [
    { value: 'yellow', label: 'Yellow', class: 'sticky-yellow' },
    { value: 'pink', label: 'Pink', class: 'sticky-pink' },
    { value: 'blue', label: 'Blue', class: 'sticky-blue' },
    { value: 'green', label: 'Green', class: 'sticky-green' }
  ];

  newNoteType: 'sticky' | 'photo' | 'document' | 'clipping' = 'sticky';
  newNoteColor = 'yellow';

  notes: NoteWithUI[] = [];
  links: LinkResponse[] = [];

  loadingBoard = false;
  loadingNotes = false;
  loadingLinks = false;
  errorBoard?: string;
  errorNotes?: string;
  errorLinks?: string;

  // Links logic
  linkMode = false;
  linkFromNoteId: string | null = null;

  // Board interaction
  isPanning = false;
  panOffset = { x: 0, y: 0 };
  lastPanPoint = { x: 0, y: 0 };

  // Z-index management
  maxZIndex = 10;

  // Selected note for editing
  selectedNoteId: string | null = null;
  editingNoteId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorBoard = 'No board ID provided';
      return;
    }
    this.boardId = id;
    this.loadBoard();
  }

  ngAfterViewInit(): void {
    // Set up keyboard listeners for panning
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.linkMode = false;
        this.linkFromNoteId = null;
        this.selectedNoteId = null;
        this.editingNoteId = null;
        this.cd.detectChanges();
      }
    });
  }

  /* =========================
     LOAD BOARD, NOTES, LINKS
  ========================= */

  private loadBoard(): void {
    this.loadingBoard = true;
    getById(this.http, API_URL, { id: this.boardId }).subscribe({
      next: res => {
        this.board = res.body!;
        this.loadNotes();
        this.loadLinks();
      },
      error: err => {
        console.error('Error loading board:', err);
        this.errorBoard = 'Unable to load board';
      },
      complete: () => (this.loadingBoard = false),
    });
  }

  private loadNotes(): void {
    this.loadingNotes = true;
    getNotes(this.http, API_URL, { boardId: this.boardId }).subscribe({
      next: res => {
        this.notes = (res.body ?? []).map(note => ({
          ...note,
          rotation: this.getRandomRotation(),
          zIndex: 10,
          noteType: (note as any).noteType || 'sticky'
        }));
        this.cd.detectChanges();
      },
      error: err => {
        console.error('Error loading notes:', err);
        this.errorNotes = 'Unable to load notes';
        this.cd.detectChanges();
      },
      complete: () => (this.loadingNotes = false),
    });
  }

  private loadLinks(): void {
    this.loadingLinks = true;
    getBoardLinks(this.http, API_URL, { boardId: this.boardId }).subscribe({
      next: res => {
        this.links = res.body ?? [];
        this.cd.detectChanges();
      },
      error: err => {
        console.error('Error loading links:', err);
        this.errorLinks = 'Unable to load links';
        this.cd.detectChanges();
      },
      complete: () => (this.loadingLinks = false),
    });
  }

  /* =========================
     RANDOM ROTATION
  ========================= */

  getRandomRotation(): number {
    return (Math.random() - 0.5) * 8; // -4 to +4 degrees
  }

  /* =========================
     NOTES CRUD
  ========================= */

  createNote(): void {
    const payload: NoteRequestDto = {
      color: this.newNoteColor,
      content: '',
      positionX: 100 + Math.random() * 200,
      positionY: 100 + Math.random() * 200,
    };

    // Add noteType to payload if your API supports it
    (payload as any).noteType = this.newNoteType;

    create1(this.http, API_URL, { boardId: this.boardId, body: payload }).subscribe({
      next: res => {
        if (res.body) {
          const newNote: NoteWithUI = {
            ...res.body,
            rotation: this.getRandomRotation(),
            zIndex: ++this.maxZIndex,
            noteType: this.newNoteType
          };
          this.notes.push(newNote);
        }
        this.cd.detectChanges();
      },
      error: err => console.error('Error creating note:', err),
    });
  }

  updateNote(note: NoteWithUI): void {
    if (!note.id) return;

    const payload: NoteRequestDto = {
      content: note.content,
      positionX: note.positionX,
      positionY: note.positionY,
      color: note.color,
    };
    (payload as any).noteType = note.noteType;

    patch1(this.http, API_URL, { boardId: this.boardId, noteId: note.id, body: payload }).subscribe({
      next: res => {
        if (res.body) this.replaceNote(res.body);
        this.cd.detectChanges();
      },
      error: err => console.error('Error updating note:', err),
    });
  }

  deleteNote(noteId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    delete1(this.http, API_URL, { boardId: this.boardId, noteId }).subscribe({
      next: () => {
        this.notes = this.notes.filter(n => n.id !== noteId);
        // Also remove any links connected to this note
        this.links = this.links.filter(l => l.fromNoteId !== noteId && l.toNoteId !== noteId);
        this.selectedNoteId = null;
        this.cd.detectChanges();
      },
      error: err => console.error('Error deleting note:', err),
    });
  }

  private replaceNote(updated: NoteResponseDto) {
    const index = this.notes.findIndex(n => n.id === updated.id);
    if (index !== -1) {
      this.notes[index] = {
        ...updated,
        rotation: this.notes[index].rotation,
        zIndex: this.notes[index].zIndex,
        noteType: this.notes[index].noteType
      };
    }
  }

  /* =========================
     NOTE SELECTION & EDITING
  ========================= */

  selectNote(note: NoteWithUI, event: Event): void {
    event.stopPropagation();

    if (this.linkMode) {
      this.noteClickedForLink(note.id!);
      return;
    }

    this.selectedNoteId = note.id!;
    // Bring to front
    note.zIndex = ++this.maxZIndex;
    this.cd.detectChanges();
  }

  startEditing(note: NoteWithUI, event: Event): void {
    event.stopPropagation();
    this.editingNoteId = note.id!;
    this.selectedNoteId = note.id!;
    this.cd.detectChanges();
  }

  stopEditing(note: NoteWithUI): void {
    if (this.editingNoteId === note.id) {
      this.editingNoteId = null;
      this.updateNote(note);
    }
  }

  deselectAll(): void {
    if (!this.linkMode) {
      this.selectedNoteId = null;
      this.editingNoteId = null;
      this.cd.detectChanges();
    }
  }

  /* =========================
     LINKS CRUD
  ========================= */

  toggleLinkMode(): void {
    this.linkMode = !this.linkMode;
    if (!this.linkMode) {
      this.linkFromNoteId = null;
    }
    this.selectedNoteId = null;
    this.cd.detectChanges();
  }

  noteClickedForLink(noteId: string): void {
    if (!this.linkMode) return;

    if (!this.linkFromNoteId) {
      this.linkFromNoteId = noteId;
      this.cd.detectChanges();
    } else if (this.linkFromNoteId !== noteId) {
      this.createLinkTo(noteId);
    }
  }

  createLinkTo(noteToId: string): void {
    if (!this.linkFromNoteId) return;

    // Check if link already exists
    const existingLink = this.links.find(
      l => (l.fromNoteId === this.linkFromNoteId && l.toNoteId === noteToId) ||
        (l.fromNoteId === noteToId && l.toNoteId === this.linkFromNoteId)
    );

    if (existingLink) {
      this.linkFromNoteId = null;
      this.linkMode = false;
      return;
    }

    const payload: CreateLinkRequest = {
      fromNoteId: this.linkFromNoteId,
      toNoteId: noteToId,
    };

    createLink(this.http, API_URL, { boardId: this.boardId, body: payload }).subscribe({
      next: res => {
        if (res.body) this.links.push(res.body);
        this.linkMode = false;
        this.linkFromNoteId = null;
        this.cd.detectChanges();
      },
      error: err => console.error('Error creating link:', err),
    });
  }

  deleteLinkById(linkId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    deleteLink(this.http, API_URL, { boardId: this.boardId, linkId }).subscribe({
      next: () => {
        this.links = this.links.filter(l => l.id !== linkId);
        this.cd.detectChanges();
      },
      error: err => console.error('Error deleting link:', err),
    });
  }

  /* =========================
     UPLOAD IMAGE
  ========================= */

  triggerFileInput(noteId: string): void {
    const input = document.getElementById('file-input-' + noteId) as HTMLInputElement;
    if (input) input.click();
  }

  uploadNoteImage(event: Event, noteId: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    uploadImage(this.http, API_URL, { boardId: this.boardId, noteId, body: { file } }).subscribe({
      next: res => {
        if (res.body) this.replaceNote(res.body);
        this.cd.detectChanges();
      },
      error: err => console.error('Error uploading image:', err),
    });
  }

  /* =========================
     DRAG NOTE
  ========================= */

  onDragStarted(note: NoteWithUI): void {
    note.zIndex = ++this.maxZIndex;
    this.selectedNoteId = note.id!;
  }

  dragEnded(event: CdkDragEnd, note: NoteWithUI): void {
    const pos = event.source.getFreeDragPosition();
    note.positionX = pos.x;
    note.positionY = pos.y;
    this.updateNote(note);
  }

  /* =========================
     BOARD PANNING
  ========================= */

  onBoardMouseDown(event: MouseEvent): void {
    if (event.shiftKey) {
      this.isPanning = true;
      this.lastPanPoint = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    }
  }

  onBoardMouseMove(event: MouseEvent): void {
    if (this.isPanning) {
      const dx = event.clientX - this.lastPanPoint.x;
      const dy = event.clientY - this.lastPanPoint.y;
      this.panOffset.x += dx;
      this.panOffset.y += dy;
      this.lastPanPoint = { x: event.clientX, y: event.clientY };
      this.cd.detectChanges();
    }
  }

  onBoardMouseUp(): void {
    this.isPanning = false;
  }

  /* =========================
     HELPERS
  ========================= */

  getNoteById(noteId: string): NoteWithUI | undefined {
    return this.notes.find(n => n.id === noteId);
  }

  // Calculate note dimensions based on content and type
  getNoteDimensions(note: NoteWithUI): { width: number; height: number } {
    const baseWidth = note.noteType === 'photo' ? 180 : 200;
    const baseHeight = note.noteType === 'photo' ? 220 : 120;

    // Auto-size based on content length
    const contentLength = (note.content || '').length;
    const extraHeight = Math.min(Math.floor(contentLength / 30) * 20, 150);

    // Add height for images
    const imageHeight = note.imageUrl ? 120 : 0;

    return {
      width: baseWidth,
      height: baseHeight + extraHeight + imageHeight
    };
  }

  // Returns the center X position of a note
  getNoteCenterX(noteId?: string): number {
    const note = noteId ? this.getNoteById(noteId) : undefined;
    if (!note) return 0;
    const dims = this.getNoteDimensions(note);
    return (note.positionX || 0) + dims.width / 2 + this.panOffset.x;
  }

  // Returns the center Y position of a note (at the pin location - top center)
  getNoteCenterY(noteId?: string): number {
    const note = noteId ? this.getNoteById(noteId) : undefined;
    if (!note) return 0;
    return (note.positionY || 0) + 12 + this.panOffset.y; // 12px from top (pin location)
  }

  // Get the path for curved string connection
  getLinkPath(link: LinkResponse): string {
    const x1 = this.getNoteCenterX(link.fromNoteId);
    const y1 = this.getNoteCenterY(link.fromNoteId);
    const x2 = this.getNoteCenterX(link.toNoteId);
    const y2 = this.getNoteCenterY(link.toNoteId);

    // Calculate control point for curve (sag effect)
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const sag = Math.min(distance * 0.15, 50); // Sag amount based on distance

    return `M ${x1} ${y1} Q ${midX} ${midY + sag} ${x2} ${y2}`;
  }

  // Get sticky note color class
  getStickyColorClass(color: string): string {
    const colorMap: { [key: string]: string } = {
      'yellow': 'sticky-yellow',
      'pink': 'sticky-pink',
      'blue': 'sticky-blue',
      'green': 'sticky-green',
      'purple': 'sticky-pink', // Map old purple to pink
    };
    return colorMap[color] || 'sticky-yellow';
  }

  trackByNoteId(index: number, note: NoteWithUI): string {
    return note.id || index.toString();
  }

  trackByLinkId(index: number, link: LinkResponse): string {
    return link.id || index.toString();
  }
}
