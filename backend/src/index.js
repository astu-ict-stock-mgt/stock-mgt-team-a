import app from './app.js'

const PORT = process.env.PORT || 3001

// Trigger dev server reload: 2026-09-16 17:36
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})


