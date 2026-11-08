import { Component } from '@angular/core';

@Component({
  selector: 'app-brand',
  template: `
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 29V15" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      <path d="M16 16C16 10 11.5 6.5 5 6.5 5 12.5 9 16 16 16Z" fill="currentColor" />
      <path d="M16 13C16 8 20 4.5 27 4.5 27 10 23 13 16 13Z" fill="var(--ag-marigold)" />
    </svg>
    <span class="name">Agro Nova</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
    }
    .name {
      font-family: var(--ag-font-display);
      font-size: 1.35rem;
    }
  `,
})
export class Brand {}