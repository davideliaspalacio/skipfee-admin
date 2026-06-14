import { request, requestMultipart } from './client';
import type { Product } from '../data';

export async function fetchProducts(): Promise<Product[]> {
  const { products } = await request<{ ok: true; products: Product[] }>('/api/products');
  return products;
}

export interface CreateProductBody {
  name: string;
  price: number;
  cat: string;
  available?: boolean;
  img?: string;
  /** Texto opcional que se muestra debajo del nombre tanto en el admin
   *  como en el menú del cliente. */
  description?: string | null;
}

export async function createProduct(body: CreateProductBody): Promise<Product> {
  const { product } = await request<{ ok: true; product: Product }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return product;
}

/**
 * PATCH parcial. Cualquier subset de los campos editables del producto.
 * `available`, `name`, `price` ya estaban; `cat`, `img`, `sold` agregados
 * para soportar el modo "Editar producto" del Catálogo.
 */
export interface PatchProductBody {
  available?: boolean;
  price?: number;
  name?: string;
  cat?: string;
  img?: string;
  sold?: number;
  /** `null` borra la descripción explícitamente. */
  description?: string | null;
}

export async function patchProduct(productId: string, body: PatchProductBody): Promise<Product> {
  const { product } = await request<{ ok: true; product: Product }>(
    `/api/products/${productId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
  return product;
}

export async function deleteProduct(productId: string): Promise<void> {
  await request<{ ok: true }>(`/api/products/${productId}`, { method: 'DELETE' });
}

/**
 * Sube el archivo al bucket de Storage del backend. Devuelve el producto
 * con `img` ya actualizado a la URL pública del bucket.
 */
export async function uploadProductImage(productId: string, file: File): Promise<Product> {
  const form = new FormData();
  form.append('file', file);
  const { product } = await requestMultipart<{ ok: true; product: Product; url: string }>(
    `/api/products/${productId}/image`,
    form,
  );
  return product;
}
