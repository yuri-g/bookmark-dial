module.exports = {
  content: ["./src/*.ts", "./index.html"],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/line-clamp')],
}
