import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CluesPage } from './clues.page';

describe('CluesPage', () => {
  let component: CluesPage;
  let fixture: ComponentFixture<CluesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CluesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
