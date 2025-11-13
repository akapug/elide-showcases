export const config = { runtime: 'nodejs' };

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send('ok');
}
