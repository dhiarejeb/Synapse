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
const COLORS = ['purple', 'yellow', 'green', 'blue', 'pink'];

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

  notes: NoteResponseDto[] = [];
  links: LinkResponse[] = [];
  newNoteColor = COLORS[0];

  loadingBoard = false;
  loadingNotes = false;
  loadingLinks = false;
  errorBoard?: string;
  errorNotes?: string;
  errorLinks?: string;

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
      complete: () => (this.loadingBoard = false)
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
      complete: () => (this.loadingNotes = false)
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
      complete: () => (this.loadingLinks = false)
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
    const payload: NoteRequestDto = {
      content: note.content,
      positionX: note.positionX,
      positionY: note.positionY,
      color: note.color,
    };

    patch1(this.http, API_URL, { boardId: this.boardId, noteId: note.id!, body: payload }).subscribe({
      next: res => {
        if (res.body) {
          const index = this.notes.findIndex(n => n.id === res.body!.id);
          if (index !== -1) this.notes[index] = res.body!;
        }
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

  createLink(payload: CreateLinkRequest): void {
    createLink(this.http, API_URL, { boardId: this.boardId, body: payload }).subscribe({
      next: res => {
        if (res.body) this.links.push(res.body);
        this.cd.detectChanges();
      },
      error: err => console.error('Error creating link:', err)
    });
  }

  updateLink(linkId: string, payload: UpdateLinkRequest): void {
    patchLink(this.http, API_URL, { boardId: this.boardId, linkId, body: payload }).subscribe({
      next: res => {
        if (res.body) this.replaceLink(res.body);
        this.cd.detectChanges();
      },
      error: err => console.error('Error updating link:', err)
    });
  }

  deleteLink(linkId: string): void {
    deleteLink(this.http, API_URL, { boardId: this.boardId, linkId }).subscribe({
      next: () => {
        this.links = this.links.filter(l => l.id !== linkId);
        this.cd.detectChanges();
      },
      error: err => console.error('Error deleting link:', err)
    });
  }

  private replaceLink(updated: LinkResponse) {
    const index = this.links.findIndex(l => l.id === updated.id);
    if (index !== -1) this.links[index] = updated;
  }

  /* =========================
   UPLOAD IMAGE FOR NOTE
   ========================= */
  uploadNoteImage(event: Event, noteId: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    uploadImage(this.http, API_URL, { boardId: this.boardId, noteId, body: { file } }).subscribe({
      next: res => {
        if (res.body) {
          const index = this.notes.findIndex(n => n.id === res.body!.id);
          if (index !== -1) this.notes[index] = res.body!;
        }
        this.cd.detectChanges();
      },
      error: err => console.error('Error uploading image:', err),
    });
  }


  /* =========================
    DRAG NOTE
 ========================= */
  dragEnded(event: CdkDragEnd, note: NoteResponseDto): void {
    const pos = event.source.getFreeDragPosition();
    note.positionX = pos.x;
    note.positionY = pos.y;
    this.updateNote(note); // update backend with new position
  }

}



