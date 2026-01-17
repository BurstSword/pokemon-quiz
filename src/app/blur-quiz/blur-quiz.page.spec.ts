import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { BlurQuizPage } from './blur-quiz.page';

describe('BlurQuizPage', () => {
  let component: BlurQuizPage;
  let fixture: ComponentFixture<BlurQuizPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BlurQuizPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(BlurQuizPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
