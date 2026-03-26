import { Routes } from '@angular/router';
import { autoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

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
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
  },
  {
    path: 'my-orders',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/my-orders/my-orders.component').then(
        (m) => m.MyOrdersComponent
      ),
  },
  {
    path: 'seller/add-product',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/seller/add-product/add-product.component').then(
        (m) => m.AddProductComponent
      ),
  },
  {
    path: 'vendor/dashboard',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/vendor/dashboard/vendor-dashboard.component').then(
        (m) => m.VendorDashboardComponent
      ),
  },
  {
    path: 'admin/vendors',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/admin/vendor-management/admin-vendors.component').then(
        (m) => m.AdminVendorsComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];