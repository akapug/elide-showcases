import { ts } from "./timeseries.py";

const values = [10, 12, 15, 18, 22, 25];
console.log("Trend:", ts.detect_trend(values));
console.log("Forecast:", ts.forecast(values, 3));
