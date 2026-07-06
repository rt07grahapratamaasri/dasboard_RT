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
    if (!db) {
      return res.status(500).json({ error: 'Database configuration missing (DATABASE_URL/POSTGRES_URL not found)' });
    }

    if (method === 'GET') {
      const { rows } = await db.query('SELECT * FROM users');
      return res.status(200).json({ data: rows });
    }
    
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      }
      
      const { username, password, role } = body;
      await db.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        [String(username), String(password), String(role)]
      );
      return res.status(201).json({ success: true, message: 'User added' });
    }

    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      }
      
      const { username } = req.query; // old username
      const targetUser = String(username || body.oldUsername);
      
      const { newUsername, password, role } = body;
      
      await db.query(
        'UPDATE users SET username=$1, password=$2, role=$3 WHERE username=$4',
        [String(newUsername), String(password), String(role), targetUser]
      );
      return res.status(200).json({ success: true, message: 'User updated' });
    }

    if (method === 'DELETE') {
      const { username } = req.query;
      await db.query('DELETE FROM users WHERE username=$1', [String(username)]);
      return res.status(200).json({ success: true, message: 'User deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
