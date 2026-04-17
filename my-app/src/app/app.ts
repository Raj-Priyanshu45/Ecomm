import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { HeaderComponent } from './core/components/header/header.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ToastComponent],
  template: `
    <app-header />
    <main>
      <router-outlet />
    </main>
    <app-toast />
  `,
  styles: [`
    main { min-height: calc(100vh - 64px); background: #020617; }
  `],
})
export class App implements OnInit {
  private oidc = inject(OidcSecurityService);

  ngOnInit(): void {
    this.oidc.checkAuth().subscribe();
  }
}