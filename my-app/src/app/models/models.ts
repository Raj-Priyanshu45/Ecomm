export interface Tags {
  id: number;
  name: string;
  slug: string;
}

export interface AllProductResponse {
  id: number;
  name: string;
  shortDesc: string;
  imageUrl: string;
  price: number;
  inStock: boolean;
  tags: Tags[];
  rating: number;
  reviewCount: number;
}

export interface ApiResponse<T> {
  products: T[];
  size: number;
  page: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface SingleProductResponse {
  name: string;
  description: string;
  sellerId: string;
  addedAt: string;
  modifiedAt: string;
  tags: Tags[];
  imageUrl: string[];
  varients: { [key: string]: string[] };
}

export interface CartItemResponse {
  cartItemId: number;
  productId: number;
  productName: string;
  productImage: string;
  variantId: number | null;
  variantLabel: string | null;
  quantity: number;
  priceAtAddition: number;
  lineTotal: number;
}

export interface CartResponse {
  cartId: number;
  items: CartItemResponse[];
  totalItemCount: number;
  totalAmount: number;
}

export interface AddToCartRequest {
  productId: number;
  variantId?: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface ReviewResponse {
  reviewId: number;
  rating: number;
  comment: string;
  reviewerKeycloakId: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

export interface OrderItemResponse {
  orderItemId: number;
  productId: number;
  productName: string;
  variantId: number | null;
  skuCode: string;
  quantity: number;
  priceAtOrder: number;
  lineTotal: number;
}

export interface OrderResponse {
  orderId: number;
  status: string;
  totalAmount: number;
  shippingName: string;
  shippingAddressLine: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingPhone: string;
  warehouseId: number | null;
  warehouseName: string | null;
  paymentConfirmed: boolean;
  items: OrderItemResponse[];
  placedAt: string;
  updatedAt: string;
  deliveredAt: string | null;
}

export interface PlaceOrderRequest {
  shippingName: string;
  shippingAddressLine: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingPhone?: string;
}