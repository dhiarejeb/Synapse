import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  HostListener,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { BoardResponseDto } from "../../../../services/models/board-response-dto";
import { NoteResponseDto } from "../../../../services/models/note-response-dto";
import { LinkResponse } from "../../../../services/models/link-response";
import { HttpClient } from "@angular/common/http";
import { getById } from "../../../../services/fn/board-controller/get-by-id";
import { getNotes } from "../../../../services/fn/note-controller/get-notes";
import { create1 } from "../../../../services/fn/note-controller/create-1";
import { delete1 } from "../../../../services/fn/note-controller/delete-1";
import { patch1 } from "../../../../services/fn/note-controller/patch-1";
import { getBoardLinks } from "../../../../services/fn/link-controller/get-board-links";
import { deleteLink } from "../../../../services/fn/link-controller/delete-link";
import { createLink } from "../../../../services/fn/link-controller/create-link";
import { NoteRequestDto } from "../../../../services/models/note-request-dto";
import { CreateLinkRequest } from "../../../../services/models/create-link-request";
import { CommonModule } from "@angular/common";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { uploadImage } from "../../../../services/fn/note-controller/upload-image";
import { FormsModule } from "@angular/forms";

const API_URL = "http://localhost:8080";

// Note types - matching backend enum
type NoteType = "STICKY" | "PHOTO" | "DOCUMENT" | "CLIPPING" | "LABEL" | "INDEX_CARD" | "EVIDENCE_TAG";

// Extended note type with UI properties
interface NoteWithUI extends NoteResponseDto {
  rotation?: number;
  zIndex?: number;
  noteType?: NoteType;
  // Drag state
  isDragging?: boolean;
  // Resize state
  isResizing?: boolean;
  width?: number;
  height?: number;
  // Local image preview (for immediate display before server response)
  localImageUrl?: string;
}

// Color configuration
interface ColorConfig {
  value: string;
  label: string;
  class: string;
  hex: string;
}

// Valid note types for validation
const VALID_NOTE_TYPES: NoteType[] = ["STICKY", "PHOTO", "DOCUMENT", "CLIPPING", "LABEL", "INDEX_CARD", "EVIDENCE_TAG"];

// Helper function to normalize and validate NoteType from backend
// Handles various formats: "STICKY", "sticky", "Sticky", "sticky_note", etc.
function normalizeNoteType(type: any): NoteType {
  if (!type) return "STICKY";

  // Convert to uppercase string
  const normalized = String(type).toUpperCase().trim();

  // Direct match
  if (VALID_NOTE_TYPES.includes(normalized as NoteType)) {
    return normalized as NoteType;
  }

  // Handle potential underscore variations
  const withUnderscore = normalized.replace(/-/g, '_');
  if (VALID_NOTE_TYPES.includes(withUnderscore as NoteType)) {
    return withUnderscore as NoteType;
  }

  // Handle "STICKY_NOTE" -> "STICKY" mapping if needed
  if (normalized === "STICKY_NOTE") return "STICKY";
  if (normalized === "INDEX" || normalized === "INDEXCARD") return "INDEX_CARD";
  if (normalized === "EVIDENCE" || normalized === "EVIDENCETAG") return "EVIDENCE_TAG";

  // Default fallback
  return "STICKY";
}

// Helper function to validate NoteType
function isValidNoteType(type: any): type is NoteType {
  return VALID_NOTE_TYPES.includes(type);
}

