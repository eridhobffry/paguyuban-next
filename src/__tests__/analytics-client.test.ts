import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { trackCtaClick, trackDownloadClick } from "../lib/analytics/client";

describe("analytics lightweight helpers", () => {
  const addEventListenerSpy = vi.fn();
  const removeEventListenerSpy = vi.fn();
  let dispatchSpy: MockInstance;

  beforeEach(() => {
    // @ts-expect-error jsdom window typing compatibility
    global.window = {
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
      dispatchEvent: vi.fn(),
    } as unknown as Window;
    dispatchSpy = vi.spyOn(window, "dispatchEvent");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error cleanup
    delete global.window;
  });

  it("dispatches analytics-track custom event for cta clicks", () => {
    trackCtaClick({ section: "hero", cta: "View", href: "#x", type: "demo" });
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const evt = dispatchSpy!.mock.calls[0][0] as CustomEvent;
    expect(evt.detail.type).toBe("cta_click");
    expect(evt.detail.data.section).toBe("hero");
    expect(evt.detail.data.metadata.cta).toBe("View");
    expect(evt.detail.data.metadata.href).toBe("#x");
    expect(evt.detail.data.metadata.type).toBe("demo");
  });

  it("dispatches analytics-track custom event for downloads", () => {
    trackDownloadClick({
      section: "docs",
      cta: "Download",
      href: "/docs/x.pdf",
    });
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const evt = dispatchSpy!.mock.calls[0][0] as CustomEvent;
    expect(evt.detail.type).toBe("download_click");
    expect(evt.detail.data.section).toBe("docs");
    expect(evt.detail.data.metadata.cta).toBe("Download");
    expect(evt.detail.data.metadata.href).toBe("/docs/x.pdf");
  });
});
