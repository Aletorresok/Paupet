import { supabase } from './supabase';
import { DEFAULT_CONFIG } from './constants';
import { todayStr } from './utils';

// Capa de datos: todas las queries a Supabase.
export const db = {
  async uploadFoto(file, clienteId) {
    const ext = file.name.split('.').pop();
    const path = `clientes/${clienteId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('fotos').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('fotos').getPublicUrl(path);
    return data.publicUrl;
  },

  async getClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*, visitas(*)')
      .order('dog', { ascending: true });
    if (error) throw error;
    const seen = new Set();
    return data
      .filter(c => {
        const key = `${c.dog?.toLowerCase().trim()}|${c.owner?.toLowerCase().trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(c => ({
        ...c,
        visitas: (c.visitas || []).map(v => ({
          id: v.id,
          servicio: v.servicio,
          precio: v.precio,
          fecha: v.fecha,
          forma_pago: v.forma_pago || 'efectivo',
          cliente_id: v.cliente_id,
        }))
      }));
  },
  async insertCliente(c) {
    const { data, error } = await supabase
      .from('clientes')
      .insert({ dog:c.dog, owner:c.owner, raza:c.raza||'', size:c.size||'', pelaje:c.pelaje||'', tel:c.tel||'', notes:c.notes||'', foto:c.foto||null, inasistencias:0 })
      .select('*, visitas(*)')
      .single();
    if (error) throw error;
    return { ...data, visitas: [] };
  },
  async updateCliente(id, fields) {
    const allowed = ['dog','owner','raza','size','pelaje','tel','notes','foto','inasistencias'];
    const update = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
    const { error } = await supabase.from('clientes').update(update).eq('id', id);
    if (error) throw error;
  },
  async deleteCliente(id) {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
  },

  async insertVisita(clienteId, servicio, precio, fecha, formaPago = 'efectivo') {
    const { error } = await supabase
      .from('visitas')
      .insert({ cliente_id: clienteId, servicio, precio, fecha, forma_pago: formaPago });
    if (error) throw error;
  },
  async updateVisita(id, fields) {
    const { error } = await supabase.from('visitas').update(fields).eq('id', id);
    if (error) throw error;
  },
  async deleteVisita(id) {
    const { error } = await supabase.from('visitas').delete().eq('id', id);
    if (error) throw error;
  },

  async getTurnos() {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .order('fecha', { ascending: true });
    if (error) throw error;
    return data.map(t => ({
      ...t,
      clientId: t.cliente_id,
      dogName: t.dog_name,
      fromPortal: t.from_portal,
      formaPago: t.forma_pago || 'efectivo',
    }));
  },
  async insertTurno(t) {
    const { data, error } = await supabase.from('turnos').insert({
      cliente_id: t.clientId,
      dog_name: t.dogName || '',
      servicio: t.servicio,
      fecha: t.fecha,
      hora: t.hora || '',
      precio: t.precio || 0,
      estado: t.estado || 'pending',
      from_portal: t.fromPortal || false,
      forma_pago: t.formaPago || 'efectivo',
    }).select('id').single();
    if (error) throw error;
    return data;
  },
  async updateTurno(id, fields) {
    const mapped = { ...fields };
    if ('clientId' in mapped) { mapped.cliente_id = mapped.clientId; delete mapped.clientId; }
    if ('dogName' in mapped) { mapped.dog_name = mapped.dogName; delete mapped.dogName; }
    if ('formaPago' in mapped) { mapped.forma_pago = mapped.formaPago; delete mapped.formaPago; }
    const { error } = await supabase.from('turnos').update(mapped).eq('id', id);
    if (error) throw error;
  },
  async deleteTurno(id) {
    const { error } = await supabase.from('turnos').delete().eq('id', id);
    if (error) throw error;
  },

  async getNotas() {
    const { data, error } = await supabase.from('notas').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(n => ({ ...n, notas: n.notas_texto }));
  },
  async insertNota(n) {
    const { error } = await supabase.from('notas').insert({
      tipo: n.tipo,
      item: n.item || '',
      cantidad: n.cantidad || 1,
      precio: n.precio || 0,
      notas_texto: n.notas || '',
      concepto: n.concepto || '',
      categoria: n.categoria || '',
      monto: n.monto || 0,
      fecha: n.fecha || todayStr(),
      completada: false,
    });
    if (error) throw error;
  },
  async updateNota(id, fields) {
    const { error } = await supabase.from('notas').update(fields).eq('id', id);
    if (error) throw error;
  },
  async deleteNota(id) {
    const { error } = await supabase.from('notas').delete().eq('id', id);
    if (error) throw error;
  },

  async getConfig() {
    const { data, error } = await supabase.from('config').select('*').eq('id', 1).single();
    if (error) return DEFAULT_CONFIG;
    return {
      nombre: data.nombre,
      msg: data.msg,
      anticip: data.anticip,
      horarios: data.horarios || DEFAULT_CONFIG.horarios,
      slots: data.slots || {},
      horariosSemanales: data.horarios_semanales || null,
    };
  },
  async saveConfig(cfg) {
    const { error } = await supabase.from('config').upsert({
      id: 1,
      nombre: cfg.nombre,
      msg: cfg.msg,
      anticip: cfg.anticip,
      horarios: cfg.horarios,
      slots: cfg.slots,
      horarios_semanales: cfg.horariosSemanales || null,
    });
    if (error) throw error;
  },
};
