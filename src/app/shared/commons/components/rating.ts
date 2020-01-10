import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-rating',
  template: `
    <div class="rating">
      <span title="Rocks!" (click)='onClick($event, 5)' class="{{rating>=5?'checked':''}} {{!readonly?'enabled':''}}"></span>

      <span title="Pretty good" (click)='onClick($event, 4)' class="{{rating>=4?'checked':''}} {{!readonly?'enabled':''}}"></span>

      <span title="Meh" (click)='onClick($event, 3)'  class="{{rating>=3?'checked':''}} {{!readonly?'enabled':''}}"></span>

      <span title="Kinda bad" (click)='onClick($event, 2)' class="{{rating>=2?'checked':''}} {{!readonly?'enabled':''}}"></span>

      <span title="Sucks big time" (click)='onClick($event, 1)' class="{{rating>=1?'checked':''}} {{!readonly?'enabled':''}}"></span>
    </div>

  `
})
export class RatingComponent implements OnInit {
  @Input() rating = 0;
  @Input() itemId: number;
  @Input() readonly = false;
  @Output() ratingClick: EventEmitter<any> = new EventEmitter<any>();
  inputName: string;

  ngOnInit() {
    this.inputName = this.itemId + '_rating';
  }

  onClick(event, rating: number): void {
    if (this.readonly) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    this.rating = rating * 1;
    this.ratingClick.emit({
      itemId: this.itemId,
      rating: rating
    });
  }
}
