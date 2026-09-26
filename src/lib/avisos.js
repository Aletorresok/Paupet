import { supabase, MODO_DEMO } from './supabase';

// Avisos al celular (web push). La clave pública va en el código; la privada sólo en Vercel.
export const VAPID_PUBLIC = 'BMllZChdO3JRs_slTliwQtiiqobIo9Z2A75O2aQJwiuxheFoY5Iry9hxfrmW8EeD1ad1kW7nQYtntGw9QcqqAB8';

export const soportaAvisos = () =>
  !MODO_DEMO && typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const aBytes = b64 => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, c => c.charCodeAt(0));
};

export async function registrarServiceWorker() {
  if (!soportaAvisos()) return null;
  try { return await navigator.serviceWorker.register('/sw.js'); } catch { return null; }
}

// 'no-soportado' | 'bloqueado' | 'activo' | 'inactivo' (en ESTE dispositivo).
export async function estadoAvisos() {
  if (!soportaAvisos()) return 'no-soportado';
  if (Notification.permission === 'denied') return 'bloqueado';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && await reg.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'activo' : 'inactivo';
}

export async function activarAvisos() {
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') throw new Error('No se dio permiso para mostrar avisos. Se puede cambiar en los ajustes del navegador.');
  const reg = (await registrarServiceWorker()) || await navigator.serviceWorker.ready;
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(VAPID_PUBLIC) });
  const j = sub.toJSON();
  const { data } = await supabase.auth.getUser();
  const { error } = await supabase.from('push_suscripciones').upsert({
    endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth,
    usuario: data?.user?.email || '', dispositivo: navigator.userAgent.slice(0, 200),
  }, { onConflict: 'endpoint' });
  if (error) throw error;
}

export async function desactivarAvisos() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && await reg.pushManager.getSubscription();
  if (!sub) return;
  await supabase.from('push_suscripciones').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}

// Pide a la función de Vercel un aviso de prueba para los celulares de este usuario.
export async function probarAviso() {
  const { data } = await supabase.auth.getSession();
  const r = await fetch('/api/probar-aviso', { method: 'POST', headers: { Authorization: `Bearer ${data?.session?.access_token || ''}` } });
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(cuerpo.error || `Error ${r.status}`);
  return cuerpo;
}
