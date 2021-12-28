module.exports = {
  plugins: {
    tailwindcss: {},
    ...(process.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
}
