#!/usr/bin/env python3
"""Build and validate FabControlBook's bilingual static site without network access."""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
PRODUCTION = "https://frbread7.github.io/fabcontrolbook/"
LANGUAGES = {"en": "English", "ko": "한국어"}
REQUIRED_SECTIONS = {"objectives", "concepts", "worked-example", "limitations", "review", "references"}


def load_data():
    data = json.loads((ROOT / "tools/chapters.json").read_text(encoding="utf-8"))
    refs = json.loads((ROOT / "content/references.json").read_text(encoding="utf-8"))
    labs = json.loads((ROOT / "content/labs.json").read_text(encoding="utf-8"))
    return data, refs, labs


def source_article(language: str, filename: str) -> str:
    path = ROOT / "content" / language / "chapters" / filename
    return path.read_text(encoding="utf-8")


def validate_content(data, refs, labs):
    issues = []
    ids = [chapter["id"] for chapter in data["chapters"]]
    if len(ids) != len(set(ids)):
        issues.append("duplicate chapter id")
    if len(data["chapters"]) < 12:
        issues.append("at least twelve substantive chapters are required")
    ref_ids = {ref["id"] for ref in refs["references"]}
    if len(ref_ids) != len(refs["references"]):
        issues.append("duplicate reference id")
    if len(labs.get("experiments", [])) < 4:
        issues.append("four labs are required")
    for chapter in data["chapters"]:
        for language in LANGUAGES:
            try:
                article = source_article(language, chapter["file"])
            except FileNotFoundError:
                issues.append(f"missing {language} chapter {chapter['file']}")
                continue
            if not re.search(r"<article\b", article, re.I) or not re.search(r"</article>\s*$", article, re.I):
                issues.append(f"{language}/{chapter['file']}: expected one article fragment")
            if not re.search(r"<h1\b", article, re.I):
                issues.append(f"{language}/{chapter['file']}: missing h1")
            sections = set(re.findall(r'data-section=["\']([^"\']+)', article, re.I))
            if not REQUIRED_SECTIONS.issubset(sections):
                issues.append(f"{language}/{chapter['file']}: missing sections {sorted(REQUIRED_SECTIONS - sections)}")
            text = re.sub(r"<[^>]*>", " ", article)
            text = html.unescape(re.sub(r"\s+", " ", text)).strip()
            if len(text) < 2200:
                issues.append(f"{language}/{chapter['file']}: chapter content too short ({len(text)} chars)")
            topics = chapter.get("topics")
            if not isinstance(topics, list) or not topics or any(not isinstance(topic, str) or not topic.strip() for topic in topics):
                issues.append(f"chapter {chapter['id']}: one or more non-empty topic tags are required")
            for ref in re.findall(r'data-ref=["\']([^"\']+)', article):
                if ref not in ref_ids:
                    issues.append(f"{language}/{chapter['file']}: unknown reference {ref}")
    for language in LANGUAGES:
        path = ROOT / "content" / language / "lab.html"
        if not path.exists():
            issues.append(f"missing {language} lab page")
            continue
        page = path.read_text(encoding="utf-8")
        for exp in labs["experiments"]:
            if f'id="{exp["id"]}"' not in page:
                issues.append(f"{language}/lab.html: missing experiment {exp['id']}")
    for ref in refs["references"]:
        if not ref.get("title") or not ref.get("url", "").startswith("https://"):
            issues.append(f"invalid reference record {ref.get('id')}")
    chapter_ids = set(ids)
    experiment_ids = [item.get("id") for item in labs.get("experiments", [])]
    if len(experiment_ids) != len(set(experiment_ids)):
        issues.append("duplicate experiment id")
    for experiment in labs.get("experiments", []):
        if experiment.get("chapterId") not in chapter_ids:
            issues.append(f"experiment {experiment.get('id')} references an unknown chapter")
        for key in ("title", "description", "kind"):
            for language in LANGUAGES:
                value = experiment.get(key, {}).get(language)
                if not isinstance(value, str) or not value.strip():
                    issues.append(f"experiment {experiment.get('id')} is missing {language} {key}")
    ui = json.loads((ROOT / "content/ui.json").read_text(encoding="utf-8"))
    for language in LANGUAGES:
        labels = ui.get(language, {})
        if not labels or any(not isinstance(value, str) or not value.strip() for value in labels.values()):
            issues.append(f"missing or incomplete {language} interface labels")
    for ref in refs["references"]:
        if not ref.get("publisher") or not ref.get("type") or not ref.get("note"):
            issues.append(f"incomplete bibliographic record {ref.get('id')}")
    if issues:
        raise ValueError("\n".join(issues))


