// Eleventy config — pages live in src/, static files in assets/, output in _site/.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import markdownIt from "markdown-it";

export default function (eleventyConfig) {
  /* ---- Static files ----------------------------------------------------- */
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("robots.txt");

  /* ---- Cache-busting: "/assets/css/style.css" | v → "...?v=<content hash>" */
  const hashes = new Map();
  eleventyConfig.addFilter("v", (url) => {
    if (!hashes.has(url)) {
      const hash = createHash("md5").update(readFileSync(`.${url}`)).digest("hex").slice(0, 8);
      hashes.set(url, hash);
    }
    return `${url}?v=${hashes.get(url)}`;
  });
  // file hashes can change between rebuilds while serving locally
  eleventyConfig.on("eleventy.before", () => hashes.clear());

  /* ---- Dates ------------------------------------------------------------- */
  // last commit that touched a source file (needs full history: fetch-depth 0 in the workflow)
  const modified = new Map();
  eleventyConfig.addFilter("gitModified", (inputPath) => {
    if (!modified.has(inputPath)) {
      let iso = "";
      try {
        iso = execFileSync("git", ["log", "-1", "--format=%cI", "--", inputPath], { encoding: "utf8" }).trim();
      } catch { /* not a git checkout */ }
      modified.set(inputPath, iso || new Date().toISOString());
    }
    return modified.get(inputPath);
  });
  eleventyConfig.addFilter("isoDate", (date) => new Date(date).toISOString());
  eleventyConfig.addFilter("dateOnly", (date) => new Date(date).toISOString().slice(0, 10));

  // case studies and chapter notes, newest first (the Atom feed)
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByTag("post").sort((a, b) => b.date - a.date)
  );

  /* ---- DDIA chapters, in chapter order ---------------------------------- */
  eleventyConfig.addCollection("chapters", (api) =>
    api.getFilteredByTag("ddiaChapter").sort((a, b) => a.data.chapter - b.data.chapter)
  );

  // chapter pages → items for the Pokédex menu (Menu › Writing › Reading DDIA)
  eleventyConfig.addFilter("chapterMenu", (chapters) =>
    chapters.map((c) => ({
      label: c.data.menuLabel,
      href: c.url.replace(/^\//, ""),
      note: c.data.menuNote,
    }))
  );

  /* ---- Markdown: chapter notes are written in .md ----------------------- */
  const md = markdownIt({ html: true });
  md.renderer.rules.table_open = () => '<div class="table-scroll"><table class="cs-table">\n';
  md.renderer.rules.table_close = () => "</table></div>\n";
  md.renderer.rules.bullet_list_open = () => '<ul class="list">\n';
  eleventyConfig.setLibrary("md", md);

  // {% section "Trade-off 01", "Operational vs analytical", "ops" %} …markdown… {% endsection %}
  // an empty eyebrow means the section continues the one before (after a figure or table)
  eleventyConfig.addPairedShortcode("section", (content, eyebrow, heading, id) =>
    `<section class="prose${eyebrow ? "" : " prose--cont"}" aria-labelledby="${id}">` +
    (eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : "") +
    `<h2 id="${id}">${heading}</h2>${md.render(content).trim()}</section>`
  );

  // {% take %} …markdown… {% endtake %}   /   {% pushback %} … {% endpushback %}
  const box = (label, cls) => (content) =>
    `<div class="take${cls}"><p class="take__label">${label}</p>${md.render(content).trim()}</div>`;
  eleventyConfig.addPairedShortcode("take", box("My take", ""));
  eleventyConfig.addPairedShortcode("pushback", box("Push back", " take--push"));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
