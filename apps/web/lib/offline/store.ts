'use client';

import type { SyncQueue } from '@futuriste/core';
import { EMPTY_QUEUE } from '@futuriste/core';

/**
 * Où la file d'attente survit à la fermeture de l'application (phase 7.1).
 *
 * IndexedDB, et non `localStorage` : un coach peut saisir cent présences et
 * des notes sur une séance de 90 minutes, et `localStorage` est à la fois
 * limité (~5 Mo) et SYNCHRONE — chaque écriture gèlerait l'interface pendant
 * qu'il tape.
 *
 * TOUT ÉCHEC EST SILENCIEUX ICI, ET C'EST VOULU
 *
 * En navigation privée, avec les données de site bloquées, ou sur un appareil
 * dont le disque est plein, IndexedDB refuse. L'application doit continuer de
 * fonctionner : la file vit alors en mémoire, et le coach est prévenu par
 * l'écran — pas par une page d'erreur au milieu de son appel.
 *
 * C'est `offlineStorageAvailable()` qui permet de le dire, plutôt que de le
 * laisser découvrir en perdant une saisie.
 */

const BASE = 'futuriste-hors-ligne';
const STORE = 'file-de-synchronisation';
const CLE = 'file';

function ouvrir(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(BASE, 1);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    // Une base bloquée par un autre onglet ne doit pas suspendre l'écran
    // indéfiniment : on renonce et on continue en mémoire.
    request.onblocked = () => resolve(null);
  });
}

/** Le stockage durable est-il utilisable sur cet appareil ? */
export async function offlineStorageAvailable(): Promise<boolean> {
  const db = await ouvrir();
  db?.close();
  return db !== null;
}

/** Relit la file gardée sur l'appareil. Une file illisible vaut une file vide. */
export async function loadQueue(): Promise<SyncQueue> {
  const db = await ouvrir();
  if (!db) return EMPTY_QUEUE;

  return new Promise((resolve) => {
    try {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(CLE);
      request.onsuccess = () => {
        const value = request.result;
        // On ne fait pas confiance à ce qu'on relit : un enregistrement
        // abîmé par une version précédente ne doit pas faire planter
        // l'ouverture de l'application.
        if (value && Array.isArray((value as SyncQueue).operations)) {
          resolve(value as SyncQueue);
        } else {
          resolve(EMPTY_QUEUE);
        }
        db.close();
      };
      request.onerror = () => {
        resolve(EMPTY_QUEUE);
        db.close();
      };
    } catch {
      resolve(EMPTY_QUEUE);
      db.close();
    }
  });
}

/**
 * Garde la file sur l'appareil.
 *
 * Rend `false` quand l'écriture n'a pas abouti — l'écran doit pouvoir dire au
 * coach que ce qu'il saisit ne survivra pas à une fermeture. Le taire
 * reviendrait à lui promettre une sécurité qu'on ne lui donne pas.
 */
export async function saveQueue(queue: SyncQueue): Promise<boolean> {
  const db = await ouvrir();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(queue, CLE);
      transaction.oncomplete = () => {
        resolve(true);
        db.close();
      };
      transaction.onerror = () => {
        resolve(false);
        db.close();
      };
      transaction.onabort = () => {
        resolve(false);
        db.close();
      };
    } catch {
      resolve(false);
      db.close();
    }
  });
}

/** Efface la file gardée. Réservé au dépannage, jamais au fonctionnement normal. */
export async function clearQueue(): Promise<void> {
  const db = await ouvrir();
  if (!db) return;
  try {
    db.transaction(STORE, 'readwrite').objectStore(STORE).delete(CLE);
  } catch {
    // Rien à faire : la file restera, et l'écran la montrera.
  }
  db.close();
}
