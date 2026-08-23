'use client';

import { useMemo, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import { COP } from '@/lib/data';
import { useExtraerCarta, useImportarCarta } from '@/lib/queries';
import type { ProductoExtraido } from '@/lib/api';
import styles from './onboarding.module.css';

/**
 * Subir la carta como foto o PDF y revisarla antes de publicarla.
 *
 * Es el paso más pesado del onboarding: meter 40 u 80 productos a mano es donde
 * la gente abandona. Ningún competidor lo resuelve sin topes — Fudo se rinde a
 * los 40 productos y Loggro lo hace por ti cobrando medio millón.
 *
 * DOS COSAS QUE NO SE PUEDEN OMITIR EN ESTA PANTALLA
 *
 * 1. **Revisión lado a lado.** La imagen original queda a la vista mientras se
 *    corrige. Sin eso, revisar 40 productos es imposible.
 *
 * 2. **El modelo puede saltarse productos, en silencio.** Podemos detectar un
 *    precio raro, pero no lo que no vio. Por eso el texto dice "revisa que no
 *    falte nada" y agregar un producto está siempre a un clic — no se promete
 *    una lectura completa.
 */

type Fila = ProductoExtraido & { id: string };

const nuevaFila = (): Fila => ({
  id: `nuevo-${Math.random().toString(36).slice(2, 9)}`,
  nombre: '',
  descripcion: null,
  precio: null,
  categoria: 'Carta',
  confianza: 1,
  avisos: [],
});

export function CartaUploader({ onListo }: { onListo?: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [reemplazar, setReemplazar] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const extraer = useExtraerCarta();
  const importar = useImportarCarta();

  const elegirArchivo = (file: File) => {
    setPreview(URL.createObjectURL(file));
    setFilas(null);
    extraer.mutate(file, {
      onSuccess: carta =>
        setFilas(
          carta.productos.map((p, i) => ({ ...p, id: `ext-${i}` })),
        ),
    });
  };

  const editar = (id: string, patch: Partial<Fila>) =>
    setFilas(f => (f ? f.map(x => (x.id === id ? { ...x, ...patch, avisos: recalcular({ ...x, ...patch }) } : x)) : f));

  const quitar = (id: string) => setFilas(f => (f ? f.filter(x => x.id !== id) : f));

  const listos = useMemo(
    () => (filas ?? []).filter(f => f.nombre.trim() && f.precio && f.precio > 0),
    [filas],
  );
  const pendientes = (filas ?? []).length - listos.length;

  const guardar = () => {
    importar.mutate(
      {
        productos: listos.map(f => ({
          nombre: f.nombre.trim(),
          descripcion: f.descripcion,
          precio: f.precio as number,
          categoria: f.categoria.trim() || 'Carta',
        })),
        reemplazar,
      },
      {
        onSuccess: () => {
          setFilas(null);
          setPreview(null);
          onListo?.();
        },
      },
    );
  };

  // ------------------------------------------------------------- subir
  if (!filas) {
    return (
      <div className={styles.subir}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          hidden
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) elegirArchivo(f);
          }}
        />

        <div
          className={styles.dropzone}
          data-cargando={extraer.isPending}
          onClick={() => !extraer.isPending && inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f && !extraer.isPending) elegirArchivo(f);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
        >
          {extraer.isPending ? (
            <>
              <span className={styles.spin} aria-hidden="true" />
              <b>Leyendo tu carta…</b>
              <small>Puede tardar hasta un minuto. No cierres esta pantalla.</small>
            </>
          ) : (
            <>
              <Icon.Sparkles size={26} />
              <b>Sube una foto de tu carta</b>
              <small>
                Arrastra la imagen o el PDF aquí, o haz clic para elegirlo. Nosotros la
                digitalizamos y tú solo revisas.
              </small>
            </>
          )}
        </div>

        {extraer.isError && (
          <div className={styles.alerta} data-tono="error" role="alert">
            <Icon.AlertCircle size={16} />
            <div>
              <b>No pudimos leer la carta</b>
              <p>{extraer.error.message}</p>
            </div>
          </div>
        )}

        <p className={styles.pieSubir}>
          ¿Prefieres cargarla a mano? Puedes hacerlo desde <b>Catálogo</b> en cualquier momento.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------- revisar
  return (
    <div className={styles.revision}>
      <div className={styles.revisionCabecera}>
        <div>
          <h3>Revisa tu carta</h3>
          <p>
            Leímos <b>{filas.length} productos</b>.{' '}
            {pendientes > 0 && (
              <>
                <b className={styles.faltan}>{pendientes} necesitan tu atención</b> antes de
                guardarse.{' '}
              </>
            )}
            Compara con tu carta y <b>revisa que no falte nada</b>: a veces se nos escapa un
            producto.
          </p>
        </div>
        <button type="button" className="btn btn-ghost sm sq" onClick={() => { setFilas(null); setPreview(null); }}>
          Subir otra
        </button>
      </div>

      <div className={styles.revisionCuerpo}>
        {preview && (
          <div className={styles.original}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Tu carta original" />
          </div>
        )}

        <div className={styles.tabla}>
          {filas.map(f => (
            <div key={f.id} className={styles.fila} data-avisa={f.avisos.length > 0}>
              <input
                className="input"
                value={f.nombre}
                placeholder="Nombre del producto"
                onChange={e => editar(f.id, { nombre: e.target.value })}
              />
              <input
                className="input"
                value={f.categoria}
                placeholder="Categoría"
                onChange={e => editar(f.id, { categoria: e.target.value })}
              />
              <input
                className="input"
                type="number"
                inputMode="numeric"
                min={0}
                value={f.precio ?? ''}
                placeholder="Precio"
                onChange={e =>
                  editar(f.id, { precio: e.target.value ? Number(e.target.value) : null })
                }
              />
              <button
                type="button"
                className={styles.quitar}
                onClick={() => quitar(f.id)}
                aria-label={`Quitar ${f.nombre || 'producto'}`}
              >
                <Icon.X size={15} />
              </button>

              {f.avisos.length > 0 && (
                <p className={styles.aviso}>
                  <Icon.AlertTriangle size={13} /> {f.avisos.join(' · ')}
                </p>
              )}
            </div>
          ))}

          <button
            type="button"
            className={styles.agregar}
            onClick={() => setFilas(f => [...(f ?? []), nuevaFila()])}
          >
            <Icon.Plus size={15} /> Falta un producto
          </button>
        </div>
      </div>

      <div className={styles.revisionPie}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={reemplazar}
            onChange={e => setReemplazar(e.target.checked)}
          />
          Reemplazar la carta que tengo ahora
        </label>

        <div className={styles.pieAcciones}>
          <span className={styles.resumen}>
            {listos.length} {listos.length === 1 ? 'producto listo' : 'productos listos'}
            {listos.length > 0 && <> · {COP(listos.reduce((s, f) => s + (f.precio ?? 0), 0))} en total</>}
          </span>
          <button
            type="button"
            className="btn btn-primary sm sq"
            disabled={listos.length === 0 || importar.isPending}
            onClick={guardar}
          >
            {importar.isPending ? 'Guardando…' : `Guardar ${listos.length} productos`}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Recalcula los avisos de una fila tras editarla. */
function recalcular(f: Fila): string[] {
  const avisos: string[] = [];
  if (!f.nombre.trim()) avisos.push('Falta el nombre');
  if (!f.precio) avisos.push('Falta el precio');
  else if (f.precio < 1000 || f.precio > 500000) avisos.push('El precio se ve raro');
  return avisos;
}
