import { Component, input } from '@angular/core';

export type TopEntityRow = { id: string; name: string; count: number };

@Component({
  selector: 'app-top-entity-list',
  templateUrl: './top-entity-list.html',
  styleUrl: './top-entity-list.scss',
})
export class TopEntityList {
  readonly title = input.required<string>();
  readonly rows = input.required<TopEntityRow[]>();
}
