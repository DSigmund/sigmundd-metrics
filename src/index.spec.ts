import { Metrics } from './index'

const MockExpressRequest = require('mock-express-request')

const mockResponse = (statusCode?: number): any => {
  const res: any = {}
  res._status = 0
  res.status = function (value: number) { this._status = value }
  res._set = {}
  res.set = function (key: string, value: any) { this._set[key] = value }
  res._end = {}
  res.end = function (value: any) { this._end = value }
  res.locals = {}
  res.on = function (event: string, fn: any) { fn() }
  res.statusCode = typeof statusCode !== 'undefined' ? statusCode : 200
  return res
}

describe('metrics', () => {
  beforeEach(() => {
    jest.resetModules()
  })
  describe('constructor / options', () => {
    it('should enable all 3 checks and default metrics by default', () => {
      const metrics = new Metrics({})
      expect(metrics._disableDurationCounter).toBeFalsy()
      expect(metrics._disableErrorCounter).toBeFalsy()
      expect(metrics._disableRouteCounter).toBeFalsy()
      expect(metrics._disableDefaultMetrics).toBeFalsy()
    })
    it('should disable Route Counter if option is given', () => {
      const metrics = new Metrics({
        disableRouteCounter: true
      })
      expect(metrics._disableDurationCounter).toBeFalsy()
      expect(metrics._disableErrorCounter).toBeFalsy()
      expect(metrics._disableRouteCounter).toBeTruthy()
      expect(metrics._disableDefaultMetrics).toBeFalsy()
    })
    it('should disable Error Counter if option is given', () => {
      const metrics = new Metrics({
        disableErrorCounter: true
      })
      expect(metrics._disableDurationCounter).toBeFalsy()
      expect(metrics._disableErrorCounter).toBeTruthy()
      expect(metrics._disableRouteCounter).toBeFalsy()
      expect(metrics._disableDefaultMetrics).toBeFalsy()
    })
    it('should disable Duration Counter if option is given', () => {
      const metrics = new Metrics({
        disableDurationCounter: true
      })
      expect(metrics._disableDurationCounter).toBeTruthy()
      expect(metrics._disableErrorCounter).toBeFalsy()
      expect(metrics._disableRouteCounter).toBeFalsy()
      expect(metrics._disableDefaultMetrics).toBeFalsy()
    })

    it('should disable Default Metrics if option is given', () => {
      const metrics = new Metrics({
        disableDefaultMetrics: true
      })
      expect(metrics._disableDurationCounter).toBeFalsy()
      expect(metrics._disableErrorCounter).toBeFalsy()
      expect(metrics._disableRouteCounter).toBeFalsy()
      expect(metrics._disableDefaultMetrics).toBeTruthy()
    })

    it('should ignore /_metrics and /favicon.ico by default', () => {
      const metrics = new Metrics()
      expect(metrics._ignore.length).toBe(2)
      expect(metrics._ignore).toContain('/_metrics')
      expect(metrics._ignore).toContain('/favicon.ico')
    })
    it('should ignore given Routes, /_metrics and /favicon.ico by option', () => {
      const metrics = new Metrics({
        ignore: ['/foo', '/bar']
      })
      expect(metrics._ignore.length).toBe(4)
      expect(metrics._ignore).toContain('/foo')
      expect(metrics._ignore).toContain('/bar')
      expect(metrics._ignore).toContain('/_metrics')
      expect(metrics._ignore).toContain('/favicon.ico')
    })
  })
  describe('collect()', () => {
    it('should measure all 3 checks by default', () => {
      const metrics = new Metrics({})
      const req = new MockExpressRequest()
      req.originalUrl = '/test'
      req.method = 'GET'
      const res = mockResponse()
      metrics.collect(req, res, () => { /**/ })
      metrics.collect(req, mockResponse(400), () => { /**/ })
      expect(metrics._client.register._metrics.numOfRequests.hashMap['route:/test'].value).toBe(2)
      expect(metrics._client.register._metrics.numOfErrors.hashMap['error:400'].value).toBe(1)
      expect(metrics._client.register._metrics.http_request_duration_ms.hashMap['code:200,method:GET,route:/test'].count).toBe(1)
    })

    it('should disable Route Counter if option is given', () => {
      const metrics = new Metrics({
        disableRouteCounter: true
      })
      const req = new MockExpressRequest()
      req.originalUrl = '/test'
      req.method = 'GET'
      const res = mockResponse(404)
      metrics.collect(req, res, () => { /**/ })
      expect(metrics._client.register._metrics.numOfErrors.hashMap['error:404'].value).toBe(1)
      expect(metrics._client.register._metrics.numOfRequests).toBeUndefined()
      expect(metrics._client.register._metrics.http_request_duration_ms.hashMap['code:404,method:GET,route:/test'].count).toBe(1)
    })
    it('should disable Error Counter if option is given', () => {
      const metrics = new Metrics({
        disableErrorCounter: true
      })
      const req = new MockExpressRequest()
      req.originalUrl = '/test'
      req.method = 'GET'
      const res = mockResponse(404)
      metrics.collect(req, res, () => { /**/ })
      expect(metrics._client.register._metrics.numOfErrors).toBeUndefined()
      expect(metrics._client.register._metrics.numOfRequests.hashMap['route:/test'].value).toBe(1)
      expect(metrics._client.register._metrics.http_request_duration_ms.hashMap['code:404,method:GET,route:/test'].count).toBe(1)
    })
    it('should disable Duration Counter if option is given', () => {
      const metrics = new Metrics({
        disableDurationCounter: true
      })
      const req = new MockExpressRequest()
      req.originalUrl = '/test'
      req.method = 'GET'
      const res = mockResponse(404)
      metrics.collect(req, res, () => { /**/ })
      expect(metrics._client.register._metrics.numOfErrors.hashMap['error:404'].value).toBe(1)
      expect(metrics._client.register._metrics.numOfRequests.hashMap['route:/test'].value).toBe(1)
      expect(metrics._client.register._metrics.http_request_duration_ms).toBeUndefined()
    })
    it('should ignore urls in _ignore', () => {
      const metrics = new Metrics({})
      const req = new MockExpressRequest()
      req.originalUrl = '/_metrics'
      req.method = 'GET'
      const res = mockResponse()
      metrics.collect(req, res, () => { /**/ })
      expect(metrics._client.register._metrics.numOfRequests.hashMap).toMatchObject({})
      expect(metrics._client.register._metrics.numOfErrors.hashMap).toMatchObject({})
      expect(metrics._client.register._metrics.http_request_duration_ms.hashMap).toMatchObject({})
    })
  })
  describe('endpoint()', () => {
    it('should display all 3 basic metrics and default metrics by default', () => {
      const metrics = new Metrics({})
      const req = new MockExpressRequest()
      const res = mockResponse()
      metrics.endpoint(req, res)
      expect(res._status).toBe(200)
      expect(res._set['Content-Type']).toBe('text/plain; version=0.0.4; charset=utf-8')
      expect(res._end).toMatch(/http_request_duration_ms/)
      expect(res._end).toMatch(/numOfRequests/)
      expect(res._end).toMatch(/numOfErrors/)
      expect(res._end).toMatch(/process_cpu_user_seconds_total/)
    })
    it('should not scrape default metrics if disabled', () => {
      const metrics = new Metrics({
        disableDefaultMetrics: true
      })
      const req = new MockExpressRequest()
      const res = mockResponse()
      metrics.endpoint(req, res)
      expect(res._status).toBe(200)
      expect(res._set['Content-Type']).toBe('text/plain; version=0.0.4; charset=utf-8')
      expect(res._end).toMatch(/http_request_duration_ms/)
      expect(res._end).toMatch(/numOfRequests/)
      expect(res._end).toMatch(/numOfErrors/)
      expect(res._end).not.toMatch(/process_cpu_user_seconds_total/)
    })
  })
})
