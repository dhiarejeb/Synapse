import {ChangeDetectorRef, Component, OnInit} from '@angular/core';


import { ActivatedRoute } from '@angular/router';
import {BoardResponseDto} from '../../../../services/models/board-response-dto';
import {NoteResponseDto} from '../../../../services/models/note-response-dto';
import {LinkResponse} from '../../../../services/models/link-response';
import {HttpClient} from '@angular/common/http';
import { getById } from '../../../../services/fn/board-controller/get-by-id';
import { getNotes } from '../../../../services/fn/note-controller/get-notes';
import { create1 } from '../../../../services/fn/note-controller/create-1';
import { delete1 } from '../../../../services/fn/note-controller/delete-1';
import { patch1 } from '../../../../services/fn/note-controller/patch-1';
import { getLinkById } from '../../../../services/fn/link-controller/get-link-by-id';
import { getBoardLinks } from '../../../../services/fn/link-controller/get-board-links';
import { deleteLink } from '../../../../services/fn/link-controller/delete-link';
import { patchLink } from '../../../../services/fn/link-controller/patch-link';
import { createLink } from '../../../../services/fn/link-controller/create-link';
import {NoteRequestDto} from '../../../../services/models/note-request-dto';
import {CreateLinkRequest} from '../../../../services/models/create-link-request';
import {UpdateLinkRequest} from '../../../../services/models/update-link-request';
import {CommonModule} from '@angular/common';
import {CdkDragEnd, DragDropModule} from '@angular/cdk/drag-drop';
import {uploadImage} from '../../../../services/fn/note-controller/upload-image';
import {FormsModule} from '@angular/forms';




const API_URL = 'http://localhost:8080';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './board.html',
  styleUrls: ['./board.scss'],
})
export class BoardPage implements OnInit {
  boardId!: string;
  board?: BoardResponseDto;

  COLORS = ['purple', 'yellow', 'green', 'blue', 'pink'];
  newNoteColor = this.COLORS[0];

  notes: NoteResponseDto[] = [];
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
        this.notes = res.body ?? [];
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
     NOTES CRUD
  ========================= */

  createNote(): void {
    const payload: NoteRequestDto = {
      color: this.newNoteColor,
      content: '',
      positionX: 50,
      positionY: 50,
    };

    create1(this.http, API_URL, { boardId: this.boardId, body: payload }).subscribe({
      next: res => {
        if (res.body) this.notes.push(res.body);
        this.cd.detectChanges();
      },
      error: err => console.error('Error creating note:', err),
    });
  }

  updateNote(note: NoteResponseDto): void {
    if (!note.id) return;

    const payload: NoteRequestDto = {
      content: note.content,
      positionX: note.positionX,
      positionY: note.positionY,
      color: note.color,
    };

    patch1(this.http, API_URL, { boardId: this.boardId, noteId: note.id, body: payload }).subscribe({
      next: res => {
        if (res.body) this.replaceNote(res.body);
        this.cd.detectChanges();
      },
      error: err => console.error('Error updating note:', err),
    });
  }

  deleteNote(noteId: string): void {
    delete1(this.http, API_URL, { boardId: this.boardId, noteId }).subscribe({
      next: () => {
        this.notes = this.notes.filter(n => n.id !== noteId);
        this.cd.detectChanges();
      },
      error: err => console.error('Error deleting note:', err),
    });
  }

  private replaceNote(updated: NoteResponseDto) {
    const index = this.notes.findIndex(n => n.id === updated.id);
    if (index !== -1) this.notes[index] = updated;
  }

  /* =========================
     LINKS CRUD
  ========================= */

  toggleLinkMode(noteId?: string) {
    this.linkMode = !this.linkMode;
    if (this.linkMode && noteId) this.linkFromNoteId = noteId;
    else this.linkFromNoteId = null;
  }

  noteClickedForLink(noteId: string) {
    if (!this.linkMode) return;

    if (!this.linkFromNoteId) {
      this.linkFromNoteId = noteId;
    } else if (this.linkFromNoteId !== noteId) {
      this.createLinkTo(noteId);
    }
  }

  createLinkTo(noteToId: string) {
    if (!this.linkFromNoteId) return;

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

  deleteLinkById(linkId: string) {
    deleteLink(this.http, API_URL, { boardId: this.boardId, linkId }).subscribe({
      next: () => {
        this.links = this.links.filter(l => l.id !== linkId);
        this.cd.detectChanges();
      },
      error: err => console.error('Error deleting link:', err),
    });
  }

  updateLink(linkId: string, newToNoteId: string) {
    const payload: UpdateLinkRequest = { toNoteId: newToNoteId };
    patchLink(this.http, API_URL, { boardId: this.boardId, linkId, body: payload }).subscribe({
      next: res => {
        if (res.body) this.replaceLink(res.body);
        this.cd.detectChanges();
      },
      error: err => console.error('Error updating link:', err),
    });
  }

  private replaceLink(updated: LinkResponse) {
    const index = this.links.findIndex(l => l.id === updated.id);
    if (index !== -1) this.links[index] = updated;
  }

  /* =========================
     UPLOAD IMAGE
  ========================= */
  uploadNoteImage(event: Event, noteId: string) {
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
  dragEnded(event: CdkDragEnd, note: NoteResponseDto) {
    const pos = event.source.getFreeDragPosition();
    note.positionX = pos.x;
    note.positionY = pos.y;
    this.updateNote(note);
  }

  /* =========================
     HELPER
  ========================= */
  getNoteById(noteId: string): NoteResponseDto | undefined {
    return this.notes.find(n => n.id === noteId);
  }

  // Returns the X position center of a note, or 0 if note not found
  getNoteCenterX(noteId?: string): number {
    const note = noteId ? this.getNoteById(noteId) : undefined;
    // @ts-ignore
    return note ? note.positionX + 90 : 0; // 90 = half of note width
  }

  getNoteCenterY(noteId?: string): number {
    const note = noteId ? this.getNoteById(noteId) : undefined;
    // @ts-ignore
    return note ? note.positionY + 60 : 0; // 60 = half of note height
  }
}



