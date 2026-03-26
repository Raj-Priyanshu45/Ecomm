import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [],
  template: `
    <div class="flex items-center gap-0.5">
      @for (star of stars; track $index) {
        <svg
          [class]="$index < filledStars ? 'text-yellow-400' : 'text-gray-200'"
          class="w-4 h-4 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      }
      @if (showCount) {
        <span class="ml-1 text-xs text-gray-500">({{ count }})</span>
      }
    </div>
  `,
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() count = 0;
  @Input() showCount = true;

  stars = [1, 2, 3, 4, 5];
  get filledStars(): number {
    return Math.round(this.rating);
  }
}