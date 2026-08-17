import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PageHeaderService } from './core/services/page-header.service';

type NavIcon = 'home' | 'new' | 'signals' | 'summarize' | 'stats' | 'more';
type NavItem = { path: string; label: string; icon: NavIcon; exact: boolean };

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly page = inject(PageHeaderService);
  private readonly router = inject(Router);

  protected readonly navItems: NavItem[] = [
    { path: '/', label: 'Inicio', icon: 'home', exact: true },
    { path: '/dreams/new', label: 'Nuevo sueño', icon: 'new', exact: false },
    { path: '/signals', label: 'Signals', icon: 'signals', exact: false },
    { path: '/summarize', label: 'Resumen IA', icon: 'summarize', exact: false },
    { path: '/stats', label: 'Estadísticas', icon: 'stats', exact: false },
    { path: '/more', label: 'Más', icon: 'more', exact: false },
  ];

  protected goBack(): void {
    this.router.navigate(this.page.backPath());
  }
}
