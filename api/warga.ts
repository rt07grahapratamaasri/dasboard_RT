import { db } from './db';

export default async function handler(req: any, res: any) {
  const { method } = req;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!db) return res.status(500).json({ error: 'Database config missing' });

    if (method === 'GET') {
      const { rows } = await db.query('SELECT * FROM warga');
      return res.status(200).json({ data: rows });
    }
    
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      }
      
      const { id, nik, nama, jenisKelamin, agama, blok, status } = body;
      await db.query(
        'INSERT INTO warga (id, nik, nama, jenisKelamin, agama, blok, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [String(id), String(nik), String(nama), String(jenisKelamin), String(agama), String(blok), String(status)]
      );
      return res.status(201).json({ success: true, message: 'Warga added' });
    }

    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      }
      
      const { id } = req.query;
      const targetId = String(id || body.id);
      
      const { nik, nama, jenisKelamin, agama, blok, status } = body;
      await db.query(
        'UPDATE warga SET nik=$1, nama=$2, jenisKelamin=$3, agama=$4, blok=$5, status=$6 WHERE id=$7',
        [String(nik), String(nama), String(jenisKelamin), String(agama), String(blok), String(status), targetId]
      );
      return res.status(200).json({ success: true, message: 'Warga updated' });
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      await db.query('DELETE FROM warga WHERE id=$1', [String(id)]);
      return res.status(200).json({ success: true, message: 'Warga deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
