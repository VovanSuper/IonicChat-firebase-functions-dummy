import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatingComponent } from './components/rating';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    RatingComponent
  ],
  declarations: [
    RatingComponent
  ]
})
export class CommonsCmpsModule { }