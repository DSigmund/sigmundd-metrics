import * as express from 'express'

export interface Options {
  ignore: string[]
  disableRouteCounter: boolean
  disableErrorCounter: boolean
  disableDurationCounter: boolean
  disableDefaultMetrics: boolean
}

export interface CustomMetric {
  name: string
  help: string
  labelNames?: string[]
}

export enum MetricType {
  GAUGE,
  COUNTER,
  HISTOGRAM,
  SUMMARY
}

export class Metrics {
  public readonly _ignore: string[]
  public readonly _disableRouteCounter: boolean
  public readonly _disableErrorCounter: boolean
  public readonly _disableDurationCounter: boolean
  public readonly _disableDefaultMetrics: boolean

  public readonly _client: any

  public readonly _httpRequestDurationMicroseconds: any
  public readonly _numOfRequests: any
  public readonly _numOfErrors: any

  public readonly customMetrics: any

  constructor (options: Partial<Options> = {}) {
    this._client = require('prom-client')
    this.customMetrics = {}

    if (typeof options.ignore !== 'undefined') {
      this._ignore = options.ignore
      this._ignore.push('/_metrics')
      this._ignore.push('/favicon.ico')
    } else {
      this._ignore = ['/_metrics', '/favicon.ico']
    }
    if (typeof options.disableRouteCounter !== 'undefined') {
      this._disableRouteCounter = options.disableRouteCounter
    } else {
      this._disableRouteCounter = false
    }
    if (typeof options.disableErrorCounter !== 'undefined') {
      this._disableErrorCounter = options.disableErrorCounter
    } else {
      this._disableErrorCounter = false
    }
    if (typeof options.disableDurationCounter !== 'undefined') {
      this._disableDurationCounter = options.disableDurationCounter
    } else {
      this._disableDurationCounter = false
    }
    if (typeof options.disableDefaultMetrics !== 'undefined') {
      this._disableDefaultMetrics = options.disableDefaultMetrics
    } else {
      this._disableDefaultMetrics = false
    }
    if (!this._disableDefaultMetrics) {
      this._client.collectDefaultMetrics()
    }
    if (!this._disableErrorCounter) {
      this._numOfErrors = new this._client.Counter({
        name: 'numOfErrors',
        help: 'Number of errors',
        labelNames: ['error']
      })
    }
    if (!this._disableRouteCounter) {
      this._numOfRequests = new this._client.Counter({
        name: 'numOfRequests',
        help: 'Number of requests made to a route',
        labelNames: ['route']
      })
    }
    if (!this._disableDurationCounter) {
      this._httpRequestDurationMicroseconds = new this._client.Histogram({
        name: 'http_request_duration_ms',
        help: 'Duration of HTTP requests in ms',
        labelNames: ['method', 'route', 'code'],
        buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]
      })
    }
  }

  public addCustomMetric = (options: CustomMetric, type: MetricType): void => {
    switch (type) {
      case MetricType.COUNTER:
        this.customMetrics[options.name] = new this._client.Counter(options)
        break
      case MetricType.GAUGE:
        this.customMetrics[options.name] = new this._client.Gauge(options)
        break
      case MetricType.HISTOGRAM:
        this.customMetrics[options.name] = new this._client.Histogram(options)
        break
      case MetricType.SUMMARY:
        this.customMetrics[options.name] = new this._client.Summary(options)
        break
      default:
        break
    }
  }

  public collect = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    res.locals.startEpoch = Date.now()
    res.on('finish', () => {
      if (!this._ignore.includes(req.originalUrl)) {
        const responseTimeInMs = Date.now() - res.locals.startEpoch
        if (!this._disableDurationCounter) {
          this._httpRequestDurationMicroseconds
            .labels(req.method, req.originalUrl, res.statusCode.toString())
            .observe(responseTimeInMs)
        }
        if (!this._disableRouteCounter) {
          this._numOfRequests.inc({ route: req.originalUrl })
        }
        if (res.statusCode >= 400) {
          if (!this._disableErrorCounter) {
            this._numOfErrors.inc({ error: res.statusCode })
          }
        }
      }
    })
    next()
  }

  public endpoint = (req: express.Request, res: express.Response): void => {
    res.set('Content-Type', this._client.register.contentType)
    res.status(200)
    res.end(this._client.register.metrics())
  }

  public resetMetrics = (): void => {
    this._client.register.resetMetrics()
  }
}
export default Metrics
