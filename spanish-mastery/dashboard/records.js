(function () {
  'use strict';

  const records = window.SPANISH_MASTERY_RECORDS;
  const reader = document.getElementById('record-reader');
  const title = document.getElementById('record-title');
  const content = document.getElementById('record-content');
  const evidencePath = '../evidence.jsonl';
  const sources = window.SPANISH_MASTERY_DATA.sources;

  function node(tag, text) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function recordLink(label, href, id) {
    const anchor = node('a', label);
    anchor.setAttribute('href', href);
    if (id) anchor.dataset.recordId = id;
    return anchor;
  }

  function inline(element, text) {
    const syntax = /\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    let offset = 0;
    for (const match of text.matchAll(syntax)) {
      element.append(text.slice(offset, match.index));
      const [, label, href, code, bold, italic] = match;
      if (href) {
        const relative = '../' + href;
        if (Object.hasOwn(records.documents, relative) || relative === evidencePath) {
          element.append(recordLink(label, relative));
        } else if (href === 'dashboard/index.html') {
          const close = node('button', label);
          close.addEventListener('click', () => reader.close());
          element.append(close);
        } else {
          element.append(label);
        }
      } else {
        element.append(code ? node('code', code) : bold ? node('strong', bold) : node('em', italic));
      }
      offset = match.index + match[0].length;
    }
    element.append(text.slice(offset));
    return element;
  }

  // The notebook uses headings, paragraphs, lists, quotes and pipe tables.
  function renderDocument(markdown) {
    const lines = markdown.trim().split(/\r?\n/);
    const heading = lines.shift().replace(/^#\s+/, '');
    const fragment = document.createDocumentFragment();

    while (lines.length) {
      const line = lines.shift();
      if (!line.trim()) continue;
      const section = /^(#{1,6}) (.+)/.exec(line);
      const list = /^\s*(?:([-*])|(\d+)\.)\s+(.+)/;
      const item = list.exec(line);
      if (section) {
        fragment.append(inline(node('h' + Math.min(6, Math.max(3, section[1].length + 1))), section[2]));
      } else if (item) {
        const items = node(item[2] ? 'ol' : 'ul');
        if (item[2]) items.start = Number(item[2]);
        let entry = item;
        do {
          items.append(inline(node('li'), entry[3]));
          entry = list.exec(lines[0] || '');
          if (!entry || Boolean(entry[2]) !== Boolean(item[2])) break;
          lines.shift();
        } while (entry);
        fragment.append(items);
      } else if (line.startsWith('|') && /^\|[\s:|-]+\|$/.test(lines[0] || '')) {
        lines.shift();
        const wrapper = node('div');
        wrapper.className = 'record-table';
        const table = node('table');
        function row(target, text, tag) {
          const tr = target.insertRow();
          for (const cell of text.trim().slice(1, -1).split('|')) {
            const element = inline(node(tag), cell.trim());
            if (tag === 'th') element.scope = 'col';
            tr.append(element);
          }
        }
        row(table.createTHead(), line, 'th');
        const body = table.createTBody();
        while (lines[0]?.startsWith('|')) row(body, lines.shift(), 'td');
        wrapper.append(table);
        fragment.append(wrapper);
      } else if (line.startsWith('> ')) {
        fragment.append(inline(node('blockquote'), line.slice(2)));
      } else if (/^---+$/.test(line)) {
        fragment.append(node('hr'));
      } else {
        fragment.append(inline(node('p'), line));
      }
    }
    return {heading, fragment};
  }

  function evidenceValue(value) {
    if (typeof value === 'string' && Object.hasOwn(records.evidence, value)) {
      return recordLink(value, evidencePath, value);
    }
    if (Array.isArray(value)) {
      const items = node('ul');
      for (const item of value) {
        const entry = node('li');
        entry.append(evidenceValue(item));
        items.append(entry);
      }
      return items;
    }
    if (value && typeof value === 'object') return evidenceFields(value);
    return node('div', value === null ? '—' : String(value));
  }

  function evidenceFields(record) {
    const labels = {id: 'Record ID', session_id: 'Session ID', prompt_id: 'Prompt ID',
      raw_response: 'Original response', related_ids: 'Related records'};
    const fields = node('dl');
    for (const [key, value] of Object.entries(record)) {
      const label = labels[key] || key.replaceAll('_', ' ').replace(/^./, char => char.toUpperCase());
      const detail = node('dd');
      detail.append(key === 'id' ? node('div', value) : evidenceValue(value));
      fields.append(node('dt', label), detail);
    }
    return fields;
  }

  function openRecord(anchor, href) {
    const id = anchor.dataset.recordId;
    if (href === evidencePath) {
      const record = id && Object.hasOwn(records.evidence, id) && records.evidence[id];
      title.textContent = id ? sources[id]?.label || 'Evidence · ' + id : 'Evidence log';
      if (id) {
        content.replaceChildren(record ? evidenceFields(record) : node('p', 'This record is unavailable.'));
        content.append(recordLink('Browse all evidence', evidencePath));
      } else {
        const list = node('ul');
        for (const [recordId, entry] of Object.entries(records.evidence).reverse()) {
          const row = node('li');
          const label = sources[recordId]?.label || [recordId, entry.concept || entry.type?.replaceAll('_', ' '), entry.date].filter(Boolean).join(' · ');
          row.append(recordLink(label, evidencePath, recordId));
          list.append(row);
        }
        content.replaceChildren(list);
      }
    } else if (Object.hasOwn(records.documents, href)) {
      const {heading, fragment} = renderDocument(records.documents[href]);
      title.textContent = heading;
      content.replaceChildren(fragment);
    } else {
      title.textContent = anchor.textContent;
      const image = node('img');
      image.alt = anchor.textContent;
      image.src = href;
      image.addEventListener('error', () => image.replaceWith(node('p', 'This image is unavailable.')));
      content.replaceChildren(image);
    }
    if (!reader.open) reader.showModal();
    else reader.querySelector('button').focus();
    content.scrollTop = 0;
  }

  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const href = anchor.getAttribute('href');
    const imageSource = anchor.dataset.recordId && /\.(png|jpe?g|webp)$/i.test(href);
    if (!imageSource && (!records || (href !== evidencePath && !Object.hasOwn(records.documents, href)))) return;
    event.preventDefault();
    openRecord(anchor, href);
  });
})();
