'use strict'

import * as http from 'http'
import * as express from 'express'

import { Metrics, MetricType } from '../../dist/index'

class App {
  public app: express.Application
  private readonly router: express.Router
  public readonly server: http.Server
  private readonly metrics: Metrics

  constructor (port: number) {

    this.app = express()

    this.router = express.Router()

    this.metrics = new Metrics({
      ignore: ['/bar'],
      disableErrorCounter: false,
      disableRouteCounter: false,
      disableDurationCounter: false,
      disableDefaultMetrics: false
    })

    this.metrics.addCustomMetric({
      name: 'test',
      help: 'Some Test Metric'
    }, MetricType.COUNTER)

    this.router.use(this.metrics.collect)

    this.router.get('/favicon.ico', (req, res) => res.status(204)) // No Favicon here

    this.router.get('/foo', (req:express.Request, res:express.Response) => {
      res.status(200).send('foo')
    })
    this.router.get('/bar', (req:express.Request, res:express.Response) => {
      this.metrics["test"].inc()
      res.status(200).send('bar')
    })
    this.router.get('/404', (req:express.Request, res:express.Response) => {
      res.status(404).end()
    })
    this.router.get('/401', (req:express.Request, res:express.Response) => {
      res.status(401).end()
    })
    this.router.get('/_metrics', this.metrics.endpoint)

    this.app.use(this.router)

    this.server = http.createServer(this.app)
    this.server.listen(port)
    console.log(`metrics-example is running on Port ${port as number}`)
  }
}
export default App
