'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/lib/icons';
import { uploadLogo } from '@/lib/api';
import { settingsKeys, useActiveCompany, useMe, usePatchSettings, useSettings } from '@/lib/queries';
import { pushToast } from '@/lib/toast';
import styles from './marca.module.css';

/**
 * Marca del negocio: logo y color con los que se pinta la tienda.
 *
 * Va con vista previa porque sin ella esto son dos campos abstractos. Lo que el
 * dueño quiere saber no es "cuál es mi hex", es "cómo me van a ver mis
 * clientes" — y esa pantalla es donde ponen la tarjeta.
 *
 * La tinta del texto sobre el color se calcula, no se elige: un restaurante con
 * marca amarilla que termina con texto blanco encima no tiene cómo saber que su
 * pantalla de pago quedó ilegible.
 */

const SUGERIDOS = ['#22C55E', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#111827'];

function tintaSobre(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const canal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const L =
    0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
  return L > 0.18 ? '#111111' : '#ffffff';
}

export function MarcaPanel() {
  const { data: settings } = useSettings();
  const { data: me } = useMe();
  const companyCode = useActiveCompany();
  const patch = usePatchSettings();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const subir = useMutation({
    mutationFn: (file: File) => uploadLogo(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.all });
      pushToast({ kind: 'success', message: 'Logo actualizado' });
    },
    onError: (err: Error) => pushToast({ kind: 'error', message: err.message }),
  });

  const [color, setColor] = useState<string | null>(null);

  if (!settings) {
    return (
      <div className={styles.card}>
        <div className={styles.loading}>Cargando…</div>
      </div>
    );
  }

  const nombre =
    me?.memberships.find(m => String(m.companyCode) === companyCode)?.companyName ?? 'Tu negocio';
  const colorActual = color ?? settings.brandColor ?? '#22C55E';
  const sucio = colorActual !== (settings.brandColor ?? '#22C55E');
  const tinta = tintaSobre(colorActual);

  const elegirArchivo = (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      pushToast({ kind: 'error', message: 'El logo pesa más de 2 MB.' });
      return;
    }
    subir.mutate(file);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cabecera}>
        <div>
          <div className={styles.titulo}>
            <Icon.Star size={15} /> Cómo te ve tu cliente
          </div>
          <div className={styles.sub}>
            Tu logo y tu color en la tienda donde tus clientes arman el pedido y pagan.
          </div>
        </div>
      </div>

      <div className={styles.cuerpo}>
        <div className={styles.campos}>
          <div className={styles.campo}>
            <span className={styles.label}>Logo</span>
            <div className={styles.logoFila}>
              <div className={styles.logoActual}>
                {settings.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.logoUrl} alt="Logo del negocio" />
                ) : (
                  <span style={{ background: colorActual, color: tinta }}>
                    {nombre.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className={styles.logoAcciones}>
                <button
                  type="button"
                  className="btn btn-ghost sm sq"
                  disabled={subir.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  {subir.isPending ? 'Subiendo…' : settings.logoUrl ? 'Cambiar logo' : 'Subir logo'}
                </button>
                {settings.logoUrl && (
                  <button
                    type="button"
                    className="btn btn-ghost sm sq"
                    disabled={patch.isPending}
                    onClick={() => patch.mutate({ logoUrl: null })}
                  >
                    Quitar
                  </button>
                )}
                <small>PNG, JPG, WEBP o SVG. Cuadrado se ve mejor. Máx. 2 MB.</small>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              hidden
              onChange={e => {
                elegirArchivo(e.target.files?.[0] ?? null);
                e.target.value = '';
              }}
            />
          </div>

          <div className={styles.campo}>
            <span className={styles.label}>Color</span>
            <div className={styles.colores}>
              {SUGERIDOS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={styles.muestra}
                  style={{ background: c }}
                  data-activo={c.toLowerCase() === colorActual.toLowerCase()}
                  aria-label={`Usar el color ${c}`}
                  onClick={() => setColor(c)}
                />
              ))}
              <input
                type="color"
                className={styles.colorInput}
                value={colorActual}
                aria-label="Elegir otro color"
                onChange={e => setColor(e.target.value)}
              />
              <code className={styles.hex}>{colorActual.toUpperCase()}</code>
            </div>
            <small className={styles.ayuda}>
              El texto sobre tu color se ajusta solo para que siempre se lea.
            </small>
          </div>

          <div className={styles.pie}>
            <button
              type="button"
              className="btn btn-primary sm sq"
              disabled={!sucio || patch.isPending}
              onClick={() =>
                patch.mutate(
                  { brandColor: colorActual },
                  {
                    onSuccess: () => {
                      setColor(null);
                      pushToast({ kind: 'success', message: 'Color guardado' });
                    },
                  },
                )
              }
            >
              {patch.isPending ? 'Guardando…' : 'Guardar color'}
            </button>
          </div>
        </div>

        <div className={styles.preview} aria-label="Vista previa de tu tienda">
          <div className={styles.previewTienda}>
            <div className={styles.previewHeader}>
              <div className={styles.previewMarca}>
                {settings.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.logoUrl} alt="" />
                ) : (
                  <span style={{ background: colorActual, color: tinta }}>
                    {nombre.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <b>{nombre}</b>
              </div>
              <div className={styles.previewPill}>
                <Icon.ShoppingBag size={12} />
                2 productos
                <span style={{ background: colorActual, color: tinta }}>$48.000</span>
              </div>
            </div>
            <div className={styles.previewCuerpo}>
              <div className={styles.previewLinea} />
              <div className={styles.previewLinea} data-corta="true" />
              <button type="button" className={styles.previewBoton} style={{ background: colorActual, color: tinta }}>
                Pagar $48.000
              </button>
            </div>
          </div>
          <small>Así se ve tu tienda ahora mismo.</small>
        </div>
      </div>
    </div>
  );
}
