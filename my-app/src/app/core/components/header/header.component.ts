import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { CartService } from '../../../features/cart/cart.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, AsyncPipe],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
  private oidc = inject(OidcSecurityService);
  private router = inject(Router);
  cartService = inject(CartService);

  isAuthenticated = false;
  username = '';
  roles: string[] = [];
  mobileMenuOpen = false;

  ngOnInit(): void {
    this.oidc.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;
      if (isAuthenticated) {
        this.cartService.getCart().subscribe();
      }
    });

    this.oidc.userData$.subscribe(({ userData }) => {
      if (userData) {
        this.username = userData['preferred_username'] ?? userData['email'] ?? '';
      }
    });

    this.oidc.getPayloadFromAccessToken().subscribe((payload: any) => {
      this.roles =
        payload?.realm_access?.roles?.map((r: string) => r.toUpperCase()) ?? [];
    });
  }

  hasRole(role: string): boolean {
    return this.roles.includes(role.toUpperCase());
  }

  login(): void {
    this.oidc.authorize();
  }

  logout(): void {
    this.oidc.logoff().subscribe();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}