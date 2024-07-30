import { Component, OnInit, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editor-title',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './editor-title.component.html',
  styleUrl: './editor-title.component.scss',
})
export class EditorTitleComponent implements OnInit {
  title = '';
  readonly = input(false);
  focused = output();

  ngOnInit(): void {
    this.title = localStorage.getItem('TITLE') || '';
  }

  /**
   * Prevent any formatting on title by blocking
   * hot keys
   * @param e
   * @returns
   */
  onKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
        case 'i':
        case 'u':
          return false;
      }
    }
    return true;
  }

  /**
   * On title paste, only take the text part and
   * ignore the HTML such as h1, h2, etc.
   * @param e
   */
  onTitlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain');
    this.title = text ?? '';
  }

  /**
   * On title text content change, assign it to the title
   * model
   */
  onTitleInput(e: Event): void {
    e.preventDefault();
    this.title = (e.target as HTMLDivElement).textContent ?? '';

    localStorage.setItem('TITLE', this.title);
  }

  onFocus(): void {
    this.focused.emit();
  }
}
