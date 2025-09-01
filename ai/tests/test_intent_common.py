from common.intent import analyze_intent, IntentAnalyzer


def test_intent_event_timing_id():
    assert analyze_intent("Kapan acara?", "id") == "event_timing"


def test_intent_event_pricing_id():
    assert analyze_intent("Harga sponsor?", "id") == "event_pricing"


def test_intent_business_analysis_en():
    assert analyze_intent("ROI analysis and metrics", "en") == "business_analysis"


def test_intent_location_en():
    ia = IntentAnalyzer()
    assert ia.analyze_intent("Where is the venue?", "en") == "event_location"