@Component({
  selector: "app-board",
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: "./board.page.html",
  styleUrls: ["./board.page.scss"],
})
export class BoardPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("boardContainer") boardContainer!: ElementRef;
  @ViewChild("notesWrapper") notesWrapper!: ElementRef;
  @ViewChild("boardSurface") boardSurface!: ElementRef;

  boardId!: string;
  board?: BoardResponseDto;

  // Card types - matching backend enum
  NOTE_TYPES: { value: NoteType; label: string; icon: string }[] = [
    { value: "STICKY", label: "Sticky Note", icon: "📝" },
    { value: "PHOTO", label: "Photo", icon: "📷" },
    { value: "DOCUMENT", label: "Document", icon: "📄" },
    { value: "CLIPPING", label: "Clipping", icon: "📰" },
    { value: "LABEL", label: "Label", icon: "🏷️" },
    { value: "INDEX_CARD", label: "Index Card", icon: "📇" },
    { value: "EVIDENCE_TAG", label: "Evidence Tag", icon: "🔖" },
  ];

  // Extended color palette - 12 colors
  STICKY_COLORS: ColorConfig[] = [
    { value: "yellow", label: "Yellow", class: "sticky-yellow", hex: "#fff59d" },
    { value: "pink", label: "Pink", class: "sticky-pink", hex: "#f8bbd9" },
    { value: "blue", label: "Blue", class: "sticky-blue", hex: "#b3e5fc" },
    { value: "green", label: "Green", class: "sticky-green", hex: "#c8e6c9" },
    { value: "orange", label: "Orange", class: "sticky-orange", hex: "#ffcc80" },
    { value: "purple", label: "Purple", class: "sticky-purple", hex: "#d1c4e9" },
    { value: "coral", label: "Coral", class: "sticky-coral", hex: "#ffab91" },
    { value: "mint", label: "Mint", class: "sticky-mint", hex: "#b2dfdb" },
    { value: "lavender", label: "Lavender", class: "sticky-lavender", hex: "#e1bee7" },
    { value: "peach", label: "Peach", class: "sticky-peach", hex: "#ffe0b2" },
    { value: "sky", label: "Sky", class: "sticky-sky", hex: "#b2ebf2" },
    { value: "lime", label: "Lime", class: "sticky-lime", hex: "#dcedc8" },
  ];

  // String colors for links - expanded
  STRING_COLORS = [
    { value: "red", label: "Red", hex: "#8b0000" },
    { value: "blue", label: "Blue", hex: "#1a237e" },
    { value: "green", label: "Green", hex: "#1b5e20" },
    { value: "yellow", label: "Yellow", hex: "#f57f17" },
    { value: "white", label: "White", hex: "#e0e0e0" },
    { value: "orange", label: "Orange", hex: "#e65100" },
    { value: "purple", label: "Purple", hex: "#4a148c" },
    { value: "black", label: "Black", hex: "#1a1a1a" },
  ];

  newNoteType: NoteType = "STICKY";
  newNoteColor = "yellow";
  newStringColor = "red";

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

  // Board size - much larger for infinite canvas feel
  boardWidth = 6000;
  boardHeight = 4000;

  // Zoom and pan
  zoom = 1;
  minZoom = 0.25;
  maxZoom = 2;
  panOffset = { x: 0, y: 0 };
  isPanning = false;
  lastPanPoint = { x: 0, y: 0 };

  // Z-index management
  maxZIndex = 10;

  // Selected note for editing
  selectedNoteId: string | null = null;
  editingNoteId: string | null = null;

  // Drag state - native drag for performance
  draggingNote: NoteWithUI | null = null;
  dragOffset = { x: 0, y: 0 };
  dragStartPos = { x: 0, y: 0 };
  hasDragged = false;

  // Resize state
  resizingNote: NoteWithUI | null = null;
  resizeStartSize = { width: 0, height: 0 };
  resizeStartPos = { x: 0, y: 0 };

  // Track animation frame for smooth updates
  private animationFrameId: number | null = null;

  // Bound event handlers for proper cleanup
  private boundOnWheel: (event: WheelEvent) => void;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.boundOnWheel = this.onWheel.bind(this);
  }

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.errorBoard = "No board ID provided";
      return;
    }
    this.boardId = id;
    this.loadBoard();

    // Center the view initially
    this.centerView();
  }



  ngAfterViewInit(): void {
    // Use passive listeners for better scroll performance
    this.boardSurface?.nativeElement?.addEventListener('wheel', this.boundOnWheel, { passive: false });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.boardSurface?.nativeElement?.removeEventListener('wheel', this.boundOnWheel);
  }

  // Center the view on load
  private centerView(): void {
    // Position to show center of usable area
    this.panOffset = {
      x: -this.boardWidth / 2 + window.innerWidth / 2,
      y: -this.boardHeight / 2 + window.innerHeight / 2
    };
  }

  // Keyboard shortcuts
  @HostListener("window:keydown", ["$event"])
  onKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      this.linkMode = false;
      this.linkFromNoteId = null;
      this.selectedNoteId = null;
      this.editingNoteId = null;
      this.cd.detectChanges();
    }
    if (e.key === "Delete" && this.selectedNoteId && !this.editingNoteId) {
      this.deleteNote(this.selectedNoteId);
    }
    // Zoom shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === "=") {
      e.preventDefault();
      this.zoomIn();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "-") {
      e.preventDefault();
      this.zoomOut();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "0") {
      e.preventDefault();
      this.resetZoom();
    }
  }

  @HostListener("window:mouseup", ["$event"])
  onMouseUp(event: MouseEvent): void {
    if (this.draggingNote) {
      const note = this.draggingNote;
      note.isDragging = false;
      this.draggingNote = null;

      // Only save if actually moved
      if (this.hasDragged) {
        this.updateNote(note);
      }
      this.hasDragged = false;
      this.cd.detectChanges();
    }

    if (this.resizingNote) {
      const note = this.resizingNote;
      note.isResizing = false;
      this.resizingNote = null;
      this.updateNote(note);
      this.cd.detectChanges();
    }

    this.isPanning = false;
  }

  @HostListener("window:mousemove", ["$event"])
  onMouseMove(event: MouseEvent): void {
    if (this.draggingNote) {
      this.handleNoteDrag(event);
    } else if (this.resizingNote) {
      this.handleNoteResize(event);
    } else if (this.isPanning) {
      this.handleBoardPan(event);
    }
  }

  /* =========================
     ZOOM CONTROLS
  ========================= */

  onWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();

      const rect = this.boardSurface.nativeElement.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Calculate zoom
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * delta));

      if (newZoom !== this.zoom) {
        // Adjust pan to zoom toward mouse position
        const scale = newZoom / this.zoom;
        this.panOffset.x = mouseX - (mouseX - this.panOffset.x) * scale;
        this.panOffset.y = mouseY - (mouseY - this.panOffset.y) * scale;
        this.zoom = newZoom;
        this.cd.detectChanges();
      }
    } else {
      // Normal scroll = pan
      this.panOffset.x -= event.deltaX;
      this.panOffset.y -= event.deltaY;
      this.cd.detectChanges();
    }
  }

  zoomIn(): void {
    this.zoom = Math.min(this.maxZoom, this.zoom * 1.2);
    this.cd.detectChanges();
  }

  zoomOut(): void {
    this.zoom = Math.max(this.minZoom, this.zoom / 1.2);
    this.cd.detectChanges();
  }

  resetZoom(): void {
    this.zoom = 1;
    this.centerView();
    this.cd.detectChanges();
  }

  getZoomPercent(): number {
    return Math.round(this.zoom * 100);
  }

  /* =========================
     LOAD BOARD, NOTES, LINKS
  ========================= */

  private loadBoard(): void {
    this.loadingBoard = true;
    getById(this.http, API_URL, { id: this.boardId }).subscribe({
      next: (res) => {
        this.board = res.body!;
        this.loadNotes();
        this.loadLinks();
      },
      error: (err) => {
        console.error("Error loading board:", err);
        this.errorBoard = "Unable to load board";
      },
      complete: () => (this.loadingBoard = false),
    });
  }

  // FIXED: loadNotes now properly normalizes noteType from backend
  private loadNotes(): void {
    this.loadingNotes = true;
    getNotes(this.http, API_URL, { boardId: this.boardId }).subscribe({
      next: (res) => {
        this.notes = (res.body ?? []).map((note) => {
          // FIXED: Use normalizeNoteType to handle various backend formats
          const noteType: NoteType = normalizeNoteType(note.noteType);

          // Use persisted dimensions from backend, fallback to defaults only if not set
          const width = note.width ?? this.getDefaultWidth(noteType);
          const height = note.height ?? this.getDefaultHeight(noteType);

          return {
            ...note,
            rotation: this.getRandomRotation(),
            zIndex: 10,
            noteType, // Use normalized type
            width,
            height,
            // Preserve imageUrl from backend
            imageUrl: note.imageUrl,
          };
        });
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Error loading notes:", err);
        this.errorNotes = "Unable to load notes";
        this.cd.detectChanges();
      },
      complete: () => (this.loadingNotes = false),
    });
  }

  private loadLinks(): void {
    this.loadingLinks = true;
    getBoardLinks(this.http, API_URL, { boardId: this.boardId }).subscribe({
      next: (res) => {
        this.links = res.body ?? [];
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Error loading links:", err);
        this.errorLinks = "Unable to load links";
        this.cd.detectChanges();
      },
      complete: () => (this.loadingLinks = false),
    });
  }

  /* =========================
     HELPERS
  ========================= */

  getRandomRotation(): number {
    return (Math.random() - 0.5) * 6;
  }

  getDefaultWidth(type: NoteType): number {
    switch (type) {
      case "PHOTO": return 180;
      case "DOCUMENT": return 240;
      case "CLIPPING": return 220;
      case "LABEL": return 120;
      case "INDEX_CARD": return 280;
      case "EVIDENCE_TAG": return 100;
      default: return 200; // STICKY default
    }
  }

  getDefaultHeight(type: NoteType): number | undefined {
    switch (type) {
      case "PHOTO": return 220;
      case "INDEX_CARD": return 180;
      default: return undefined; // Auto height for STICKY, DOCUMENT, etc.
    }
  }

  trackByNoteId(index: number, note: NoteWithUI): string {
    return note.id || index.toString();
  }

  trackByLinkId(index: number, link: LinkResponse): string {
    return link.id || index.toString();
  }

  /* =========================
     NOTES CRUD
  ========================= */

  createNote(): void {
    // Place new note in visible area
    const viewCenterX = (-this.panOffset.x + window.innerWidth / 2) / this.zoom;
    const viewCenterY = (-this.panOffset.y + window.innerHeight / 2) / this.zoom;

    const defaultWidth = this.getDefaultWidth(this.newNoteType);
    const defaultHeight = this.getDefaultHeight(this.newNoteType);

    // Use proper DTO fields for width, height, and noteType
    const payload: NoteRequestDto = {
      color: this.newNoteColor,
      content: "",
      positionX: viewCenterX + (Math.random() - 0.5) * 200,
      positionY: viewCenterY + (Math.random() - 0.5) * 150,
      noteType: this.newNoteType,
      width: defaultWidth,
      height: defaultHeight,
    };

    create1(this.http, API_URL, { boardId: this.boardId, body: payload }).subscribe({
      next: (res) => {
        if (res.body) {
          // Use persisted dimensions from response, fallback to defaults
          const responseWidth = res.body.width ?? defaultWidth;
          const responseHeight = res.body.height ?? defaultHeight;
          const newNote: NoteWithUI = {
            ...res.body,
            rotation: this.getRandomRotation(),
            zIndex: ++this.maxZIndex,
            noteType: this.newNoteType, // Use the type we sent, not from response
            width: responseWidth,
            height: responseHeight,
          };
          this.notes.push(newNote);
          this.selectedNoteId = newNote.id!;
        }
        this.cd.detectChanges();
      },
      error: (err) => console.error("Error creating note:", err),
    });
  }

  updateNote(note: NoteWithUI): void {
    if (!note.id) return;

    // Use proper DTO fields for all properties including width, height, and noteType
    const payload: NoteRequestDto = {
      content: note.content,
      positionX: note.positionX,
      positionY: note.positionY,
      color: note.color,
      noteType: note.noteType,
      width: note.width,
      height: note.height,
    };

    patch1(this.http, API_URL, { boardId: this.boardId, noteId: note.id, body: payload }).subscribe({
      next: (res) => {
        if (res.body) this.replaceNote(res.body);
        this.cd.detectChanges();
      },
      error: (err) => console.error("Error updating note:", err),
    });
  }

  deleteNote(noteId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    delete1(this.http, API_URL, { boardId: this.boardId, noteId }).subscribe({
      next: () => {
        this.notes = this.notes.filter((n) => n.id !== noteId);
        this.links = this.links.filter((l) => l.fromNoteId !== noteId && l.toNoteId !== noteId);
        this.selectedNoteId = null;
        this.cd.detectChanges();
      },
      error: (err) => console.error("Error deleting note:", err),
    });
  }

  // FIXED: replaceNote now properly normalizes noteType
  private replaceNote(updated: NoteResponseDto) {
    const index = this.notes.findIndex((n) => n.id === updated.id);
    if (index !== -1) {
      const existingNote = this.notes[index];
      // Use persisted dimensions from backend response, preserve UI-only properties
      this.notes[index] = {
        ...updated,
        rotation: existingNote.rotation,
        zIndex: existingNote.zIndex,
        // FIXED: Use normalizeNoteType for backend response
        noteType: normalizeNoteType(updated.noteType) || existingNote.noteType,
        width: updated.width ?? existingNote.width,
        height: updated.height ?? existingNote.height,
        localImageUrl: existingNote.localImageUrl,
        // Preserve imageUrl from response
        imageUrl: updated.imageUrl ?? existingNote.imageUrl,
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
    if (!this.linkMode && !this.draggingNote && !this.resizingNote) {
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
    } else {
      this.linkFromNoteId = null;
      this.linkMode = false;
      this.cd.detectChanges();
    }
  }

  createLinkTo(noteToId: string): void {
    if (!this.linkFromNoteId) return;

    const existingLink = this.links.find(
      (l) =>
        (l.fromNoteId === this.linkFromNoteId && l.toNoteId === noteToId) ||
        (l.fromNoteId === noteToId && l.toNoteId === this.linkFromNoteId)
    );

    if (existingLink) {
      this.linkFromNoteId = null;
      this.linkMode = false;
      this.cd.detectChanges();
      return;
    }

    const payload: CreateLinkRequest = {
      fromNoteId: this.linkFromNoteId,
      toNoteId: noteToId,
    };

    (payload as any).color = this.newStringColor;

    createLink(this.http, API_URL, { boardId: this.boardId, body: payload }).subscribe({
      next: (res) => {
        if (res.body) {
          this.links.push({
            ...res.body,
            color: this.newStringColor,
          } as any);
        }
        this.linkMode = false;
        this.linkFromNoteId = null;
        this.cd.detectChanges();
      },
      error: (err) => console.error("Error creating link:", err),
    });
  }

  deleteLinkById(linkId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (!linkId) {
      console.error("Cannot delete link: linkId is null or undefined");
      return;
    }

    deleteLink(this.http, API_URL, { boardId: this.boardId, linkId }).subscribe({
      next: () => {
        this.links = this.links.filter((l) => l.id !== linkId);
        this.cd.detectChanges();
      },
      error: (err) => console.error("Error deleting link:", err),
    });
  }

  /* =========================
     UPLOAD IMAGE - FIXED
  ========================= */

  triggerFileInput(noteId: string, event?: Event): void {
    if (event) event.stopPropagation();
    const input = document.getElementById("file-input-" + noteId) as HTMLInputElement;
    if (input) {
      input.value = "";
      input.click();
    }
  }

  uploadNoteImage(event: Event, noteId: string): void {
    console.log('uploadNoteImage CALLED', noteId);
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;

    // 🔹 Local preview
    const reader = new FileReader();
    reader.onload = e => {
      const idx = this.notes.findIndex(n => n.id === noteId);
      if (idx !== -1) {
        this.notes[idx].localImageUrl = e.target?.result as string;
      }
    };
    reader.readAsDataURL(file);

    // 🔹 Multipart upload
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_URL}/api/v1/boards/${this.boardId}/notes/${noteId}/image`;

    this.http.post<NoteResponseDto>(url, formData).subscribe({
      next: res => {
        const idx = this.notes.findIndex(n => n.id === noteId);
        if (idx !== -1) {
          this.notes[idx] = {
            ...this.notes[idx],
            ...res,
            imageUrl: res.imageUrl,
            localImageUrl: undefined,
            noteType: normalizeNoteType(res.noteType),
          };
        }

        // 🔹 allow re-uploading same file
        input.value = '';
      },
      error: err => {
        console.error('Image upload failed', err);
        input.value = '';
      }
    });
  }




  getImageUrl(note: NoteWithUI): string {
    if (note.localImageUrl) return note.localImageUrl;
    if (!note.imageUrl) return '';

    try {
      const url = note.imageUrl.startsWith('http')
        ? new URL(note.imageUrl)
        : new URL(`${API_URL}${note.imageUrl.startsWith('/') ? '' : '/'}${note.imageUrl}`);

      // 🔥 Encode path (fix spaces, unicode, etc.)
      url.pathname = encodeURI(url.pathname);
      return url.toString();
    } catch {
      return note.imageUrl;
    }
  }


  onImageError(note: NoteWithUI): void {
    console.error("Image failed to load for note:", note.id, "URL:", note.imageUrl);
    // Don't clear the URL - just log the error
    // The user might want to see a broken image indicator
    this.cd.detectChanges();
  }

  /* =========================
     DRAG - FIXED VERSION
  ========================= */

  onNoteMouseDown(event: MouseEvent, note: NoteWithUI): void {
    // Only respond to left mouse button
    if (event.button !== 0) return;
    // Don't drag while editing
    if (this.editingNoteId === note.id) return;

    event.preventDefault();
    event.stopPropagation();

    // Handle link mode clicks
    if (this.linkMode) {
      this.noteClickedForLink(note.id!);
      return;
    }

    // Start drag
    this.draggingNote = note;
    note.isDragging = true;
    note.zIndex = ++this.maxZIndex;
    this.selectedNoteId = note.id!;
    this.hasDragged = false;

    // Store start position for drag threshold detection
    this.dragStartPos = { x: event.clientX, y: event.clientY };

    // Calculate offset from mouse to note position (in board coordinates)
    // We need to account for both zoom and pan
    const boardRect = this.boardSurface?.nativeElement?.getBoundingClientRect() || { left: 0, top: 0 };

    // Mouse position relative to board surface
    const mouseXRelativeToBoard = event.clientX - boardRect.left;
    const mouseYRelativeToBoard = event.clientY - boardRect.top;

    // Convert to board coordinates (accounting for pan and zoom)
    const mouseBoardX = (mouseXRelativeToBoard - this.panOffset.x) / this.zoom;
    const mouseBoardY = (mouseYRelativeToBoard - this.panOffset.y) / this.zoom;

    // Offset is difference between mouse position in board coords and note position
    this.dragOffset = {
      x: mouseBoardX - (note.positionX || 0),
      y: mouseBoardY - (note.positionY || 0),
    };

    this.cd.detectChanges();
  }

  private handleNoteDrag(event: MouseEvent): void {
    if (!this.draggingNote) return;

    // Check if actually moved (prevents accidental drags on click)
    const dx = Math.abs(event.clientX - this.dragStartPos.x);
    const dy = Math.abs(event.clientY - this.dragStartPos.y);
    if (dx > 3 || dy > 3) {
      this.hasDragged = true;
    }

    if (!this.hasDragged) return;

    // Get board surface rect
    const boardRect = this.boardSurface?.nativeElement?.getBoundingClientRect() || { left: 0, top: 0 };

    // Mouse position relative to board surface
    const mouseXRelativeToBoard = event.clientX - boardRect.left;
    const mouseYRelativeToBoard = event.clientY - boardRect.top;

    // Convert to board coordinates (accounting for pan and zoom)
    const mouseBoardX = (mouseXRelativeToBoard - this.panOffset.x) / this.zoom;
    const mouseBoardY = (mouseYRelativeToBoard - this.panOffset.y) / this.zoom;

    // Calculate new position
    const newX = mouseBoardX - this.dragOffset.x;
    const newY = mouseBoardY - this.dragOffset.y;

    // Clamp to board bounds
    this.draggingNote.positionX = Math.max(0, Math.min(this.boardWidth - 100, newX));
    this.draggingNote.positionY = Math.max(0, Math.min(this.boardHeight - 100, newY));

    // Use requestAnimationFrame for smooth updates
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(() => {
      this.cd.detectChanges();
    });
  }

  /* =========================
     RESIZE
  ========================= */

  onResizeMouseDown(event: MouseEvent, note: NoteWithUI): void {
    event.preventDefault();
    event.stopPropagation();

    this.resizingNote = note;
    note.isResizing = true;
    this.resizeStartSize = {
      width: note.width || this.getDefaultWidth(note.noteType || "STICKY"),
      height: note.height || 100,
    };
    this.resizeStartPos = { x: event.clientX, y: event.clientY };

    this.cd.detectChanges();
  }

  private handleNoteResize(event: MouseEvent): void {
    if (!this.resizingNote) return;

    const dx = (event.clientX - this.resizeStartPos.x) / this.zoom;
    const dy = (event.clientY - this.resizeStartPos.y) / this.zoom;

    const minWidth = 100;
    const minHeight = 60;
    const maxWidth = 500;
    const maxHeight = 600;

    this.resizingNote.width = Math.max(minWidth, Math.min(maxWidth, this.resizeStartSize.width + dx));
    this.resizingNote.height = Math.max(minHeight, Math.min(maxHeight, this.resizeStartSize.height + dy));

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(() => {
      this.cd.detectChanges();
    });
  }

  /* =========================
     BOARD PANNING
  ========================= */

  onBoardMouseDown(event: MouseEvent): void {
    // Pan with middle mouse, shift+left, or just left click on empty area
    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      this.isPanning = true;
      this.lastPanPoint = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    }
  }

  private handleBoardPan(event: MouseEvent): void {
    const dx = event.clientX - this.lastPanPoint.x;
    const dy = event.clientY - this.lastPanPoint.y;
    this.panOffset.x += dx;
    this.panOffset.y += dy;
    this.lastPanPoint = { x: event.clientX, y: event.clientY };
    this.cd.detectChanges();
  }

  /* =========================
     LINK PATH CALCULATIONS
  ========================= */

  getNoteById(noteId: string): NoteWithUI | undefined {
    return this.notes.find((n) => n.id === noteId);
  }

  // Get pin X position in SCREEN coordinates
  getPinX(noteId?: string): number {
    const note = noteId ? this.getNoteById(noteId) : undefined;
    if (!note) return 0;
    const width = note.width || this.getDefaultWidth(note.noteType || "STICKY");
    // Position in local coordinates + offset to center + transform to screen
    const localX = (note.positionX || 0) + width / 2;
    return localX * this.zoom + this.panOffset.x;
  }

  // Get pin Y position in SCREEN coordinates
  getPinY(noteId?: string): number {
    const note = noteId ? this.getNoteById(noteId) : undefined;
    if (!note) return 0;
    // Pin is at top of card, around 12px from top
    const localY = (note.positionY || 0) + 12;
    return localY * this.zoom + this.panOffset.y;
  }

  getLinkPath(link: LinkResponse): string {
    const fromNote = this.getNoteById(link.fromNoteId!);
    const toNote = this.getNoteById(link.toNoteId!);

    // Return empty if notes not found
    if (!fromNote || !toNote) {
      return "";
    }

    const x1 = this.getPinX(link.fromNoteId);
    const y1 = this.getPinY(link.fromNoteId);
    const x2 = this.getPinX(link.toNoteId);
    const y2 = this.getPinY(link.toNoteId);

    // Natural sag based on distance
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const sag = Math.min(distance * 0.15, 60);

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 + sag;

    return `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
  }

  getStringColor(link: LinkResponse): string {
    const color = (link as any).color || "red";
    const colorConfig = this.STRING_COLORS.find((c) => c.value === color);
    return colorConfig?.hex || "#8b0000";
  }

  getStickyColorClass(color: string): string {
    const colorConfig = this.STICKY_COLORS.find((c) => c.value === color);
    return colorConfig?.class || "sticky-yellow";
  }

  /* =========================
     CHANGE NOTE COLOR
  ========================= */

  changeNoteColor(note: NoteWithUI, color: string, event: Event): void {
    event.stopPropagation();
    note.color = color;
    this.updateNote(note);
    this.cd.detectChanges();
  }

  /* =========================
     TRANSFORM HELPERS
  ========================= */

  getSvgWidth(): number {
    if (this.boardSurface?.nativeElement) {
      return this.boardSurface.nativeElement.clientWidth || 2000;
    }
    return 2000;
  }

  getSvgHeight(): number {
    if (this.boardSurface?.nativeElement) {
      return this.boardSurface.nativeElement.clientHeight || 1500;
    }
    return 1500;
  }

  getBoardTransform(): string {
    return `translate(${this.panOffset.x}px, ${this.panOffset.y}px) scale(${this.zoom})`;
  }

  // getNoteStyle handles height properly and uses string values
  getNoteStyle(note: NoteWithUI): { [key: string]: string } {
    const rotation = note.rotation || 0;
    const posX = note.positionX ?? 0;
    const posY = note.positionY ?? 0;
    const width = note.width ?? this.getDefaultWidth(note.noteType || "STICKY");

    const style: { [key: string]: string } = {
      "left": `${posX}px`,
      "top": `${posY}px`,
      "z-index": `${note.zIndex ?? 10}`,
      "transform": `rotate(${rotation}deg)`,
      "width": `${width}px`,
    };

    // Only set height if it's a valid number - otherwise let CSS handle auto height
    if (note.height != null && typeof note.height === 'number' && note.height > 0) {
      style["height"] = `${note.height}px`;
    }

    return style;
  }
}

export default BoardPage;
