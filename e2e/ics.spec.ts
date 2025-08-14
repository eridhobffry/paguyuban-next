import { test, expect } from "@playwright/test";

test("calendar ICS is downloadable and valid-looking", async ({ request }) => {
  const res = await request.get("/calendar/event.ics");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("BEGIN:VCALENDAR");
  expect(body).toContain("END:VCALENDAR");
});
