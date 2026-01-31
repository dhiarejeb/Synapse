import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
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

// Note types
type NoteType = "sticky" | "photo" | "document" | "clipping" | "label";

// Extended note type with UI properties
interface NoteWithUI extends NoteResponseDto {
  rotation?: number;
  zIndex?: number;
  noteType?: NoteType;
  // For tracking drag state
  isDragging?: boolean;
  dragStartX?: number;
  dragStartY?: number;
}

// Color configuration
interface ColorConfig {
  value: string;
  label: string;
  class: string;
  hex: string;
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

  boardId!: string;
  board?: BoardResponseDto;

  // Card types
  NOTE_TYPES: { value: NoteType; label: string; icon: string }[] = [
    { value: "sticky", label: "Sticky Note", icon: "📝" },
    { value: "photo", label: "Photo", icon: "📷" },
    { value: "document", label: "Document", icon: "📄" },
    { value: "clipping", label: "Clipping", icon: "📰" },
    { value: "label", label: "Label", icon: "🏷️" },
  ];

  // Extended color palette
  STICKY_COLORS: ColorConfig[] = [
    { value: "yellow", label: "Yellow", class: "sticky-yellow", hex: "#fff59d" },
    { value: "pink", label: "Pink", class: "sticky-pink", hex: "#f8bbd9" },
    { value: "blue", label: "Blue", class: "sticky-blue", hex: "#b3e5fc" },
    { value: "green", label: "Green", class: "sticky-green", hex: "#c8e6c9" },
    { value: "orange", label: "Orange", class: "sticky-orange", hex: "#ffcc80" },
    { value: "purple", label: "Purple", class: "sticky-purple", hex: "#d1c4e9" },
    { value: "coral", label: "Coral", class: "sticky-coral", hex: "#ffab91" },
    { value: "mint", label: "Mint", class: "sticky-mint", hex: "#b2dfdb" },
  ];

  // String colors for links
  STRING_COLORS = [
    { value: "red", label: "Red", hex: "#8b0000" },
    { value: "blue", label: "Blue", hex: "#1a237e" },
    { value: "green", label: "Green", hex: "#1b5e20" },
    { value: "yellow", label: "Yellow", hex: "#f57f17" },
    { value: "white", label: "White", hex: "#ffffff" },
  ];

  newNoteType: NoteType = "sticky";
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

  // Board interaction - improved panning
  isPanning = false;
  panOffset = { x: 0, y: 0 };
  lastPanPoint = { x: 0, y: 0 };

  // Z-index management
  maxZIndex = 10;

  // Selected note for editing
  selectedNoteId: string | null = null;
  editingNoteId: string | null = null;

  // Drag state - using native drag for better performance
  draggingNote: NoteWithUI | null = null;
  dragOffset = { x: 0, y: 0 };

  // Store note element refs for link calculations
  private noteElements = new Map<string, HTMLElement>();

