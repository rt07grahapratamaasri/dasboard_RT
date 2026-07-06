import { db } from './_db';

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
      const { rows } = await db.query('SELECT * FROM keuangan ORDER BY tanggal DESC');
      return res.status(200).json({ data: rows });
    }
    
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      }
      
      const { id, tanggal, keterangan, tipe, nominal } = body;
      await db.query(
        'INSERT INTO keuangan (id, tanggal, keterangan, tipe, nominal) VALUES ($1, $2, $3, $4, $5)',
        [String(id), String(tanggal), String(keterangan), String(tipe), Number(nominal)]
      );
      return res.status(201).json({ success: true, message: 'Transaksi added' });
    }

    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      }
      
      const { id } = req.query;
      const targetId = String(id || body.id);
      
      if (Object.keys(body).length === 1 && body.nominal !== undefined) {
         await db.query('UPDATE keuangan SET nominal=$1 WHERE id=$2', [Number(body.nominal), targetId]);
      } else {
         const { tanggal, keterangan, tipe, nominal } = body;
         await db.query(
           'UPDATE keuangan SET tanggal=$1, keterangan=$2, tipe=$3, nominal=$4 WHERE id=$5',
           [String(tanggal), String(keterangan), String(tipe), Number(nominal), targetId]
         );
      }
      return res.status(200).json({ success: true, message: 'Transaksi updated' });
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      await db.query('DELETE FROM keuangan WHERE id=$1', [String(id)]);
      return res.status(200).json({ success: true, message: 'Transaksi deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
