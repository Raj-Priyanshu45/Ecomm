import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AddToCartRequest, CartResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080';

  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$: Observable<number> = this.cartCountSubject.asObservable();

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.baseUrl}/api/cart`).pipe(
      tap((cart) => this.cartCountSubject.next(cart.totalItemCount))
    );
  }

  addItem(req: AddToCartRequest): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.baseUrl}/api/cart/items`, req).pipe(
      tap((cart) => this.cartCountSubject.next(cart.totalItemCount))
    );
  }

  updateItem(cartItemId: number, quantity: number): Observable<CartResponse> {
    return this.http
      .put<CartResponse>(`${this.baseUrl}/api/cart/items/${cartItemId}`, { quantity })
      .pipe(tap((cart) => this.cartCountSubject.next(cart.totalItemCount)));
  }

  removeItem(cartItemId: number): Observable<CartResponse> {
    return this.http
      .delete<CartResponse>(`${this.baseUrl}/api/cart/items/${cartItemId}`)
      .pipe(tap((cart) => this.cartCountSubject.next(cart.totalItemCount)));
  }

  clearCart(): Observable<unknown> {
    return this.http
      .delete(`${this.baseUrl}/api/cart`)
      .pipe(tap(() => this.cartCountSubject.next(0)));
  }

  setCount(count: number): void {
    this.cartCountSubject.next(count);
  }
}