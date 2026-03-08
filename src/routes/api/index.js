import { Router } from "express";
import { supabase } from "../../supabase/index.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ status: "ok" });
});

router.get("/arrivals", async (req, res) => {
  const { iata, start, end } = req.query;

  if (!iata || !start || !end) {
    return res.status(400).json({
      error: "Missing required query params: iata, start, end",
    });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return res.status(400).json({
      error: "start and end must be valid timestamp strings",
    });
  }

  if (startDate >= endDate) {
    return res.status(400).json({
      error: "start must be before end",
    });
  }

  try {
    const { data, error } = await supabase
      .from("flights")
      .select(
        "expected_arrival_time, seat_occupancy, seat_capacity, seat_capacity, arrival_airport_iata",
      )
      .eq("arrival_airport_iata", iata)
      .gte("expected_arrival_time", startDate.toISOString())
      .lt("expected_arrival_time", endDate.toISOString());

    if (error) {
      throw error;
    }

    const intervalMs = 10 * 60 * 1000;
    const windows = [];

    for (
      let ts = startDate.getTime();
      ts < endDate.getTime();
      ts += intervalMs
    ) {
      windows.push({
        start: new Date(ts),
        end: new Date(Math.min(ts + intervalMs, endDate.getTime())),
        passengers: 0,
      });
    }

    const coerceCount = (value) => {
      const num = Number.parseInt(value, 10);
      return Number.isFinite(num) && num > 0 ? num : 0;
    };

    for (const flight of data ?? []) {
      const arrival = new Date(flight.expected_arrival_time);
      if (Number.isNaN(arrival.getTime())) continue;

      const bucketIndex = Math.floor(
        (arrival.getTime() - startDate.getTime()) / intervalMs,
      );

      if (bucketIndex < 0 || bucketIndex >= windows.length) continue;

      const passengers =
        coerceCount(flight.seat_occupancy) ||
        coerceCount(flight.seat_cappacity) ||
        coerceCount(flight.seat_capacity);

      windows[bucketIndex].passengers += passengers;
    }

    return res.json({
      airport: iata,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      windowMinutes: 10,
      buckets: windows.map((w) => ({
        start: w.start.toISOString(),
        end: w.end.toISOString(),
        passengers: w.passengers,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to retrieve arrivals forecast",
      detail: err.message,
    });
  }
});

export default router;
