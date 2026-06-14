'use client';

import { Icon } from '@/lib/icons';
import { useRewards, useApproveReward, useRejectReward } from '@/lib/queries';
import { digitsOnly } from './helpers';
import styles from './whatsapp.module.css';

/**
 * Si el cliente del chat abierto tiene una reseña pendiente de verificar, muestra
 * un banner con el pantallazo + Aprobar/Rechazar (otorga el postre desde el chat).
 * Empareja reward↔chat por dígitos del teléfono para tolerar formatos distintos.
 */
export function RewardBanner({ phone }: { phone: string }) {
  const { data: rewards } = useRewards('pendiente');
  const approve = useApproveReward();
  const reject = useRejectReward();

  const target = digitsOnly(phone);
  const reward = (rewards ?? []).find((r) => digitsOnly(r.phone) === target);
  if (!reward) return null;

  const busy = approve.isPending || reject.isPending;

  return (
    <div className={`${styles.banner} ${styles.bannerReward}`}>
      <Icon.Cake size={15} />
      <span className={styles.bannerText}>
        <b>Reseña por verificar.</b>{' '}
        {reward.screenshotUrl ? (
          <>
            Revisa el{' '}
            <a
              className={styles.bannerLink}
              href={reward.screenshotUrl}
              target="_blank"
              rel="noreferrer"
            >
              pantallazo
            </a>{' '}
            y otorga el postre.
          </>
        ) : (
          <>El cliente dice que dejó la reseña (mira el pantallazo en el chat).</>
        )}
      </span>
      <span className={styles.bannerActions}>
        <button
          type="button"
          className="btn btn-primary sm"
          disabled={busy}
          onClick={() => approve.mutate({ id: reward.id })}
        >
          {approve.isPending ? '…' : 'Aprobar postre'}
        </button>
        <button
          type="button"
          className="btn btn-ghost sm"
          disabled={busy}
          onClick={() => reject.mutate({ id: reward.id })}
        >
          {reject.isPending ? '…' : 'Rechazar'}
        </button>
      </span>
    </div>
  );
}
