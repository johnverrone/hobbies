import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { mcpHandler } from './mcp'
import guitar from './routes/guitar'
import coffee from './routes/coffee'
import software from './routes/software'
import running from './routes/running'
import strength from './routes/strength'
import video from './routes/video'
import photography from './routes/photography'
import golf from './routes/golf'

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
app.route('/coffee', coffee)
app.route('/software', software)
app.route('/running', running)
app.route('/strength', strength)
app.route('/video', video)
app.route('/photography', photography)
app.route('/golf', golf)

app.all('/mcp', (c) => {
  const auth = c.req.header('Authorization')
  const expected = (c.env as Record<string, string | undefined>).MCP_AUTH_TOKEN
  if (!expected || auth !== `Bearer ${expected}`) {
    return c.text('Unauthorized', 401)
  }
  return mcpHandler(c)
})

export default app
