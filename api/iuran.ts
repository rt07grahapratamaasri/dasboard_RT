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
      const { rows } = await db.query('SELECT * FROM iuran');
      // Convert tinyint/boolean
      const mapped = rows.map((row: any) => ({
        ...row,
        isPaid: Boolean(row.isPaid || row.ispaid) // postgres sometimes lowercases columns depending on quotes
      }));
      return res.status(200).json({ data: mapped });
    }
    
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      }
      
      const { id, wargaId, bulan, tahun, isPaid, nominal } = body;
      await db.query(
        'INSERT INTO iuran (id, "wargaId", bulan, tahun, "isPaid", nominal) VALUES ($1, $2, $3, $4, $5, $6)',
        [String(id), String(wargaId), Number(bulan), Number(tahun), Boolean(isPaid), Number(nominal)]
      );
      return res.status(201).json({ success: true, message: 'Iuran added' });
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      await db.query('DELETE FROM iuran WHERE id=$1', [String(id)]);
      return res.status(200).json({ success: true, message: 'Iuran deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
