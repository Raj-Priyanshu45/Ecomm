import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddressService, Address, AddressRequest } from '../../../services/address.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const INDIAN_STATES = [
  'ANDHRA_PRADESH','ARUNACHAL_PRADESH','ASSAM','BIHAR','CHHATTISGARH','GOA',
  'GUJARAT','HARYANA','HIMACHAL_PRADESH','JHARKHAND','KARNATAKA','KERALA',
  'MADHYA_PRADESH','MAHARASHTRA','MANIPUR','MEGHALAYA','MIZORAM','NAGALAND',
  'ODISHA','PUNJAB','RAJASTHAN','SIKKIM','TAMIL_NADU','TELANGANA','TRIPURA',
  'UTTAR_PRADESH','UTTARAKHAND','WEST_BENGAL','DELHI','JAMMU_AND_KASHMIR',
  'LADAKH','CHANDIGARH','PUDUCHERRY','ANDAMAN_AND_NICOBAR',
  'DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU','LAKSHADWEEP'
];

@Component({
  selector: 'app-address-book',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './address-book.html'
})
export class AddressBook implements OnInit {
  private addressService = inject(AddressService);
  
  addresses: Address[] = [];
  loading = true;
  showForm = false;
  submitting = false;
  editingId: number | null = null;
  errorMsg = '';

  // Confirm Dialog State
  showConfirmDialog = false;
  addressToDeleteId: number | null = null;

  stateOptions = INDIAN_STATES.map((s) => ({
    value: s,
    label: s.split('_').join(' ')
  }));

  form: AddressRequest = {
    name: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  };

  get isEditing(): boolean {
    return this.editingId !== null;
  }

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    this.loading = true;
    this.errorMsg = '';
    this.addressService.getAddresses().subscribe({
      next: (res) => {
        this.addresses = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Failed to load addresses';
      }
    });
  }

  openAddForm() {
    this.editingId = null;
    this.resetForm();
    this.errorMsg = '';
    this.showForm = true;
  }

  startEdit(addr: Address) {
    this.editingId = addr.id;
    this.errorMsg = '';
    this.form = {
      name: addr.name,
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      phone: addr.phone || ''
    };
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.errorMsg = '';
    this.resetForm();
  }

  saveAddress() {
    this.errorMsg = '';
    if (!this.form.name || !this.form.addressLine || !this.form.city || !this.form.state || !this.form.pincode) {
      this.errorMsg = 'Please fill out all required fields';
      return;
    }

    this.submitting = true;

    if (this.isEditing) {
      this.addressService.updateAddress(this.editingId!, this.form).subscribe({
        next: () => {
          this.submitting = false;
          this.showForm = false;
          this.editingId = null;
          this.resetForm();
          this.loadAddresses();
        },
        error: (err) => {
          this.submitting = false;
          this.errorMsg = 'Failed to update address: ' + (err.error?.message || err.message);
        }
      });
    } else {
      this.addressService.addAddress(this.form).subscribe({
        next: () => {
          this.submitting = false;
          this.showForm = false;
          this.resetForm();
          this.loadAddresses();
        },
        error: (err) => {
          this.submitting = false;
          this.errorMsg = 'Failed to save address: ' + (err.error?.message || err.message);
        }
      });
    }
  }

  confirmDelete(id: number) {
    this.addressToDeleteId = id;
    this.showConfirmDialog = true;
  }

  cancelDelete() {
    this.showConfirmDialog = false;
    this.addressToDeleteId = null;
  }

  executeDelete() {
    if (this.addressToDeleteId === null) return;
    
    this.addressService.deleteAddress(this.addressToDeleteId).subscribe({
      next: () => {
        this.showConfirmDialog = false;
        this.addressToDeleteId = null;
        this.loadAddresses();
      },
      error: () => {
        this.showConfirmDialog = false;
        this.errorMsg = 'Failed to delete address';
      }
    });
  }

  setDefault(id: number) {
    this.addressService.setDefault(id).subscribe({
      next: () => this.loadAddresses(),
      error: () => {
        this.errorMsg = 'Failed to set default address';
      }
    });
  }

  resetForm() {
    this.form = { name: '', addressLine: '', city: '', state: '', pincode: '', phone: '' };
  }
}

