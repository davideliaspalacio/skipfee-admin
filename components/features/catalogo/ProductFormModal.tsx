'use client';

import { useRef, useState, type DragEvent } from 'react';
import { COP, type Product } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { pushToast } from '@/lib/toast';
import styles from './catalogo.module.css';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface ProductFormDraft {
  name: string;
  price: number;
  cat: string;
  available: boolean;
  /** `null` borra la descripción explícitamente. */
  description: string | null;
  /** File nuevo a subir (multipart). null si el usuario no tocó la imagen. */
  imgFile: File | null;
  /** El usuario apretó "Quitar" sobre la imagen guardada → el padre PATCH `img:''`. */
  imgRemoved: boolean;
}

/**
 * Modal "Nuevo producto" / "Editar producto". El prop `editing` controla título,
 * copy del botón y prefill. La imagen se maneja como `imgFile` (File real a subir
 * por multipart) + `imgPreview` (data URL para vista previa local).
 */
export function ProductFormModal({
  editing,
  categories,
  submitting,
  onSave,
  onClose,
}: {
  editing: Product | null;
  categories: string[];
  submitting: boolean;
  onSave: (draft: ProductFormDraft) => void;
  onClose: () => void;
}) {
  const isEdit = !!editing;

  const [name, setName] = useState(editing?.name ?? '');
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [category, setCategory] = useState(editing?.cat ?? categories[0] ?? '');
  const [available, setAvailable] = useState(editing?.available ?? true);
  const [description, setDescription] = useState(editing?.description ?? '');
  const [imgPreview, setImgPreview] = useState<string | null>(editing?.img || null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgRemoved, setImgRemoved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const readFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      pushToast({ kind: 'error', message: 'Solo se aceptan imágenes (PNG, JPG, etc.).' });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      pushToast({ kind: 'error', message: 'La imagen pesa más de 5 MB.' });
      return;
    }
    setImgFile(file);
    setImgRemoved(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') setImgPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    readFile(e.dataTransfer.files?.[0]);
  };

  const removeImage = () => {
    setImgFile(null);
    setImgPreview(null);
    if (editing?.img) setImgRemoved(true);
  };

  const priceNum = parseInt(price.replace(/[^\d]/g, ''), 10);
  const canSave =
    !submitting &&
    name.trim().length > 0 &&
    !isNaN(priceNum) &&
    priceNum > 0 &&
    category.length > 0;

  const submit = () => {
    if (!canSave) return;
    const cleanDesc = description.trim();
    onSave({
      name: name.trim(),
      price: priceNum,
      cat: category,
      available,
      description: cleanDesc ? cleanDesc : null,
      imgFile,
      imgRemoved,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      sub={
        isEdit
          ? 'Cambia los datos del producto. La imagen se guarda en nuestro storage.'
          : 'Agrega un sándwich, bebida, postre o combo al catálogo.'
      }
      footer={
        <>
          <button type="button" className="btn btn-ghost sm" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary sm" onClick={submit} disabled={!canSave}>
            <Icon.Check size={14} />
            {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar producto'}
          </button>
        </>
      }
    >
      <div className={styles.form}>
        {/* Imagen — dropzone */}
        <Field label="Imagen del producto" hint="PNG o JPG hasta 5 MB. Se muestra en el menú del cliente.">
          <div
            className={`${styles.dropzone}${dragging ? ` ${styles.drag}` : ''}${imgPreview ? ` ${styles.hasImg}` : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => { if (!imgPreview) fileRef.current?.click(); }}
            role="button"
            tabIndex={imgPreview ? -1 : 0}
            aria-label="Imagen del producto"
            onKeyDown={(e) => {
              if (!imgPreview && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
          >
            {imgPreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgPreview} alt="Vista previa" className={styles.dzPreview} />
                <div className={styles.dzActions}>
                  <button
                    type="button"
                    className="btn btn-ghost sm"
                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                  >
                    <Icon.Edit size={13} />Cambiar
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost sm"
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                  >
                    <Icon.X size={13} />Quitar
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.dzEmpty}>
                <div className={styles.dzIcon}><Icon.Plus size={20} /></div>
                <b>Arrastra una imagen acá</b>
                <span>o <u>selecciona un archivo</u></span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => readFile(e.target.files?.[0])}
            />
          </div>
        </Field>

        <Field label="Nombre" htmlFor="cp-name" required>
          <input
            id="cp-name"
            className="input"
            placeholder="Ej. Pastrami Bros"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>

        <Field
          label={<>Descripción <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></>}
          htmlFor="cp-desc"
          hint="Se muestra debajo del nombre en el menú del cliente. Máx. 500 caracteres."
        >
          <textarea
            id="cp-desc"
            className="input"
            rows={2}
            maxLength={500}
            placeholder="Pastrami curado 7 días, mostaza dijon, pickles caseros en pan de centeno."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className={styles.formRow}>
          <Field
            label="Precio (COP)"
            htmlFor="cp-price"
            required
            hint={priceNum > 0 ? <span className={styles.priceHint}>{COP(priceNum)}</span> : undefined}
          >
            <input
              id="cp-price"
              className="input"
              inputMode="numeric"
              placeholder="28000"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
            />
          </Field>

          <Field
            label="Categoría"
            htmlFor="cp-cat"
            hint="Se administran desde Configuración → Categorías."
          >
            <select
              id="cp-cat"
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.length === 0 && <option value="">Sin categorías</option>}
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <button
          type="button"
          className={styles.availCard}
          onClick={() => setAvailable((a) => !a)}
          aria-pressed={available}
        >
          <span>
            <b>Disponible</b>
            <small>Si lo apagas, el producto aparece como agotado en el catálogo y no se puede pedir.</small>
          </span>
          <span className={`${styles.toggle}${available ? ` ${styles.on}` : ''}`} aria-hidden="true" />
        </button>
      </div>
    </Modal>
  );
}
