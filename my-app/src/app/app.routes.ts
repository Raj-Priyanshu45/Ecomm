import { Routes } from '@angular/router';
import { authGuardFn } from 'angular-auth-oidc-client';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },
  {
    path: 'cart',
    canActivate: [authGuardFn],
    loadComponent: () =>
      import('./features/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuardFn],
    loadComponent: () =>
      import('./features/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
  },
  {
    path: 'my-orders',
    canActivate: [authGuardFn],
    loadComponent: () =>
      import('./features/my-orders/my-orders.component').then(
        (m) => m.MyOrdersComponent
      ),
  },
  {
    path: 'seller/add-product',
    canActivate: [authGuardFn],
    loadComponent: () =>
      import('./features/seller/add-product/add-product.component').then(
        (m) => m.AddProductComponent
      ),
  },
  {
    path: 'vendor/dashboard',
    canActivate: [authGuardFn],
    loadComponent: () =>
      import('./features/vendor/vendor-dashboard/vendor-dashboard.component').then(
        (m) => m.VendorDashboardComponent
      ),
  },
  {
    path: 'admin/vendors',
    canActivate: [authGuardFn],
    loadComponent: () =>
      import('./features/admin/admin-vendors/admin-vendors.component').then(
        (m) => m.AdminVendorsComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];