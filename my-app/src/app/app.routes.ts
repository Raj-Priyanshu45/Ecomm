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
    path: 'seller/products',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/seller/product-list/product-list').then(
        (m) => m.ProductList
      ),
  },
  {
    path: 'seller/edit-product/:id',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/seller/edit-product/edit-product').then(
        (m) => m.EditProduct
      ),
  },
  {
    path: 'seller/image-manager/:id',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/seller/image-manager/image-manager').then(
        (m) => m.ImageManager
      ),
  },
  {
    path: 'vendor/register',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/vendor/register/vendor-register.component').then(
        (m) => m.VendorRegisterComponent
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
    path: 'admin/orders',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/admin/orders/admin-orders.component').then(
        (m) => m.AdminOrdersComponent
      ),
  },
  {
    path: 'seller/variants/:productId',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/seller/variant-manager/variant-manager').then(
        (m) => m.VariantManager
      ),
  },
  {
    path: 'products/tag/:slug',
    loadComponent: () =>
      import('./features/home/tag-products/tag-products').then(
        (m) => m.TagProducts
      ),
  },
  {
    path: 'support/orders',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/support/orders/support-orders').then(
        (m) => m.SupportOrders
      ),
  },
  {
    path: 'admin/warehouses',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/admin/warehouses/admin-warehouses').then(
        (m) => m.AdminWarehouses
      ),
  },
  {
    path: 'vendor/orders',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/vendor/orders/vendor-orders').then(
        (m) => m.VendorOrders
      ),
  },
  {
    path: 'profile/addresses',
    canActivate: [autoLoginPartialRoutesGuard],
    loadComponent: () =>
      import('./features/profile/address-book/address-book').then(
        (m) => m.AddressBook
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];