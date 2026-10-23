from __future__ import annotations

import html
import json
import re
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
sys.path.insert(0, str(ROOT))
from tools import build_site


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
        self.lang = None
        self.h1 = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "html":
            self.lang = values.get("lang")
        if "id" in values:
            self.ids.add(values["id"])
        for attribute in ("href", "src"):
            value = values.get(attribute)
            if value:
                self.links.append((attribute, value))
        if tag == "h1":
            self.h1 += 1


def parse_page(path: Path) -> PageParser:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser


class FabControlSiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.chapters = json.loads((ROOT / "tools/chapters.json").read_text(encoding="utf-8"))["chapters"]
        cls.labs = json.loads((ROOT / "content/labs.json").read_text(encoding="utf-8"))["experiments"]
        cls.manifest = json.loads((ROOT / "library-manifest.json").read_text(encoding="utf-8"))

    def test_all_bilingual_chapter_routes_exist_and_have_one_heading(self):
        for language in ("en", "ko"):
            prefix = "" if language == "en" else "ko/"
            for chapter in self.chapters:
                page = SITE / prefix / "chapters" / chapter["file"]
                self.assertTrue(page.is_file(), page)
                parsed = parse_page(page)
                self.assertEqual(parsed.lang, language, page)
                self.assertEqual(parsed.h1, 1, page)

    def test_all_internal_html_routes_assets_and_fragments_resolve(self):
        pages = list(SITE.rglob("*.html"))
        indexed = {path.relative_to(SITE).as_posix(): parse_page(path) for path in pages}
        for relative, parsed in indexed.items():
            source = SITE / relative
            for attribute, value in parsed.links:
                parts = urlsplit(html.unescape(value))
                if parts.scheme or parts.netloc or value.startswith(("data:", "mailto:", "tel:")):
                    continue
                if not parts.path:
                    target = source
                else:
                    target = ((SITE / parts.path.lstrip("/")) if parts.path.startswith("/") else source.parent / parts.path).resolve()
                self.assertTrue(target.is_relative_to(SITE.resolve()), f"path escapes site: {relative} {value}")
                if target.is_dir():
                    target = target / "index.html"
                self.assertTrue(target.is_file(), f"broken {attribute} in {relative}: {value}")
                if parts.fragment and target.suffix == ".html":
                    target_key = target.relative_to(SITE.resolve()).as_posix()
                    target_parser = indexed.get(target_key) or parse_page(target)
                    self.assertIn(parts.fragment, target_parser.ids, f"missing fragment in {relative}: {value}")

    def test_languages_labs_and_publication_state_are_consistent(self):
        self.assertEqual(self.manifest["status"], "in-progress")
        self.assertEqual(self.manifest["chapterCount"], 14)
        self.assertEqual(len(self.manifest["chapters"]), len(self.chapters))
        self.assertEqual(len(self.labs), 4)
        self.assertTrue(all(chapter["topics"] for chapter in self.manifest["chapters"]))
        for experiment in self.manifest["experiments"]:
            self.assertEqual(set(experiment), {"id", "chapterId", "title", "url", "kind"})
            self.assertEqual(set(experiment["kind"]), {"en", "ko"})
        for language in ("en", "ko"):
            prefix = "" if language == "en" else "ko/"
            lab = (SITE / prefix / "lab.html").read_text(encoding="utf-8")
            for experiment in self.labs:
                self.assertIn(f'id="{experiment["id"]}"', lab)
            references = (SITE / prefix / "references.html").read_text(encoding="utf-8")
            self.assertIn("FabControlBook", references)
        self.assertEqual(set(self.manifest["languages"]), {"en", "ko"})

    def test_book_assets_and_license_notices_are_generated(self):
        self.assertTrue((SITE / "assets/css/site.css").is_file())
        self.assertTrue((SITE / "assets/js/site.js").is_file())
        self.assertTrue((SITE / "assets/js/models.mjs").is_file())
        self.assertTrue((SITE / "assets/covers/fabcontrolbook.svg").is_file())
        for file in ("LICENSE-AND-ATTRIBUTION.md", "LICENSE-CC-BY-4.0", "LICENSE-MIT"):
            self.assertTrue((SITE / file).is_file(), file)
        self.assertNotIn("CHOOSE-AND-RECORD", json.dumps(self.manifest))

    def test_license_language_switch_stays_on_license_page(self):
        for language, route, expected in (("en", "license.html", "ko/license.html"), ("ko", "ko/license.html", "../license.html")):
            parsed = PageParser()
            parsed.feed(build_site.shell(language, "License", "License", "", canonical_path=route, depth=1 if language == "ko" else 0))
            parsed.close()
            self.assertIn(("href", expected), parsed.links, route)

    def test_reference_records_include_corrected_primary_metadata(self):
        refs = {item["id"]: item for item in json.loads((ROOT / "content/references.json").read_text(encoding="utf-8"))["references"]}
        self.assertTrue(refs["nist-ewma"]["url"].endswith("pmc324.htm"))
        self.assertTrue(refs["nist-cusum-arl"]["url"].endswith("pmc3231.htm"))
        self.assertIn("83, 107–125", refs["liu-r2r-survey"]["publisher"])
        chapters = (ROOT / "content/en/chapters/08-chamber-matching-tool-health.html").read_text(encoding="utf-8")
        self.assertIn("https://www.iso.org/standard/69418.html", chapters)

    def test_chapter_and_lab_external_sources_are_in_bibliography(self):
        refs = json.loads((ROOT / "content/references.json").read_text(encoding="utf-8"))["references"]
        reference_urls = {item["url"] for item in refs}
        cited_urls = set()
        for language in ("en", "ko"):
            pages = [ROOT / "content" / language / "lab.html"]
            pages.extend((ROOT / "content" / language / "chapters").glob("*.html"))
            for page in pages:
                cited_urls.update(
                    value
                    for attribute, value in parse_page(page).links
                    if attribute == "href" and value.startswith(("http://", "https://"))
                )
        self.assertTrue(cited_urls)
        self.assertEqual(cited_urls - reference_urls, set())

    def test_manifest_refresh_preserves_editorial_date(self):
        data, _, labs = build_site.load_data()
        with tempfile.TemporaryDirectory() as directory:
            source_manifest = {"lastUpdated": "2001-02-03", "repositoryUrl": "https://example.invalid/book"}
            manifest_path = Path(directory) / "library-manifest.json"
            manifest_path.write_text(json.dumps(source_manifest), encoding="utf-8")
            with patch.object(build_site, "ROOT", Path(directory)):
                build_site.update_manifest(data, labs)
            refreshed = json.loads(manifest_path.read_text(encoding="utf-8"))
            self.assertEqual(refreshed["lastUpdated"], "2001-02-03")
            self.assertEqual(refreshed["chapterCount"], len(data["chapters"]))
            self.assertEqual(len(refreshed["experiments"]), len(labs["experiments"]))

    def test_rebuild_removes_deleted_generated_routes(self):
        obsolete = SITE / "chapters/99-removed-chapter.html"
        obsolete.parent.mkdir(parents=True, exist_ok=True)
        obsolete.write_text("stale route must not survive a clean build", encoding="utf-8")
        build_site.build()
        self.assertFalse(obsolete.exists())


if __name__ == "__main__":
    unittest.main()
