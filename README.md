# Sigmundd-Metrics

A small express middleware to get base metrics for any node.js app.


## Installation

- `npm install --save sigmundd-metrics`

## Usage

`import { Metrics, MetricType } from 'sigmundd-metrics'`  
`let metrics = new Metrics(options)`

Note: The options Part may be omitted, as all parts are optional.  

Before your Routes:  
`router.use(metrics.collect)`  

And to enable the *_metrics*-Endpoint:  
`router.get('/_metrics', metrics.endpoint)`  

### Custom Metrics

To Add your own custom Metrics:
`metrics.addCustomMetric({
      name: 'test',
      help: 'Some Test Metric'
    }, TYPE)`

where TYPE is one of:

- `MetricType.COUNTER`
- `MetricType.GAUGE`
- `MetricType.HISTOGRAM`
- `MetricType.SUMMARY`

All metrics can take a labelNames property in the configuration object. All labelNames that the metric support needs to be declared here. There are 2 ways to add values to the labels

```js
metrics.addCustomMetric({
  name: 'metric_name',
  help: 'metric_help',
  labelNames: ['method', 'statusCode'],
}, MetricType.GAUGE);

metrics.customMetrics["NAME"].set({ method: 'GET', statusCode: '200' }, 100); // 1st version, Set value 100 with method set to GET and statusCode to 200
metrics.customMetrics["NAME"].labels('GET', '200').set(100); // 2nd version, Same as above
```

It is also possible to use timers with labels, both before and after the timer is created:

```js
const end = metrics.customMetrics["NAME"].startTimer({ method: 'GET' }); // Set method to GET, we don't know statusCode yet
xhrRequest(function (err, res) {
  if (err) {
    end({ statusCode: '500' }); // Sets value to xhrRequest duration in seconds with statusCode 500
  } else {
    end({ statusCode: '200' }); // Sets value to xhrRequest duration in seconds with statusCode 200
  }
});
```

#### Counter

Counters go up, and reset when the process restarts.

- `metrics.customMetrics["NAME"].inc(); // Inc with 1`
- `metrics.customMetrics["NAME"].inc(10); // Inc with 10`

#### Gauge

Gauges are similar to Counters but Gauges value can be decreased.

- `metrics.customMetrics["NAME"].set(10); // Set to 10`
- `metrics.customMetrics["NAME"].inc(); // Inc with 1`
- `metrics.customMetrics["NAME"].inc(10); // Inc with 10`
- `metrics.customMetrics["NAME"].dec(); // Dec with 1`
- `metrics.customMetrics["NAME"].dec(10); // Dec with 10`

#### Histograms

Histograms track sizes and frequency of events.

`metrics.customMetrics["NAME"].observe(10);  // Observe value in histogram`

Utility to observe request durations

```js
const end = metrics.customMetrics["NAME"].startTimer();
xhrRequest(function (err, res) {
  const seconds = end(); // Observes and returns the value to xhrRequests duration in seconds
});
```

#### Summary

Summaries calculate percentiles of observed values.

`metrics.customMetrics["NAME"].observe(10);`

Utility to observe request durations

```js
const end = metrics.customMetrics["NAME"].startTimer();
xhrRequest(function (err, res) {
  end(); // Observes the value to xhrRequests duration in seconds
});
```

### Options

The Following Options may be used to configure the behaviour.

- ignore: A String Array with routes to ignore, e.g. ['/foo'] . Default: []. Important: */_metrics* and */favicon.ico* are always ignored
- disableErrorCounter: Disable the Error Counter. Default: false
- disableRouteCounter: Disable the Route Counter. Default: false
- disableDurationCounter: Disable the Duration Counter. Default: false
- disableDefaultMetrics: Disable the Collection of default metrics. Default: false

#### Default Metrics

- process_cpu_user_seconds_total Total user CPU time spent in seconds.
- process_cpu_system_seconds_total Total system CPU time spent in seconds.
- process_cpu_seconds_total Total user and system CPU time spent in seconds.
- process_start_time_seconds Start time of the process since unix epoch in seconds.
- process_resident_memory_bytes Resident memory size in bytes.
- nodejs_eventloop_lag_seconds Lag of event loop in seconds.
- nodejs_eventloop_lag_min_seconds The minimum recorded event loop delay.
- nodejs_eventloop_lag_max_seconds The maximum recorded event loop delay.
- nodejs_eventloop_lag_mean_seconds The mean of the recorded event loop delays.
- nodejs_eventloop_lag_stddev_seconds The standard deviation of the recorded event loop delays.
- nodejs_eventloop_lag_p50_seconds The 50th percentile of the recorded event loop delays.
- nodejs_eventloop_lag_p90_seconds The 90th percentile of the recorded event loop delays.
- nodejs_eventloop_lag_p99_seconds The 99th percentile of the recorded event loop delays.
- nodejs_active_handles Number of active libuv handles grouped by handle type. Every handle type is C++ class name.
- nodejs_active_handles_total Total number of active handles.
- nodejs_active_requests Number of active libuv requests grouped by request type. Every request type is C++ class name.
- nodejs_active_requests_total Total number of active requests.
- nodejs_heap_size_total_bytes Process heap size from Node.js in bytes.
- nodejs_heap_size_used_bytes Process heap size used from Node.js in bytes.
- nodejs_external_memory_bytes Node.js external memory size in bytes.
- nodejs_heap_space_size_total_bytes Process heap space size total from Node.js in bytes.
- nodejs_heap_space_size_used_bytes Process heap space size used from Node.js in bytes.
- nodejs_heap_space_size_available_bytes Process heap space size available from Node.js in bytes.
- nodejs_version_info Node.js version info.

## Examples

You can find prebuilt examples in the fitting folder.

Just call `node examples/dist/server.js 3000` to start a Test-Server on Port 3000.

Then use your Browser to call the Endpoints:  

- /foo
- /bar
- /404
- /401

And check the results on the Endpoint */_metrics*
