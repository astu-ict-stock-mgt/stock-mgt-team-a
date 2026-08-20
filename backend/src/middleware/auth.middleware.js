import jwt from 'jsonwebtoken'

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token missing or invalid' })
  }

  try {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret'
    const decoded = jwt.verify(token, secret)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' })
  }
}