  // Bound event handlers for cleanup
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundKeyDown = this.onKeyDown.bind(this);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.errorBoard = "No board ID provided";
      return;
    }
    this.boardId = id;
    this.loadBoard();
  }

  ngAfterViewInit(): void {
    document.addEventListener("mousemove", this.boundMouseMove);
    document.addEventListener("mouseup", this.boundMouseUp);
    document.addEventListener("keydown", this.boundKeyDown);
  }

  ngOnDestroy(): void {
    document.removeEventListener("mousemove", this.boundMouseMove);
    document.removeEventListener("mouseup", this.boundMouseUp);
    document.removeEventListener("keydown", this.boundKeyDown);
  }

  private onKeyDown(e: KeyboardEvent): void {
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

  private loadNotes(): void {
    this.loadingNotes = true;
    getNotes(this.http, API_URL, { boardId: this.boardId }).subscribe({
      next: (res) => {
        this.notes = (res.body ?? []).map((note) => ({
          ...note,
          rotation: this.getRandomRotation(),
          zIndex: 10,
          noteType: (note as any).noteType || "sticky",
        }));
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
     RANDOM ROTATION
  ========================= */

  getRandomRotation(): number {
    return (Math.random() - 0.5) * 6; // -3 to +3 degrees
  }

  /* =========================
     NOTES CRUD
  ========================= */

  createNote(): void {
    const payload: NoteRequestDto = {
      color: this.newNoteColor,
      content: "",
      positionX: 150 + Math.random() * 300 - this.panOffset.x,
      positionY: 150 + Math.random() * 200 - this.panOffset.y,
    };

    (payload as any).noteType = this.newNoteType;

    create1(this.http, API_URL, { boardId: this.boardId, body: payload }).subscribe({
      next: (res) => {
        if (res.body) {
          const newNote: NoteWithUI = {
            ...res.body,
            rotation: this.getRandomRotation(),
            zIndex: ++this.maxZIndex,
            noteType: this.newNoteType,
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

    const payload: NoteRequestDto = {
      content: note.content,
      positionX: note.positionX,
      positionY: note.positionY,
      color: note.color,
    };
    (payload as any).noteType = note.noteType;

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

  private replaceNote(updated: NoteResponseDto) {
    const index = this.notes.findIndex((n) => n.id === updated.id);
    if (index !== -1) {
      this.notes[index] = {
        ...updated,
        rotation: this.notes[index].rotation,
        zIndex: this.notes[index].zIndex,
        noteType: this.notes[index].noteType,
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
    if (!this.linkMode && !this.draggingNote) {
      this.selectedNoteId = null;
      this.editingNoteId = null;
      this.cd.detectChanges();
    }
  }

  /* =========================
     LINKS CRUD - IMPROVED
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
      // Clicked same note, deselect
      this.linkFromNoteId = null;
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

    // Add string color if your API supports it
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
      input.value = ""; // Reset to allow same file selection
      input.click();
    }
  }

  uploadNoteImage(event: Event, noteId: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.error("Invalid file type");
      return;
    }

    uploadImage(this.http, API_URL, { boardId: this.boardId, noteId, body: { file } }).subscribe({
      next: (res) => {
        if (res.body) {
          // Update the note with new image URL
          const noteIndex = this.notes.findIndex((n) => n.id === noteId);
          if (noteIndex !== -1) {
            this.notes[noteIndex] = {
              ...this.notes[noteIndex],
              ...res.body,
              imageUrl: res.body.imageUrl, // Ensure imageUrl is set
            };
          }
        }
        this.cd.detectChanges();
      },
      error: (err) => console.error("Error uploading image:", err),
    });
  }

  // Get proper image URL (handle relative URLs)
  getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${API_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }

  /* =========================
     NATIVE DRAG - MORE EFFICIENT
  ========================= */

  onNoteMouseDown(event: MouseEvent, note: NoteWithUI): void {
    if (event.button !== 0) return; // Only left click
    if (this.editingNoteId === note.id) return; // Don't drag while editing

    event.preventDefault();
    event.stopPropagation();

    if (this.linkMode) {
      this.noteClickedForLink(note.id!);
      return;
    }

    this.draggingNote = note;
    note.isDragging = true;
    note.zIndex = ++this.maxZIndex;
    this.selectedNoteId = note.id!;

    // Calculate offset from mouse to note position
    this.dragOffset = {
      x: event.clientX - (note.positionX || 0) - this.panOffset.x,
      y: event.clientY - (note.positionY || 0) - this.panOffset.y,
    };

    this.cd.detectChanges();
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.draggingNote) {
      // Update note position directly - run outside Angular for performance
      this.ngZone.runOutsideAngular(() => {
        const newX = event.clientX - this.dragOffset.x - this.panOffset.x;
        const newY = event.clientY - this.dragOffset.y - this.panOffset.y;

        this.draggingNote!.positionX = Math.max(0, newX);
        this.draggingNote!.positionY = Math.max(0, newY);

        // Use requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
          this.cd.detectChanges();
        });
      });
    } else if (this.isPanning) {
      const dx = event.clientX - this.lastPanPoint.x;
      const dy = event.clientY - this.lastPanPoint.y;
      this.panOffset.x += dx;
      this.panOffset.y += dy;
      this.lastPanPoint = { x: event.clientX, y: event.clientY };
      this.cd.detectChanges();
    }
  }

  private onMouseUp(event: MouseEvent): void {
    if (this.draggingNote) {
      const note = this.draggingNote;
      note.isDragging = false;
      this.draggingNote = null;

      // Save position to server
      this.updateNote(note);
      this.cd.detectChanges();
    }
    this.isPanning = false;
  }

  /* =========================
     BOARD PANNING
  ========================= */

  onBoardMouseDown(event: MouseEvent): void {
    // Only pan with middle mouse button or shift+left click
    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      this.isPanning = true;
      this.lastPanPoint = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    }
  }

  /* =========================
     REGISTER NOTE ELEMENTS FOR LINKS
  ========================= */

  registerNoteElement(noteId: string, element: HTMLElement): void {
    this.noteElements.set(noteId, element);
  }

  /* =========================
     LINK PATH CALCULATIONS - IMPROVED
  ========================= */

  getNoteById(noteId: string): NoteWithUI | undefined {
    return this.notes.find((n) => n.id === noteId);
  }

  // Get pin position (top center of card)
  getPinX(noteId?: string): number {
    const note = noteId ? this.getNoteById(noteId) : undefined;
    if (!note) return 0;
    const width = this.getNoteWidth(note);
    return (note.positionX || 0) + width / 2 + this.panOffset.x;
  }

  getPinY(noteId?: string): number {
    const note = noteId ? this.getNoteById(noteId) : undefined;
    if (!note) return 0;
    return (note.positionY || 0) + 8 + this.panOffset.y; // Pin is 8px from top
  }

  getNoteWidth(note: NoteWithUI): number {
    switch (note.noteType) {
      case "photo":
        return 180;
      case "document":
        return 220;
      case "clipping":
        return 200;
      case "label":
        return 120;
      default:
        return 200;
    }
  }

  // Curved path with natural sag
  getLinkPath(link: LinkResponse): string {
    const x1 = this.getPinX(link.fromNoteId);
    const y1 = this.getPinY(link.fromNoteId);
    const x2 = this.getPinX(link.toNoteId);
    const y2 = this.getPinY(link.toNoteId);

    if (x1 === 0 && y1 === 0) return "";
    if (x2 === 0 && y2 === 0) return "";

    // Calculate distance and sag
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const sag = Math.min(distance * 0.12, 40);

    // Control point for quadratic curve (below midpoint for sag)
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 + sag;

    return `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
  }

  // Get string color
  getStringColor(link: LinkResponse): string {
    const color = (link as any).color || "red";
    const colorConfig = this.STRING_COLORS.find((c) => c.value === color);
    return colorConfig?.hex || "#8b0000";
  }

  // Get sticky note color class
  getStickyColorClass(color: string): string {
    const colorConfig = this.STICKY_COLORS.find((c) => c.value === color);
    return colorConfig?.class || "sticky-yellow";
  }

  /* =========================
     CHANGE NOTE COLOR
  ========================= */

  changeNoteColor(note: NoteWithUI, color: string, event?: Event): void {
    if (event) event.stopPropagation();
    note.color = color;
    this.updateNote(note);
  }

  /* =========================
     TRACKBY FUNCTIONS
  ========================= */

  trackByNoteId(index: number, note: NoteWithUI): string {
    return note.id || index.toString();
  }

  trackByLinkId(index: number, link: LinkResponse): string {
    return link.id || index.toString();
  }
}
