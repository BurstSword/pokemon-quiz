import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ShadowQuizPage } from './shadow-quiz.page';

describe('ShadowQuizPage', () => {
  let component: ShadowQuizPage;
  let fixture: ComponentFixture<ShadowQuizPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShadowQuizPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ShadowQuizPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
