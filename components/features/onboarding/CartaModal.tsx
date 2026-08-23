'use client';

import { useMemo, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import {
  useCreateProduct,
  useDeleteProduct,
  useOnboarding,
  usePatchProduct,
  useProducts,
  useSettings,
  useUploadProductImage,
} from '@/lib/queries';
import type { Product } from '@/lib/data';
import { EscenaCarta } from './EscenaCarta';
import { ModalCartoon } from './ModalCartoon';
import styles from './cartoon.module.css';

/**
 * "Sube tu carta" — se escribe a mano, aquí mismo.
 *
 * Deliberadamente NO se piden fotos ni archivos. La extracción por foto existe
 * y funciona (`CartaUploader` + `/catalog/extract`), pero pedirla en el primer
 * minuto pone entre el dueño y su primer producto una foto que quizá no tiene a
 * mano, un permiso de cámara y una espera de Gemini que a veces se congestiona.
 * Escribir tres productos toma menos que buscar la foto.
 *
 * La otra decisión: **pide tres, no la carta entera**. Un negocio con cuarenta
 * platos que cree que tiene que cargarlos todos hoy no empieza. Con tres el bot
 * ya puede cerrar un pedido, y el resto se agrega en Catálogo con calma.
 *
 * **Pero eso es el primer día.** Quien vuelve con "Editar" ya tiene carta, y un
 * modal en blanco le dice que lo que cargó se perdió. Así que el modal tiene
 * dos caras: la de estrenar (explicación + "te faltan 3") y la de volver (abre
 * directo en la lista, con lo que ya existe cargado desde el catálogo real).
 */

const CATEGORIAS_SUGERIDAS = ['Platos fuertes', 'Entradas', 'Bebidas', 'Postres', 'Combos'];
const META = 3;

interface Props {
  open: boolean;
  onClose: () => void;
  onCompletado?: () => void;
  progreso?: { actual: number; total: number };
}

/**
 * El montaje va condicionado: adentro se consulta el catálogo con polling, y
 * mantenerlo vivo mientras el modal está cerrado sería pedirle productos al
 * backend cada 10s en una pantalla que no los muestra. Desmontar también es lo
 * que limpia el borrador al cerrar — antes hacía falta un efecto para eso.
 */
export function CartaModal(props: Props) {
  if (!props.open) return null;
  return <CartaAbierta {...props} />;
}

/** Una fila que el dueño escribió en esta sesión y todavía no se ha guardado. */
interface Borrador {
  /** Solo para React y para saber cuál se está editando. No sale del navegador. */
  localId: number;
  nombre: string;
  precio: number;
  categoria: string;
  /** Opcional. La carta funciona sin fotos: el canal principal es un chat. */
  foto?: File | null;
  previa?: string | null;
}

/** Qué se está editando en el formulario de arriba. `null` = se está agregando. */
type Edicion = { tipo: 'guardado'; id: string } | { tipo: 'borrador'; localId: number } | null;

/** Sin tildes, sin mayúsculas y sin espacios de sobra: "Té Helado" == "te helado". */
const normalizar = (t: string) =>
  t
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function CartaAbierta({ onClose, onCompletado, progreso }: Props) {
  const terminar = onCompletado ?? onClose;
  const { data: settings } = useSettings();
  const { refetch: refetchOnboarding } = useOnboarding();

  const { data: productos, isLoading } = useProducts();
  const crearProducto = useCreateProduct();
  const patchProducto = usePatchProduct();
  const borrarProducto = useDeleteProduct();
  const subirFoto = useUploadProductImage();

  /** Lo que ya vive en el catálogo. Es la fuente de verdad, no una copia local. */
  const guardados = useMemo(() => productos ?? [], [productos]);

  const [borradores, setBorradores] = useState<Borrador[]>([]);
  const siguienteId = useRef(1);

  /**
   * La explicación es para el primer día. A quien ya tiene carta lo mandamos
   * directo a la lista: volver a explicarle qué es una carta y pedirle "tres
   * productos" cuando tiene doce es tratarlo como si no hubiera estado aquí.
   * Se decide con el primer render con datos y no se vuelve a tocar, para que
   * borrar el último producto no lo devuelva a la explicación a media edición.
   */
  const [paso, setPaso] = useState<'explicacion' | 'escribir' | 'listo' | null>(null);
  const pasoActual = paso ?? (guardados.length > 0 ? 'escribir' : 'explicacion');
  const [vinoDeExplicacion, setVinoDeExplicacion] = useState(false);

  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [foto, setFoto] = useState<{ file: File; previa: string } | null>(null);
  /** URL de la foto que el producto ya tenía guardada (solo al editar). */
  const [fotoActual, setFotoActual] = useState<string | null>(null);
  const [editando, setEditando] = useState<Edicion>(null);
  /** Nombre que chocó con uno existente, para avisar en vez de duplicar. */
  const [choque, setChoque] = useState<{ nombre: string; ref: Exclude<Edicion, null> } | null>(null);
  /** Producto ya guardado que el dueño pidió quitar. Se confirma antes de borrar. */
  const [porQuitar, setPorQuitar] = useState<Product | null>(null);
  const [guardando, setGuardando] = useState(false);
  /** Cuántos entraron al guardar, para la pantalla final. */
  const [resumen, setResumen] = useState<{ agregados: number; total: number } | null>(null);

  const nombreRef = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  // Las categorías que ya usa el negocio mandan sobre las sugeridas nuestras: si
  // un producto cae en una categoría que su catálogo no tiene, aparece en una
  // pestaña huérfana y el dueño no lo encuentra. Las de sus productos entran
  // aunque no estén en settings, por lo mismo.
  const categorias = useMemo(() => {
    const base = settings?.categories?.length ? settings.categories : CATEGORIAS_SUGERIDAS;
    const extra = guardados.map(p => p.cat).filter(c => c && !base.includes(c));
    return [...base, ...Array.from(new Set(extra))];
  }, [settings, guardados]);
  const categoriaActiva = categoria ?? categorias[0];

  const precioNum = Number(precio.replace(/\D/g, ''));
  const puedeAgregar = nombre.trim().length >= 2 && precioNum > 0;

  /** Toda la carta en un solo orden: primero lo guardado, después lo del día. */
  const cartaCompleta = useMemo(
    () => [
      ...guardados.map(p => ({ nombre: p.name, precio: p.price })),
      ...borradores.map(b => ({ nombre: b.nombre, precio: b.precio })),
    ],
    [guardados, borradores],
  );

  const limpiarFormulario = () => {
    setNombre('');
    setPrecio('');
    setFoto(null);
    setFotoActual(null);
    setEditando(null);
    setChoque(null);
  };

  /** Busca un producto con el mismo nombre, saltándose el que se está editando. */
  const buscarChoque = (texto: string): Exclude<Edicion, null> | null => {
    const clave = normalizar(texto);
    const yaGuardado = guardados.find(
      p =>
        normalizar(p.name) === clave &&
        !(editando?.tipo === 'guardado' && editando.id === p.id),
    );
    if (yaGuardado) return { tipo: 'guardado', id: yaGuardado.id };
    const yaEnBorrador = borradores.find(
      b =>
        normalizar(b.nombre) === clave &&
        !(editando?.tipo === 'borrador' && editando.localId === b.localId),
    );
    if (yaEnBorrador) return { tipo: 'borrador', localId: yaEnBorrador.localId };
    return null;
  };

  const confirmar = async () => {
    if (!puedeAgregar || guardando) return;

    const repetido = buscarChoque(nombre);
    if (repetido) {
      setChoque({ nombre: nombre.trim(), ref: repetido });
      return;
    }
    setChoque(null);

    // ---------------------------------------------------- corregir lo guardado
    if (editando?.tipo === 'guardado') {
      setGuardando(true);
      try {
        await patchProducto.mutateAsync({
          productId: editando.id,
          body: { name: nombre.trim(), price: precioNum, cat: categoriaActiva },
        });
        if (foto) {
          await subirFoto
            .mutateAsync({ productId: editando.id, file: foto.file })
            .catch(err => console.warn('[carta] no se pudo subir la foto de', nombre, err));
        }
        limpiarFormulario();
      } finally {
        setGuardando(false);
      }
      nombreRef.current?.focus();
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      precio: precioNum,
      categoria: categoriaActiva,
      foto: foto?.file ?? null,
      previa: foto?.previa ?? null,
    };

    // ---------------------------------------------------- corregir un borrador
    if (editando?.tipo === 'borrador') {
      const { localId } = editando;
      setBorradores(prev => prev.map(b => (b.localId === localId ? { ...b, ...datos } : b)));
      limpiarFormulario();
      nombreRef.current?.focus();
      return;
    }

    // ------------------------------------------------------------- uno nuevo
    setBorradores(prev => [...prev, { localId: siguienteId.current++, ...datos }]);
    limpiarFormulario();
    // El foco vuelve al nombre: agregar tres productos son tres tandas de
    // escribir-tabular-enter, sin tocar el mouse.
    nombreRef.current?.focus();
  };

  const editarGuardado = (p: Product) => {
    setEditando({ tipo: 'guardado', id: p.id });
    setNombre(p.name);
    setPrecio(String(p.price));
    setCategoria(p.cat);
    setFoto(null);
    setFotoActual(p.img || null);
    setChoque(null);
    nombreRef.current?.focus();
  };

  const editarBorrador = (b: Borrador) => {
    setEditando({ tipo: 'borrador', localId: b.localId });
    setNombre(b.nombre);
    setPrecio(String(b.precio));
    setCategoria(b.categoria);
    setFoto(b.foto && b.previa ? { file: b.foto, previa: b.previa } : null);
    setFotoActual(null);
    setChoque(null);
    nombreRef.current?.focus();
  };

  /** Salta al que ya existe cuando el aviso de repetido ofrece corregirlo. */
  const irAlRepetido = (ref: Exclude<Edicion, null>) => {
    if (ref.tipo === 'guardado') {
      const p = guardados.find(x => x.id === ref.id);
      if (p) editarGuardado(p);
      return;
    }
    const b = borradores.find(x => x.localId === ref.localId);
    if (b) editarBorrador(b);
  };

  const quitarConfirmado = async () => {
    if (!porQuitar) return;
    const id = porQuitar.id;
    setPorQuitar(null);
    if (editando?.tipo === 'guardado' && editando.id === id) limpiarFormulario();
    await borrarProducto.mutateAsync(id).catch(() => {
      /* el hook ya avisa con un toast; el producto sigue en la lista */
    });
    refetchOnboarding();
  };

  /**
   * Se crea producto por producto en vez de importar la lista de golpe: la
   * imagen se sube contra el id del producto, y el import masivo devuelve
   * cuántos entraron, no cuáles. Son tres o cuatro llamadas, no cuarenta.
   */
  const guardarBorradores = async () => {
    if (borradores.length === 0 || guardando) return;
    setGuardando(true);
    const pendientes = [...borradores];
    const totalPrevio = guardados.length;
    const aGuardar = pendientes.length;

    try {
      while (pendientes.length > 0) {
        const b = pendientes[0];
        const creado = await crearProducto.mutateAsync({
          name: b.nombre,
          price: b.precio,
          cat: b.categoria,
        });
        if (b.foto) {
          // Si la foto falla, el producto ya quedó guardado: se avisa y sigue.
          await subirFoto
            .mutateAsync({ productId: creado.id, file: b.foto })
            .catch(err => console.warn('[carta] no se pudo subir la foto de', b.nombre, err));
        }
        pendientes.shift();
      }
    } catch {
      // El hook ya mostró el toast. Lo que no alcanzó a entrar sigue escrito en
      // la lista: perder lo tecleado por un 500 es la peor forma de fallar.
      setBorradores(pendientes);
      setGuardando(false);
      return;
    }

    setBorradores([]);
    setResumen({ agregados: aGuardar, total: totalPrevio + aGuardar });
    setGuardando(false);
    refetchOnboarding();
    setPaso('listo');
  };

  const elegirFoto = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setFoto({ file, previa: URL.createObjectURL(file) });
  };

  // ------------------------------------------------------------- cargando
  // Sin esto, un negocio con carta ve un parpadeo de "Tu carta, en tres
  // productos" antes de que llegue el catálogo: justo el mensaje equivocado.
  if (isLoading && !productos) {
    return (
      <ModalCartoon
        open
        onClose={onClose}
        tono="sol"
        progreso={progreso}
        escena={<EscenaCarta productos={[]} />}
        titulo="Un segundo…"
        sub="Estamos mirando qué tienes en tu carta."
        pie={
          <button type="button" className={styles.accionSuave} onClick={onClose}>
            Cerrar
          </button>
        }
      >
        <p className={styles.pista}>Cargando tu catálogo.</p>
      </ModalCartoon>
    );
  }

  // ------------------------------------------------------------- explicación
  if (pasoActual === 'explicacion') {
    return (
      <ModalCartoon
        open
        onClose={onClose}
        tono="sol"
        progreso={progreso}
        escena={<EscenaCarta productos={cartaCompleta} />}
        titulo="Tu carta, en tres productos"
        sub="Es lo que tu bot le va a ofrecer a quien te escriba. No hace falta subirla completa hoy."
        pie={
          <>
            <button type="button" className={styles.accionSuave} onClick={onClose}>
              Ahora no
            </button>
            <button
              type="button"
              className={styles.accion}
              onClick={() => {
                setVinoDeExplicacion(true);
                setPaso('escribir');
              }}
            >
              Empezar <Icon.ArrowRight size={15} />
            </button>
          </>
        }
      >
        <ul className={styles.lista}>
          <li>
            <Icon.Package size={16} />
            <span>
              <b>Empieza por los que más vendes.</b> Con tres, tu bot ya puede cerrar un pedido
              completo.
            </span>
          </li>
          <li>
            <Icon.DollarSign size={16} />
            <span>
              <b>El precio como se lo cobras al cliente</b>, en pesos. El bot lo suma solo y el
              domicilio se agrega aparte.
            </span>
          </li>
          <li>
            <Icon.Sparkles size={16} />
            <span>
              <b>El resto va en Catálogo</b>, cuando tengas tiempo. Ahí también les pones foto y
              descripción.
            </span>
          </li>
        </ul>
      </ModalCartoon>
    );
  }

  // ------------------------------------------------------------------ listo
  if (pasoActual === 'listo') {
    const agregados = resumen?.agregados ?? 0;
    const total = resumen?.total ?? guardados.length;
    return (
      <ModalCartoon
        open
        onClose={onClose}
        tono="sol"
        progreso={progreso}
        escena={<EscenaCarta productos={cartaCompleta} celebrando />}
        titulo=""
        pie={
          <>
            {!progreso && <span />}
            <button type="button" className={styles.accion} onClick={terminar}>
              Seguir <Icon.ArrowRight size={15} />
            </button>
          </>
        }
      >
        <div className={styles.exito}>
          <h2>
            {agregados > 0 && total > agregados
              ? `¡Agregaste ${agregados}! Tu carta ya tiene ${total}.`
              : `¡Tu carta ya tiene ${total} ${total === 1 ? 'producto' : 'productos'}!`}
          </h2>
          <p>
            Tu bot ya sabe qué ofrecer. Cuando quieras agregar el resto —con fotos y descripciones—
            lo haces en Catálogo.
          </p>
        </div>
      </ModalCartoon>
    );
  }

  // --------------------------------------------------------------- escribir
  const tieneCarta = guardados.length > 0;
  const totalCarta = guardados.length + borradores.length;
  const faltan = Math.max(0, META - totalCarta);
  const editandoAlgo = editando !== null;

  const titulo = tieneCarta
    ? borradores.length > 0
      ? `Van ${totalCarta} en tu carta`
      : 'Tu carta'
    : borradores.length === 0
      ? 'Escribe tu primer producto'
      : `Van ${borradores.length}`;

  const sub = tieneCarta
    ? borradores.length > 0
      ? `Te ${borradores.length === 1 ? 'falta' : 'faltan'} por guardar ${borradores.length}. Lo demás ya está en tu catálogo.`
      : 'Esto es lo que tu bot ofrece hoy. Agrega los que falten o corrige lo que no cuadre.'
    : faltan > 0
      ? `Con ${META} ya puedes vender. Te ${faltan === 1 ? 'falta' : 'faltan'} ${faltan}.`
      : 'Ya tienes suficientes para arrancar. Agrega los que quieras y guarda.';

  const accionPrincipal =
    borradores.length > 0 ? (
      <button
        type="button"
        className={styles.accion}
        disabled={guardando}
        onClick={guardarBorradores}
      >
        {guardando
          ? 'Guardando…'
          : `Guardar ${borradores.length} ${borradores.length === 1 ? 'producto' : 'productos'}`}
      </button>
    ) : (
      <button
        type="button"
        className={styles.accion}
        disabled={!tieneCarta || guardando}
        onClick={terminar}
      >
        Listo <Icon.ArrowRight size={15} />
      </button>
    );

  return (
    <ModalCartoon
      open
      onClose={onClose}
      tono="sol"
      progreso={progreso}
      escena={<EscenaCarta productos={cartaCompleta} />}
      titulo={titulo}
      sub={sub}
      pie={
        <>
          {vinoDeExplicacion ? (
            <button
              type="button"
              className={styles.accionSuave}
              onClick={() => setPaso('explicacion')}
            >
              Volver
            </button>
          ) : (
            <button type="button" className={styles.accionSuave} onClick={onClose}>
              Cerrar
            </button>
          )}
          {accionPrincipal}
        </>
      }
    >
      {editandoAlgo && (
        <p className={styles.editandoAviso}>
          <Icon.Edit size={14} />
          <span>
            Corrigiendo <b>{editando?.tipo === 'guardado' ? 'un producto de tu carta' : 'un producto sin guardar'}</b>.
          </span>
          <button type="button" className={styles.fotoQuitar} onClick={limpiarFormulario}>
            Cancelar
          </button>
        </p>
      )}

      <div className={styles.filaProducto}>
        <label className={styles.campo}>
          <span className={styles.etiqueta}>Producto</span>
          <input
            ref={nombreRef}
            className={styles.entrada}
            value={nombre}
            maxLength={80}
            placeholder="Ej. Hamburguesa clásica"
            onChange={e => {
              setNombre(e.target.value);
              if (choque) setChoque(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void confirmar();
              }
            }}
          />
        </label>

        <label className={styles.campo}>
          <span className={styles.etiqueta}>Precio</span>
          <input
            className={styles.entrada}
            value={precio}
            inputMode="numeric"
            placeholder="24000"
            onChange={e => setPrecio(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void confirmar();
              }
            }}
          />
        </label>
      </div>

      {/* Repetir un producto no rompe nada, pero deja al cliente eligiendo entre
          dos "Hamburguesa clásica" idénticas. Se avisa y se ofrece el atajo a
          corregir el que ya existe, que es casi siempre lo que se quería. */}
      {choque && (
        <p className={styles.avisoRepetido} role="status">
          <Icon.AlertTriangle size={15} />
          <span>
            Ya tienes <b>{choque.nombre}</b> en tu carta. No lo agregamos dos veces.
          </span>
          <button
            type="button"
            className={styles.enlaceAviso}
            onClick={() => irAlRepetido(choque.ref)}
          >
            Corregir ese
          </button>
        </p>
      )}

      <div className={styles.fotoFila}>
        <button
          type="button"
          className={styles.fotoBoton}
          data-tiene={!!(foto || fotoActual)}
          onClick={() => fotoRef.current?.click()}
        >
          {foto || fotoActual ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto?.previa ?? fotoActual ?? ''} alt="" />
          ) : (
            <Icon.Plus size={16} />
          )}
        </button>
        <span className={styles.fotoTexto}>
          {foto ? 'Foto lista' : fotoActual ? 'Foto actual' : 'Foto (opcional)'}
          <small>
            {fotoActual && !foto
              ? 'Toca la foto para cambiarla.'
              : 'El bot vende por chat: se puede sin foto.'}
          </small>
        </span>
        {foto && (
          <button type="button" className={styles.fotoQuitar} onClick={() => setFoto(null)}>
            Quitar
          </button>
        )}
        <input
          ref={fotoRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={e => {
            elegirFoto(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
      </div>

      <div className={styles.sugerencias}>
        {categorias.map(c => (
          <button
            key={c}
            type="button"
            className={styles.sugerencia}
            data-activa={c === categoriaActiva}
            onClick={() => setCategoria(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={styles.agregarProducto}
        disabled={!puedeAgregar || guardando}
        onClick={() => void confirmar()}
      >
        {editandoAlgo ? (
          <>
            <Icon.Check size={15} /> Guardar cambios
          </>
        ) : (
          <>
            <Icon.Plus size={15} /> Agregar a la carta
          </>
        )}
      </button>

      {/* Quitar algo ya guardado no es lo mismo que borrar un renglón recién
          escrito. Se pregunta, y se dice qué pasa de verdad: se archiva, sale
          de la tienda y del bot, y el histórico de pedidos no se toca. */}
      {porQuitar && (
        <div className={styles.confirmaQuitar} role="alertdialog" aria-label="Confirmar">
          <p>
            <b>¿Quitar {porQuitar.name} de tu carta?</b> Deja de aparecer en tu tienda y el bot no lo
            va a ofrecer más. Los pedidos que ya lo tenían no se tocan.
          </p>
          <div className={styles.confirmaBotones}>
            <button
              type="button"
              className={styles.accionSuave}
              onClick={() => setPorQuitar(null)}
            >
              Mejor no
            </button>
            <button
              type="button"
              className={styles.accionRiesgo}
              disabled={borrarProducto.isPending}
              onClick={() => void quitarConfirmado()}
            >
              {borrarProducto.isPending ? 'Quitando…' : 'Sí, quitarlo'}
            </button>
          </div>
        </div>
      )}

      {totalCarta > 0 && (
        <>
          <ul className={styles.listaProductos}>
            {guardados.map(p => (
              <li key={p.id} data-estado="guardado">
                {p.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.productoFoto} src={p.img} alt="" />
                ) : (
                  <span className={styles.productoFoto} data-vacia="true" aria-hidden="true" />
                )}
                <span className={styles.productoCelda}>
                  <span className={styles.productoNombre}>{p.name}</span>
                </span>
                <span className={styles.productoCat}>{p.cat}</span>
                <span className={styles.productoPrecio}>${p.price.toLocaleString('es-CO')}</span>
                <span className={styles.accionesFila}>
                  <button
                    type="button"
                    className={styles.editarProducto}
                    aria-label={`Corregir ${p.name}`}
                    onClick={() => editarGuardado(p)}
                  >
                    <Icon.Edit size={13} />
                  </button>
                  <button
                    type="button"
                    className={styles.quitarProducto}
                    aria-label={`Quitar ${p.name} de tu carta`}
                    onClick={() => setPorQuitar(p)}
                  >
                    <Icon.X size={13} />
                  </button>
                </span>
              </li>
            ))}

            {borradores.map(b => (
              <li key={`b-${b.localId}`} data-estado="borrador">
                {b.previa ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.productoFoto} src={b.previa} alt="" />
                ) : (
                  <span className={styles.productoFoto} data-vacia="true" aria-hidden="true" />
                )}
                <span className={styles.productoCelda}>
                  <span className={styles.productoNombre}>{b.nombre}</span>
                  <i className={styles.sinGuardar}>sin guardar</i>
                </span>
                <span className={styles.productoCat}>{b.categoria}</span>
                <span className={styles.productoPrecio}>${b.precio.toLocaleString('es-CO')}</span>
                <span className={styles.accionesFila}>
                  <button
                    type="button"
                    className={styles.editarProducto}
                    aria-label={`Corregir ${b.nombre}`}
                    onClick={() => editarBorrador(b)}
                  >
                    <Icon.Edit size={13} />
                  </button>
                  <button
                    type="button"
                    className={styles.quitarProducto}
                    aria-label={`Sacar ${b.nombre} de la lista`}
                    onClick={() => {
                      setBorradores(prev => prev.filter(x => x.localId !== b.localId));
                      if (editando?.tipo === 'borrador' && editando.localId === b.localId) {
                        limpiarFormulario();
                      }
                    }}
                  >
                    <Icon.X size={13} />
                  </button>
                </span>
              </li>
            ))}
          </ul>

          {tieneCarta && borradores.length > 0 && (
            <p className={styles.pista}>
              Los marcados <b>sin guardar</b> entran a tu carta cuando toques Guardar. Los demás ya
              están, y lo que cambies en ellos se aplica de una.
            </p>
          )}
        </>
      )}
    </ModalCartoon>
  );
}
