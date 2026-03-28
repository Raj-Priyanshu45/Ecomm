import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vendor-orders',
  standalone: true,
  imports: [],
  template: ``
})
export class VendorOrders implements OnInit {
  private router = inject(Router);

  ngOnInit() {
    // Vendor orders are fully managed from the vendor dashboard
    this.router.navigate(['/vendor/dashboard']);
  }
}
