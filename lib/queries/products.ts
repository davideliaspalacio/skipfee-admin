import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchProducts,
  patchProduct,
  createProduct,
  deleteProduct,
  uploadProductImage,
  type CreateProductBody,
  type PatchProductBody,
} from '../api';
import type { Product } from '../data';
import { productKeys } from './keys';
import { pushToast } from '../toast';

const PRODUCTS_POLL_MS = 10_000;

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: productKeys.list(),
    queryFn: () => fetchProducts(),
    refetchInterval: PRODUCTS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

// Helpers locales: actualizan el cache de la lista inmediatamente con la
// respuesta de la mutación. Sin esto la UI espera al siguiente refetch, y el
// polling cada 10s puede llegar a "pisar" el PATCH local antes de que el
// invalidate dispare un GET nuevo — el síntoma clásico: "editar producto
// solo sale cuando recargo y se quita".
function replaceProductInCache(
  qc: ReturnType<typeof useQueryClient>,
  updated: Product,
) {
  qc.setQueryData<Product[]>(productKeys.list(), prev =>
    prev ? prev.map(p => (p.id === updated.id ? updated : p)) : prev,
  );
}

function addProductToCache(
  qc: ReturnType<typeof useQueryClient>,
  created: Product,
) {
  qc.setQueryData<Product[]>(productKeys.list(), prev =>
    prev ? [created, ...prev] : [created],
  );
}

function removeProductFromCache(
  qc: ReturnType<typeof useQueryClient>,
  productId: string,
) {
  qc.setQueryData<Product[]>(productKeys.list(), prev =>
    prev ? prev.filter(p => p.id !== productId) : prev,
  );
}

export function usePatchProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, body }: { productId: string; body: PatchProductBody }) =>
      patchProduct(productId, body),
    onSuccess: updated => {
      replaceProductInCache(qc, updated);
      qc.invalidateQueries({ queryKey: productKeys.list() });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo actualizar el producto: ${err.message}` });
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductBody) => createProduct(body),
    onSuccess: created => {
      addProductToCache(qc, created);
      qc.invalidateQueries({ queryKey: productKeys.list() });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo crear el producto: ${err.message}` });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: (_void, productId) => {
      removeProductFromCache(qc, productId);
      qc.invalidateQueries({ queryKey: productKeys.list() });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo eliminar el producto: ${err.message}` });
    },
  });
}

/**
 * Sube imagen del producto. El backend la guarda en Storage y patchea
 * `products.img` con la URL pública. Devuelve el producto actualizado.
 */
export function useUploadProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) =>
      uploadProductImage(productId, file),
    onSuccess: updated => {
      replaceProductInCache(qc, updated);
      qc.invalidateQueries({ queryKey: productKeys.list() });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo subir la imagen: ${err.message}` });
    },
  });
}