def nav_links(chapters, lang, current_id=None, chapter_page=False):
    groups = {}
    for chapter in chapters:
        groups.setdefault(chapter["group"], []).append(chapter)
    labels = json.loads((ROOT / "content/ui.json").read_text(encoding="utf-8"))[lang]
    group_labels = json.loads((ROOT / "tools/chapters.json").read_text(encoding="utf-8"))["groups"]
    root_prefix = "../" if chapter_page else ("" if lang == "en" else "")
    home_href = root_prefix + "index.html"
    lab_href = root_prefix + "lab.html"
    references_href = root_prefix + "references.html"
    chapter_prefix = "./" if chapter_page else "chapters/"
    links = [f'<a href="{home_href}">{labels["home"]}</a>', f'<a href="{lab_href}">{labels["lab"]}</a>', f'<a href="{references_href}">{labels["references"]}</a>']
    for index, items in groups.items():
        links.append(f'<h2>{html.escape(group_labels[index][lang])}</h2>')
        for chapter in items:
            title = chapter["title"][lang]
            href = chapter_prefix + chapter["file"]
            current = ' aria-current="page"' if chapter["id"] == current_id else ""
            links.append(f'<a class="chapter-link" href="{href}"{current}><span>{chapter["number"]:02}</span>{html.escape(title)}</a>')
    return "".join(links)


def shell(lang, title, description, body, current_id=None, canonical_path="", depth=0):
    labels = json.loads((ROOT / "content/ui.json").read_text(encoding="utf-8"))[lang]
    prefix = "../" * depth
    asset = prefix + "assets/"
    other = "ko" if lang == "en" else "en"
    chapter_page = "/chapters/" in "/" + canonical_path
    if current_id:
        chapter = next(item for item in json.loads((ROOT / "tools/chapters.json").read_text(encoding="utf-8"))["chapters"] if item["id"] == current_id)
        if lang == "en": other_href = "../ko/chapters/" + chapter["file"]
        else: other_href = "../../chapters/" + chapter["file"]
    elif canonical_path.endswith("lab.html"): other_href = ("ko/lab.html" if lang == "en" else "../lab.html")
    elif canonical_path.endswith("references.html"): other_href = ("ko/references.html" if lang == "en" else "../references.html")
    else: other_href = ("ko/index.html" if lang == "en" else "../index.html")
    home_href = "../index.html" if chapter_page else "index.html"
    lab_href = "../lab.html" if chapter_page else "lab.html"
    references_href = "../references.html" if chapter_page else "references.html"
    license_href = ("../" * depth) + ("ko/" if lang == "ko" else "") + "license.html"
    canonical = PRODUCTION + canonical_path
    return f'''<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{html.escape(description, quote=True)}"><meta name="theme-color" content="#18384a">
<link rel="canonical" href="{html.escape(canonical, quote=True)}"><link rel="stylesheet" href="{asset}css/site.css">
<title>{html.escape(title)} · FabControlBook</title></head>
<body><a class="skip-link" href="#main">{labels['skip']}</a>
<header class="topbar"><a class="brand" href="{home_href}"><span class="brand-mark" aria-hidden="true">FC</span><span>FabControlBook<small>{labels['subtitle']}</small></span></a>
<nav aria-label="{labels['primaryNav']}"><a href="{home_href}">{labels['home']}</a><a href="{lab_href}">{labels['lab']}</a><a href="{references_href}">{labels['references']}</a><a href="https://frbread7.github.io/books/">My Library</a></nav>
<a class="language" href="{other_href}" lang="{other}">{labels['languageToggle']}</a></header>
<div class="layout"><aside class="toc" aria-label="{labels['chapterNav']}">{nav_links(json.loads((ROOT / 'tools/chapters.json').read_text(encoding='utf-8'))['chapters'],lang,current_id,chapter_page)}</aside>
<main id="main">{body}<footer class="site-footer"><span>{labels['footer']}</span><a href="{license_href}">{labels['license']}</a></footer></main></div>
<script type="module" src="{asset}js/site.js"></script></body></html>'''


