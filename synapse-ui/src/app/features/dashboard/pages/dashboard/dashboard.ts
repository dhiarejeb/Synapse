import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { BoardResponseDto, BoardRequestDto } from '../../../../services/models';
import { getBoards } from '../../../../services/fn/board-controller/get-boards';
import { delete$ } from '../../../../services/fn/board-controller/delete';
import { create } from '../../../../services/fn/board-controller/create';
import { patch} from '../../../../services/fn/board-controller/patch';
import {StrictHttpResponse} from '../../../../services/strict-http-response';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  boards: BoardResponseDto[] = [];
  loading = false;
  errorMessage = '';

  form: BoardRequestDto = { name: '', description: '' };
  editingBoardId: string | null = null;

  private apiUrl = 'http://localhost:8080'; // replace with your backend

  constructor(private http: HttpClient, private router: Router,private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
      this.fetchBoards();
    } else {
      console.warn('No token in localStorage yet; skipping fetchBoards');
    }
  }

  fetchBoards() {
    this.loading = true;
    getBoards(this.http, this.apiUrl).subscribe(res => {
      this.boards = res.body || [];
      this.loading = false;
      this.cd.detectChanges(); // force Angular to refresh view
    });
  }

  deleteBoard(id: string) {
    if (!confirm('Are you sure you want to delete this board?')) return;
    delete$(this.http, this.apiUrl, { id }).subscribe({
      next: () => this.fetchBoards(),
      error: (err) => console.error(err),
    });
  }

  editBoard(board: BoardResponseDto) {
    this.editingBoardId = board.id!;
    // Clone board data into form to prevent reference issues
    this.form = {
      name: board.name || '',
      description: board.description || '',

    };
  }

  cancelEdit() {
    this.editingBoardId = null;
    this.form = { name: '', description: '', };
  }

  saveBoard() {
    if (!this.form.name.trim()) return alert('Board name is required');

    // clone form for submission to avoid direct object mutation
    const body: BoardRequestDto = { ...this.form };

    if (this.editingBoardId) {
      // PATCH existing board
      patch(this.http, this.apiUrl, { id: this.editingBoardId, body }).subscribe({
        next: () => {
          this.cancelEdit();
          this.fetchBoards();
        },
        error: (err) => console.error(err),
      });
    } else {
      // POST new board
      create(this.http, this.apiUrl, { body }).subscribe({
        next: () => {
          this.cancelEdit();
          this.fetchBoards();
        },
        error: (err) => console.error(err),
      });
    }
  }

  goToBoard(id: string) {
    this.router.navigate(['/board', id]);
  }

  // trackBy for performance
  trackById(index: number, board: BoardResponseDto) {
    return board.id;
  }

  goToUser(): void {
    this.router.navigate(['/user']);
  }
}
