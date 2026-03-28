import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Address {
  id: number;
  name: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export interface AddressRequest {
  name: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class AddressService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/users/me/addresses';

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(this.baseUrl);
  }

  addAddress(address: AddressRequest): Observable<Address> {
    return this.http.post<Address>(this.baseUrl, address);
  }

  updateAddress(id: number, address: AddressRequest): Observable<Address> {
    return this.http.put<Address>(`${this.baseUrl}/${id}`, address);
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  setDefault(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/default`, {});
  }
}
