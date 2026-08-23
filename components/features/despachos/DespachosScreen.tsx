'use client';

import { useMemo, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import { COP, type Order, type Zone } from '@/lib/data';
import { PageHeader, SectionTitle, EmptyState } from '@/components/ui/Feedback';
import { StatGrid, StatCard } from '@/components/ui/Stat';
import { UrgencyChip } from '@/components/ui/Chip';
import { RouteMap } from '@/components/ui/RouteMap';
import { useIsDark } from '@/lib/hooks';
import { useOrders, useSettings, useUpdateOrderStatus, useZones } from '@/lib/queries';
import { optimizeOrder, tourLengthKm } from '@/lib/routing';
import { pushToast } from '@/lib/toast';
import styles from './despachos.module.css';

interface RouteStop {
  id: string;
  number?: number;
  cliente: string;
  address: string;
  phone: string;
  total: number;
  minutos: number;
  zone: string;
  zoneName: string;
  lat: number;
  lng: number;
  manual?: boolean;
}

interface RouteCard {
  id: string;
  zone: Zone;
  stops: RouteStop[];
  auto: RouteStop[];
  isCustom: boolean;
  km: number;
  naive: number;
  savedKm: number;
  minutes: number;
  fuelSaved: number;
}

function orderToStop(o: Order): RouteStop {
  return {
    id: o.id,
    number: o.number,
    cliente: o.cliente,
    address: o.address,
    phone: o.phone,
    total: o.total,
    minutos: o.minutos,
    zone: o.zone,
    zoneName: o.zoneName,
    lat: o.lat,
    lng: o.lng,
  };
}

export function DespachosScreen() {
  const dark = useIsDark();
  const [sortBy, setSortBy] = useState<'espera' | 'zona'>('espera');
  const [customStops, setCustomStops] = useState<Record<string, RouteStop[]>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [draft, setDraft] = useState({ cliente: '', address: '', phone: '' });
  const manualSeq = useRef(1);

  const { data: ordersData } = useOrders({ status: 'empacado' });
  const ready = useMemo<Order[]>(() => ordersData ?? [], [ordersData]);

  const { data: zonesData } = useZones();
  const zones = useMemo<Zone[]>(() => zonesData ?? [], [zonesData]);

  const { data: settings } = useSettings();
  // Origen de las rutas: viene de settings (Configuración → Local). Fallback por
  // campo a Medellín si la migración no está aplicada, para que un campo malo no
  // contamine el resto con NaN.
  const ORIGIN = useMemo(
    () => ({
      lat: Number.isFinite(settings?.localLat) ? (settings!.localLat as number) : 6.2447,
      lng: Number.isFinite(settings?.localLng) ? (settings!.localLng as number) : -75.5736,
      label: settings?.localLabel || 'Local',
    }),
    [settings?.localLat, settings?.localLng, settings?.localLabel],
  );

  const updateStatus = useUpdateOrderStatus();

  const setZone = (zoneId: string, stops: RouteStop[]) =>
    setCustomStops((cs) => ({ ...cs, [zoneId]: stops }));

  const routes = useMemo<RouteCard[]>(() => {
    return zones
      .map((z) => {
        const zoneOrders = ready.filter((o) => o.zone === z.id).map(orderToStop);
        // Baseline: heurística previa (el que más espera primero) — número
        // defendible de "ruta libre" para comparar contra el orden optimizado.
        const baseline = zoneOrders.slice().sort((a, b) => b.minutos - a.minutos);
        const auto = optimizeOrder(ORIGIN, zoneOrders);
        const stops = customStops[z.id] !== undefined ? customStops[z.id] : auto;
        if (stops.length === 0 && !(z.id in customStops)) return null;
        const km = +tourLengthKm(ORIGIN, stops).toFixed(1);
        const naive = +tourLengthKm(ORIGIN, baseline).toFixed(1);
        const savedKm = +Math.max(0, naive - km).toFixed(1);
        // Medellín urbano ≈ 24 km/h promedio + 5 min por parada.
        const minutes = Math.round((km / 24) * 60 + stops.length * 5);
        const fuelSaved = Math.round(savedKm * 480);
        return {
          id: 'r-' + z.id,
          zone: z,
          stops,
          auto,
          isCustom: customStops[z.id] !== undefined,
          km,
          naive,
          savedKm,
          minutes,
          fuelSaved,
        } satisfies RouteCard;
      })
      .filter((r): r is RouteCard => r !== null);
  }, [zones, ready, ORIGIN, customStops]);

  const totalKm = routes.reduce((a, r) => a + r.km, 0);
  const totalSavedKm = routes.reduce((a, r) => a + r.savedKm, 0);
  const totalSaved = routes.reduce((a, r) => a + r.fuelSaved, 0);
  const totalStops = routes.reduce((a, r) => a + r.stops.length, 0);

  const sortedReady = ready.slice().sort((a, b) => {
    if (sortBy === 'espera') return b.minutos - a.minutos;
    return a.zoneName.localeCompare(b.zoneName);
  });

  const moveStop = (zoneId: string, stops: RouteStop[], idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= stops.length) return;
    const next = stops.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    setZone(zoneId, next);
  };
  const removeStop = (zoneId: string, stops: RouteStop[], idx: number) => {
    const next = stops.slice();
    next.splice(idx, 1);
    setZone(zoneId, next);
  };
  const resetOrder = (zoneId: string, auto: RouteStop[]) => setZone(zoneId, auto);

  const addManualStop = (zoneId: string, stops: RouteStop[], zone: Zone) => {
    if (!draft.address.trim()) return;
    const id = 'M' + (manualSeq.current++).toString().padStart(2, '0');
    const newStop: RouteStop = {
      id,
      cliente: draft.cliente.trim() || 'Sin nombre',
      address: draft.address.trim(),
      phone: draft.phone.trim() || '—',
      total: 0,
      minutos: 0,
      zone: zone.id,
      zoneName: zone.name,
      // Direcciones manuales sin geocodificar — las dejamos en el centro de la
      // zona para que mapa y distancia sigan funcionando.
      lat: zone.lat,
      lng: zone.lng,
      manual: true,
    };
    setZone(zoneId, [...stops, newStop]);
    setDraft({ cliente: '', address: '', phone: '' });
    setAddingTo(null);
  };

  const copyAddresses = async (route: RouteCard) => {
    if (route.stops.length === 0) return;
    const lines = route.stops.map(
      (s, i) => `${i + 1}. ${s.cliente} — ${s.address} (${s.phone})`,
    );
    const text = `Ruta ${route.zone.name} · ${route.stops.length} paradas · ${route.km} km\n\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      pushToast({ kind: 'success', message: `Direcciones de ${route.zone.name} copiadas en orden optimizado.` });
    } catch {
      pushToast({ kind: 'error', message: 'No pude copiar al portapapeles. Verifica permisos del navegador.' });
    }
  };

  const dispatchRoute = async (route: RouteCard) => {
    const realIds = route.stops.filter((s) => !s.manual).map((s) => s.id);
    const manualCount = route.stops.filter((s) => s.manual).length;
    // Una mutación por pedido: cada una hace su optimistic update + rollback si
    // el server rechaza. allSettled para no perder éxitos si una falla.
    const results = await Promise.allSettled(
      realIds.map((id) => updateStatus.mutateAsync({ id, status: 'ruta' })),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    setCustomStops((cs) => {
      const next = { ...cs };
      delete next[route.zone.id];
      return next;
    });
    const parts = [`${ok} ${ok === 1 ? 'parada' : 'paradas'} en ruta`];
    if (manualCount > 0) parts.push(`${manualCount} manual${manualCount === 1 ? '' : 'es'} (no enviadas)`);
    pushToast({
      kind: 'success',
      message: `Ruta a ${route.zone.name} despachada · ${parts.join(' · ')}. Notificación enviada a los clientes vía WhatsApp.`,
    });
  };

  return (
    <div className={styles.wrap}>
      <PageHeader
        title="Despachos"
        sub="Direcciones gestionadas manualmente · rutas optimizadas para ahorrar gasolina"
      />

      <StatGrid cols={4} dataTour="despachos-kpis">
        <StatCard value={String(totalStops)} label={`Paradas en ruta · ${routes.length} zonas`} />
        <StatCard value={String(routes.length)} label="Rutas sugeridas por zona" />
        <StatCard value={totalKm.toFixed(1)} unit="km" label={`Distancia optimizada · −${totalSavedKm.toFixed(1)} km`} />
        <StatCard value={COP(totalSaved)} label="Ahorro estimado en gasolina" />
      </StatGrid>

      <div className={styles.callout}>
        <Icon.AlertCircle size={18} className={styles.calloutIcon} />
        <div className={styles.calloutBody}>
          <b>Los domiciliarios no se registran en el sistema.</b>
          <span>
            Nosotros sólo organizamos las direcciones en el orden más eficiente. Tú copias la lista y la pasas a
            quien vaya a entregar — Rappi, DiDi o un motorizado propio.
          </span>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Bandeja de salida */}
        <aside className={styles.tray}>
          <div className={styles.trayHead}>
            <div className={styles.trayTitle}>
              <b>Bandeja de salida</b>
              <span>{ready.length} pedidos empacados · distribuidos en rutas por zona</span>
            </div>
          </div>

          <div className={styles.sortbar}>
            <span className={styles.sortLabel}>Ordenar:</span>
            <button
              className={`${styles.sortBtn}${sortBy === 'espera' ? ` ${styles.on}` : ''}`}
              onClick={() => setSortBy('espera')}
            >
              Más espera
            </button>
            <button
              className={`${styles.sortBtn}${sortBy === 'zona' ? ` ${styles.on}` : ''}`}
              onClick={() => setSortBy('zona')}
            >
              Por zona
            </button>
          </div>

          <div className={styles.trayList}>
            {sortedReady.length === 0 ? (
              <EmptyState
                icon={<Icon.Package size={22} />}
                title="Nada empacado"
                sub="Cuando un pedido pase a Empacado aparecerá aquí."
              />
            ) : (
              sortedReady.map((o) => {
                const zone = zones.find((z) => z.id === o.zone);
                return (
                  <div key={o.id} className={styles.trayRow}>
                    <span className={styles.pip} style={{ background: zone?.color ?? 'var(--text-muted)' }} />
                    <div className={styles.trayRowMid}>
                      <div className={styles.trayRowTop}>
                        <span className={styles.num}>#{o.number}</span>
                        <span className={styles.trayName}>{o.cliente}</span>
                      </div>
                      <span className={styles.trayAddr}>{o.address}</span>
                    </div>
                    <div className={styles.trayRowEnd}>
                      <span className={styles.zoneName}>{zone?.name ?? o.zoneName}</span>
                      <UrgencyChip minutes={o.minutos} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Rutas sugeridas */}
        <div>
          <SectionTitle sub="Una ruta por zona — orden de paradas calculado para minimizar km. Edítalas a mano: reordena, elimina o agrega direcciones.">
            Rutas sugeridas
          </SectionTitle>

          {routes.length === 0 ? (
            <EmptyState
              icon={<Icon.Route size={26} />}
              title="Sin rutas por ahora"
              sub="No hay pedidos empacados para agrupar en rutas."
            />
          ) : (
            <div className={styles.routes}>
              {routes.map((r, i) => (
                <div key={r.id} className={styles.routeCard}>
                  <div className={styles.routeHead}>
                    <div className={styles.routeHeadLeft}>
                      <span className={styles.routeZonePill} style={{ background: r.zone.color }} />
                      <div className={styles.routeZoneText}>
                        <span className={styles.routeZoneName}>{r.zone.name}</span>
                        <span className={styles.routeZoneSub}>
                          {r.stops.length} {r.stops.length === 1 ? 'parada' : 'paradas'} ·{' '}
                          {r.isCustom ? 'editada manualmente' : 'orden optimizado'}
                        </span>
                      </div>
                    </div>
                    {r.isCustom ? (
                      <button
                        className={styles.recalc}
                        onClick={() => resetOrder(r.zone.id, r.auto)}
                        title="Restaurar orden óptimo"
                      >
                        <Icon.Sparkles size={12} />
                        Recalcular orden
                      </button>
                    ) : (
                      <span className="chip sm tone-green">
                        <span className="cdot" />
                        Optimizada
                      </span>
                    )}
                  </div>

                  {r.stops.length > 0 && (
                    <div className={styles.routeBody}>
                      <div className={styles.mapWrap}>
                        <RouteMap
                          origin={ORIGIN}
                          stops={r.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng }))}
                          color={r.zone.color}
                          dark={dark}
                        />
                        <div className={styles.mapLegend}>
                          <span className={styles.legendPill} style={{ background: 'var(--ink)' }}>
                            {ORIGIN.label}
                          </span>
                          <span>Origen</span>
                          <span className={styles.legendPill} style={{ background: r.zone.color, marginLeft: 6 }}>
                            1–{r.stops.length}
                          </span>
                          <span>Paradas en orden</span>
                          <span className={styles.legendNote}>Línea recta · sin tráfico</span>
                        </div>
                      </div>

                      <div className={styles.routeStats}>
                        <div className={styles.routeStat}>
                          <span className="lbl">Distancia</span>
                          <b>{r.km} km</b>
                          <span className="sub">−{r.savedKm} km vs libre</span>
                        </div>
                        <div className={styles.routeStat}>
                          <span className="lbl">Tiempo</span>
                          <b>~{r.minutes} min</b>
                          <span className="sub">incl. paradas</span>
                        </div>
                        <div className={`${styles.routeStat} ${styles.save}`}>
                          <span className="lbl">Ahorro</span>
                          <b>{COP(r.fuelSaved)}</b>
                          <span className="sub">en gasolina</span>
                        </div>
                        <div className={styles.routeStat}>
                          <span className="lbl">Tickets</span>
                          <b>{COP(r.stops.reduce((a, s) => a + s.total, 0))}</b>
                          <span className="sub">{r.stops.length} pedidos</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={styles.stops}>
                    <div className={styles.stopsHead}>
                      <span className="kicker">Orden de entrega</span>
                      <span className="hint">
                        {r.stops.length === 0 ? 'sin paradas — agrega una abajo' : 'edita el orden o elimina paradas'}
                      </span>
                    </div>

                    {r.stops.length === 0 && (
                      <div className={styles.stopsEmpty}>Esta zona no tiene paradas. Agrega una dirección manual.</div>
                    )}

                    {r.stops.map((s, i) => (
                      <div key={s.id} className={styles.stop}>
                        <div className={styles.stopNum} style={{ background: r.zone.color }}>
                          {i + 1}
                        </div>
                        <div className={styles.stopMid}>
                          <div className={styles.stopTop}>
                            <span className={styles.stopName}>{s.cliente}</span>
                            {s.number !== undefined && <span className={styles.num}>#{s.number}</span>}
                            {s.manual && <span className={styles.manualTag}>manual</span>}
                          </div>
                          <span className={styles.stopAddr}>
                            <Icon.MapPin size={11} />
                            {s.address}
                          </span>
                        </div>
                        <div className={styles.stopMeta}>
                          <span className="phone">{s.phone}</span>
                          {s.total > 0 && <span className="price">{COP(s.total)}</span>}
                        </div>
                        <div className={styles.stopActions}>
                          <button
                            className={styles.iconBtn}
                            disabled={i === 0}
                            onClick={() => moveStop(r.zone.id, r.stops, i, -1)}
                            title="Subir parada"
                          >
                            <Icon.ArrowUp size={13} />
                          </button>
                          <button
                            className={styles.iconBtn}
                            disabled={i === r.stops.length - 1}
                            onClick={() => moveStop(r.zone.id, r.stops, i, +1)}
                            title="Bajar parada"
                          >
                            <Icon.ArrowDown size={13} />
                          </button>
                          <button
                            className={`${styles.iconBtn} ${styles.danger}`}
                            onClick={() => removeStop(r.zone.id, r.stops, i)}
                            title="Quitar de esta ruta"
                          >
                            <Icon.X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {addingTo === r.zone.id ? (
                      <div className={styles.addRow}>
                        <div className={`${styles.stopNum} ${styles.ghost}`}>{r.stops.length + 1}</div>
                        <input
                          className={styles.manualInput}
                          placeholder="Nombre (opcional)"
                          value={draft.cliente}
                          onChange={(e) => setDraft({ ...draft, cliente: e.target.value })}
                        />
                        <input
                          className={styles.manualInput}
                          placeholder={`Dirección · ${r.zone.name}`}
                          value={draft.address}
                          onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                          autoFocus
                        />
                        <input
                          className={styles.manualInput}
                          placeholder="Teléfono"
                          value={draft.phone}
                          onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                        />
                        <div className={styles.stopActions}>
                          <button
                            className={`${styles.iconBtn} ${styles.confirm}`}
                            onClick={() => addManualStop(r.zone.id, r.stops, r.zone)}
                            disabled={!draft.address.trim()}
                            title="Agregar parada"
                          >
                            <Icon.Check size={13} />
                          </button>
                          <button
                            className={styles.iconBtn}
                            onClick={() => {
                              setAddingTo(null);
                              setDraft({ cliente: '', address: '', phone: '' });
                            }}
                            title="Cancelar"
                          >
                            <Icon.X size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className={styles.addTrigger} onClick={() => setAddingTo(r.zone.id)}>
                        <Icon.Plus size={13} />
                        Agregar parada manual a esta ruta
                      </button>
                    )}
                  </div>

                  <div className={styles.routeFooter}>
                    <span className={styles.footerMeta}>
                      {r.stops.length} {r.stops.length === 1 ? 'parada' : 'paradas'} · {r.km} km · ~{r.minutes} min
                    </span>
                    <div className={styles.footerActions}>
                      <button
                        className="btn"
                        onClick={() => copyAddresses(r)}
                        disabled={r.stops.length === 0}
                        title="Copia las direcciones al portapapeles, ya en orden"
                      >
                        <Icon.Copy size={13} />
                        Copiar direcciones
                      </button>
                      <button
                        className="btn btn-primary"
                        /* Solo la primera ruta lleva el ancla: el recorrido guiado
                           usa querySelector y con una por tarjeta el foco dependería
                           del orden de las zonas. */
                        data-tour={i === 0 ? 'despachos-despachar' : undefined}
                        disabled={r.stops.length === 0}
                        onClick={() => dispatchRoute(r)}
                      >
                        <Icon.Navigation size={13} />
                        Despachar ruta
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
