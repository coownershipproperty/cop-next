export default function handler(req, res) {
  return res.status(410).json({ error: 'One-time code sign-in has been disabled. Use email and password.' });
}
