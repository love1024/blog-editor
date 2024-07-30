import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorTitleComponent } from './editor-title.component';

describe('EditorTitleComponent', () => {
  let component: EditorTitleComponent;
  let fixture: ComponentFixture<EditorTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorTitleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
