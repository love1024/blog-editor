import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorTiptapComponent } from './editor-tiptap.component';

describe('EditorTiptapComponent', () => {
  let component: EditorTiptapComponent;
  let fixture: ComponentFixture<EditorTiptapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorTiptapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorTiptapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
