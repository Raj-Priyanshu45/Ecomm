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

        // Parse roles from access token AFTER authentication is confirmed
        this.oidc.getAccessToken().subscribe((token) => {
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              // Extract roles from resource_access (client roles) + realm_access
              const clientRoles: string[] = [
                ...(payload?.resource_access?.['back-end']?.roles ?? []),
                ...(payload?.resource_access?.['angular-client']?.roles ?? []),
              ];
              const realmRoles: string[] = payload?.realm_access?.roles ?? [];
              const allRoles = [...new Set([...clientRoles, ...realmRoles])];
              this.roles = allRoles.map((r: string) => r.toUpperCase());
            } catch (e) {
              this.roles = [];
            }
          }
        });
      } else {
        this.roles = [];
      }
    });

    this.oidc.userData$.subscribe(({ userData }) => {
      if (userData) {
        this.username =
          userData['preferred_username'] ?? userData['email'] ?? '';
      }
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