def update_manifest(data, labs):
    p = ROOT / "library-manifest.json"
    manifest = json.loads(p.read_text(encoding="utf-8"))
    manifest["chapterCount"] = len(data["chapters"])
    manifest["chapters"] = []
    for c in data["chapters"]:
        stem = c["file"]
        manifest["chapters"].append({
            "id": c["id"], "number": c["number"], "title": c["title"],
            "urls": {"en": PRODUCTION + "chapters/" + stem, "ko": PRODUCTION + "ko/chapters/" + stem},
            "topics": c["topics"]
        })
    manifest["experiments"] = []
    for exp in labs["experiments"]:
        manifest["experiments"].append({
            "id": exp["id"], "chapterId": exp["chapterId"], "title": exp["title"],
            "url": PRODUCTION + "lab.html#" + exp["id"], "kind": exp["kind"]
        })
    manifest["lastUpdated"] = date.today().isoformat()
    manifest["attribution"] = {
        "license": "CC BY 4.0 for original educational prose, diagrams, examples, and synthetic datasets; MIT for original code. See LICENSE.md and LICENSE-AND-ATTRIBUTION.md.",
        "repositoryUrl": manifest["repositoryUrl"],
        "notes": "Original content and code were authored for FabControlBook. Upstream works are reference-only; no upstream text, art, or code was reused. See docs/PROVENANCE_AND_REVIEW.md."
    }
    p.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def validate_manifest(data, labs):
    manifest = json.loads((ROOT / "library-manifest.json").read_text(encoding="utf-8"))
    issues = []
    expected_ids = [chapter["id"] for chapter in data["chapters"]]
    manifest_ids = [chapter.get("id") for chapter in manifest.get("chapters", [])]
    if manifest.get("status") != "in-progress":
        issues.append("book-local manifest must remain in-progress; My Library owns publication status")
    if manifest.get("chapterCount") != len(data["chapters"]) or manifest_ids != expected_ids:
        issues.append("manifest chapter count/index does not match the authored chapter registry")
    if set(manifest.get("languages", [])) != set(LANGUAGES):
        issues.append("manifest languages must match the English and Korean editions")
    for chapter, record in zip(data["chapters"], manifest.get("chapters", [])):
        expected_en = PRODUCTION + "chapters/" + chapter["file"]
        expected_ko = PRODUCTION + "ko/chapters/" + chapter["file"]
        if record.get("urls") != {"en": expected_en, "ko": expected_ko}:
            issues.append(f"manifest chapter routes do not match for {chapter['id']}")
        if record.get("title") != chapter.get("title") or record.get("topics") != chapter.get("topics"):
            issues.append(f"manifest chapter titles do not match for {chapter['id']}")
    experiment_ids = [experiment["id"] for experiment in labs["experiments"]]
    manifest_experiments = manifest.get("experiments", [])
    if [experiment.get("id") for experiment in manifest_experiments] != experiment_ids:
        issues.append("manifest experiment index does not match the authored lab registry")
    for experiment, record in zip(labs["experiments"], manifest_experiments):
        if (record.get("chapterId") != experiment.get("chapterId") or
                record.get("url") != PRODUCTION + "lab.html#" + experiment["id"] or
                record.get("kind") != experiment.get("kind") or
                "description" in record):
            issues.append(f"manifest experiment route does not match for {experiment['id']}")
    cover = manifest.get("cover", "")
    if not cover or not (ROOT / "assets" / "covers" / Path(cover).name).is_file():
        issues.append("manifest cover artwork is missing")
    if "CHOOSE-AND-RECORD" in json.dumps(manifest):
        issues.append("manifest license attribution placeholder must be resolved before release")
    if issues:
        raise ValueError("\n".join(issues))


