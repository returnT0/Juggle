import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  showAboutText = false;

  ngOnInit() {
  }

  handleTextClick() {
    const textElement = document.querySelector('.about-text');
    textElement?.classList.add('swipe-up');

    setTimeout(() => {
      this.showAboutText = true;
    }, 500);
  }

}
