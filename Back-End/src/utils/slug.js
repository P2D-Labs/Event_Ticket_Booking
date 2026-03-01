export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function uniqueSlug(base, existingSlugs) {
  let slug = slugify(base);
  let count = 0;
  while (existingSlugs.includes(slug)) {
    count++;
    slug = `${slugify(base)}-${count}`;
  }
  return slug;
}