def render_references(refs):
    records = []
    for ref in refs["references"]:
        records.append(
            '<section class="reference-item" id="ref-' + html.escape(ref["id"], quote=True) + '">' +
            '<p class="reference-type">' + html.escape(ref.get("type", "reference")) + ' · ' + html.escape(ref.get("publisher", "")) + '</p>' +
            '<h2><a href="' + html.escape(ref["url"], quote=True) + '">' + html.escape(ref["title"]) + '</a></h2>' +
            '<p>' + html.escape(ref.get("note", "")) + '</p></section>'
        )
    return '<div class="reference-list">' + "\n".join(records) + '</div>'


def build(write_manifest=False, check=False):
    data, refs, labs = load_data()
    validate_content(data, refs, labs)
    if check:
        validate_manifest(data, labs)
        for required in ("site/index.html", "site/ko/index.html", "site/lab.html", "site/ko/lab.html"):
            if not (ROOT / required).is_file():
                raise ValueError(f"generated site is incomplete: missing {required}; run npm run build")
        return
    if write_manifest:
        update_manifest(data, labs)
    else:
        validate_manifest(data, labs)
    # `site/` is entirely generated output. Remove it before rebuilding so a
    # deleted or renamed chapter cannot remain published from an older build.
    if SITE.is_symlink():
        raise ValueError("generated site output must not be a symlink")
    if SITE.exists():
        shutil.rmtree(SITE)
    for lang in LANGUAGES:
        for c in data["chapters"]:
            rel = ("ko/" if lang == "ko" else "") + "chapters/" + c["file"]
            body = source_article(lang, c["file"])
            page = shell(lang, c["title"][lang], c["title"][lang], body, c["id"], rel, depth=2 if lang == "ko" else 1)
            target = SITE / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(page, encoding="utf-8")
        index_path = ("ko/" if lang == "ko" else "") + "index.html"
        index_content = (ROOT / "content" / lang / "index.html").read_text(encoding="utf-8")
        lab_content = (ROOT / "content" / lang / "lab.html").read_text(encoding="utf-8")
        refs_content = (ROOT / "content" / lang / "references.html").read_text(encoding="utf-8").replace('<div id="reference-list"></div>', render_references(refs))
        license_content = (ROOT / "content" / lang / "license.html").read_text(encoding="utf-8")
        for rel, title, body in [(index_path, "FabControlBook", index_content), (("ko/" if lang == "ko" else "") + "lab.html", "Interactive Control Labs", lab_content), (("ko/" if lang == "ko" else "") + "references.html", "References and validation", refs_content), (("ko/" if lang == "ko" else "") + "license.html", "License and provenance", license_content)]:
            page = shell(lang, title, title, body, None, rel, depth=1 if lang == "ko" else 0)
            target = SITE / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(page, encoding="utf-8")
    for sub in ["css", "js", "covers"]:
        src = ROOT / "assets" / sub
        if src.exists(): shutil.copytree(src, SITE / "assets" / sub, dirs_exist_ok=True)
    art = ROOT / "art"
    if art.exists(): shutil.copytree(art, SITE / "art", dirs_exist_ok=True)
    shutil.copyfile(ROOT / "LICENSE-AND-ATTRIBUTION.md", SITE / "LICENSE-AND-ATTRIBUTION.md")
    shutil.copyfile(ROOT / "LICENSE-CC-BY-4.0", SITE / "LICENSE-CC-BY-4.0")
    shutil.copyfile(ROOT / "LICENSE-MIT", SITE / "LICENSE-MIT")
    print(f"Built {len(data['chapters'])} chapters in {len(LANGUAGES)} languages and {len(labs['experiments'])} labs.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-manifest", action="store_true")
    parser.add_argument("--check", action="store_true", help="validate source completeness without writing files")
    args = parser.parse_args()
    try:
        build(args.write_manifest, args.check)
    except (ValueError, KeyError, OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"FabControlBook build failed: {exc}")
