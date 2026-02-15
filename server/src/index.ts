import { Hono } from 'hono'
import { cors } from 'hono/cors'
import guitar from './routes/guitar'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: [
      'https://johnverrone.com',
      'https://www.johnverrone.com',
      'http://localhost:5173',
    ],
    allowMethods: ['GET', 'OPTIONS'],
  })
)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/guitar', guitar)

export default app
