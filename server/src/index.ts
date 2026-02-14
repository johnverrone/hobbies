import { Hono } from 'hono'
import guitar from './routes/guitar'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/guitar', guitar)

export default app
