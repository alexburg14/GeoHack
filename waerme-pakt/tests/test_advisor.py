import json
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from lib import advisor
from lib import cost_model as cm


class FakeClaude(BaseHTTPRequestHandler):
    """Stands in for the Messages API; replies with whatever the test queued."""

    reply = None
    seen = []

    def log_message(self, *args):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        FakeClaude.seen.append({"path": self.path, "headers": {k.lower(): v for k, v in self.headers.items()}, "body": body})
        status, payload = FakeClaude.reply
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def text_reply(text, stop_reason="end_turn"):
    return 200, {"content": [{"type": "thinking", "thinking": ""}, {"type": "text", "text": text}], "stop_reason": stop_reason}


class AdvisorTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), FakeClaude)
        cls.base_url = f"http://127.0.0.1:{cls.server.server_address[1]}"
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        a = cm.load_assumptions()
        check = {"strasse": "Jägerstraße", "phase_label": "Bauphase 2", "status": "Zusagen werden gesammelt",
                 "anschluss": "2029", "quote": 0.61, "schwelle": 0.65}
        cls.context = advisor.build_context(check, None, None, None, a)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def setUp(self):
        FakeClaude.seen = []

    def ask(self, question):
        return advisor.answer([{"role": "user", "content": question}], self.context, "test-key", base_url=self.base_url)

    def test_request_shape(self):
        FakeClaude.reply = text_reply("Hallo!")
        self.ask("Wann kommt der Anschluss?")
        req = FakeClaude.seen[0]
        self.assertEqual(req["path"], "/v1/messages")
        self.assertEqual(req["headers"]["x-api-key"], "test-key")
        self.assertEqual(req["headers"]["anthropic-version"], advisor.API_VERSION)
        self.assertEqual(req["headers"]["anthropic-beta"], advisor.FALLBACK_BETA)
        body = req["body"]
        self.assertEqual(body["model"], advisor.DEFAULT_MODEL)
        self.assertEqual(body["fallbacks"], "default")
        self.assertEqual(body["output_config"], {"effort": "low"})
        self.assertNotIn("thinking", body)
        self.assertIn("Jägerstraße", body["system"])
        self.assertIn("Wartegarantie", body["system"])
        self.assertEqual(body["messages"][-1], {"role": "user", "content": "Wann kommt der Anschluss?"})

    def test_text_reply_skips_thinking_blocks(self):
        FakeClaude.reply = text_reply("Voraussichtlich 2029.")
        res = self.ask("Wann?")
        self.assertEqual(res, {"text": "Voraussichtlich 2029.", "mode": "llm", "ticket": False})

    def test_ticket_marker_is_stripped_and_flagged(self):
        FakeClaude.reply = text_reply(f"Das tut mir leid. Bitte nennen Sie Ihre Telefonnummer. {advisor.TICKET_TOKEN}")
        res = self.ask("Meine Heizung ist kaputt")
        self.assertTrue(res["ticket"])
        self.assertNotIn(advisor.TICKET_TOKEN, res["text"])

    def test_refusal_gives_polite_answer(self):
        FakeClaude.reply = (200, {"content": [], "stop_reason": "refusal"})
        res = self.ask("…")
        self.assertEqual(res["mode"], "llm")
        self.assertIn("Kundenservice", res["text"])

    def test_api_error_falls_back_to_offline(self):
        FakeClaude.reply = (529, {"type": "error", "error": {"type": "overloaded_error", "message": "busy"}})
        res = self.ask("Meine Heizung ist kaputt")
        self.assertEqual(res["mode"], "offline")
        self.assertTrue(res["ticket"])

    def test_offline_explains_proposed_conditions(self):
        res = advisor.answer([{"role": "user", "content": "Kann ich wieder aussteigen?"}], self.context, None)
        self.assertIn("Ausstiegsklausel", res["text"])
        self.assertIn("noch nicht verbindlich", res["text"])
        wait = advisor.answer([{"role": "user", "content": "Wie funktioniert die Wartegarantie?"}], self.context, None)
        self.assertNotIn("Ausstiegsklausel", wait["text"])

    def test_no_key_never_calls_api(self):
        res = advisor.answer([{"role": "user", "content": "Hallo"}], self.context, None, base_url=self.base_url)
        self.assertEqual(res["mode"], "offline")
        self.assertEqual(FakeClaude.seen, [])


if __name__ == "__main__":
    unittest.main()
