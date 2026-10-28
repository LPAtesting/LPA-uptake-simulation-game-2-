// Ask Lisa: Donee Talk. A conversation toolkit for donors asking someone they trust to be their donee.
// Toolkit lines are shown word for word; Claude (window.claude.complete) only picks which fit and adds a short lead-in.
export const ITEMS = {
  S1: { sec: 0, quote: "I've been thinking about what would happen if I cannot make decisions", note: 'ease the donee into the conversation, without making it sound like you are thrusting this responsibility on them.' },
  S2: { sec: 0, quote: 'I know it is a big responsibility...', note: 'acknowledge that it is not easy for the donee to readily accept and that they may have their concerns, but a conversation would help you alleviate these concerns.' },
  S3: { sec: 0, quote: 'If something were to happen... you are someone I trust', note: 'tell the donee that you trust them, and that is why you are choosing them. It reassures the donee.' },
  S4: { sec: 0, quote: "I don't want you to be prevented from helping me", note: 'present the LPA as a measure to reduce uncertainty.' },
  S5: { sec: 0, quote: "I don't need you to agree immediately", note: 'acknowledge that the donee may have their own concerns and remove the pressure of an immediate commitment, but instead an honest conversation.' },
  W1: { sec: 1, chip: 'They worry about caring for me or paying', quote: "If you're concerned about whether you need to care for me or pay for my expenses, don't worry - being a donee just means making decisions and helping me manage my finances, you will not be automatically responsible for me" },
  W2: { sec: 1, chip: "They're afraid of the wrong decision", quote: "If you're concerned about making the wrong decision, don't worry - we can discuss my wishes and values now, and they guide you should you need to make a decision" },
  W3: { sec: 1, chip: "They say I'm still healthy", quote: "If you think I am still healthy enough, don't worry - an LPA is just a future plan in case I lose mental capacity, I will not become sick just by talking about it. Further, losing capacity is not only a possibility for older people" },
  W4: { sec: 1, chip: 'They doubt they can cope', quote: "If you are concerned about your ability and commitment, don't worry - I trust you to act in my best interests and you can seek advice from experts where required. Further, if you are unable to cope, there are mechanisms to stop being a donee" },
  P1: { sec: 2, quote: 'I am asking because I trust you, not because you have an obligation.' },
  P2: { sec: 2, quote: 'I am asking because I want you to be sure about what I want and not have to scramble in case something happens.' },
  P3: { sec: 2, quote: 'Being my donee does not automatically mean you take over everything in my life.' }
};
export const HEADLINE = 'How do I start a conversation with trusted people to convince them to become my donee?';
const HEADS = ['Some conversation starters you can try are:', "If they're specifically concerned about some things, here are some things you can say:", 'Guiding principles for conversations:'];
export const CARD_IDS = Object.keys(ITEMS);
export const SECTIONS = HEADS.map((t, i) => ({ title: '(' + ['i', 'ii', 'iii'][i] + ') ' + t, ids: CARD_IDS.filter(id => ITEMS[id].sec === i) }));
const WS = ['W1', 'W2', 'W3', 'W4'];
export function item(id) {
  const it = ITEMS[id]; if (!it) return null;
  const ids = SECTIONS[it.sec].ids, n = ids.indexOf(id) + 1;
  const kicker = it.sec === 0 ? 'STARTER ' + n + ' OF ' + ids.length : it.sec === 1 ? "IF THEY'RE CONCERNED" : 'GUIDING PRINCIPLE ' + n;
  return { id, kicker, quote: '\u201C' + it.quote + '\u201D', plain: it.quote, note: it.note ? '\u2192 ' + it.note : '' };
}
export function card() { return null; }
const C = { start: 'How do I start the conversation?', next: 'Next starter', worried: "They're worried about something", principles: 'Guiding principles' };
export const STARTERS = [C.start, C.worried, C.principles];
const ALLOWED = [C.start, C.next, C.worried, C.principles].concat(WS.map(w => ITEMS[w].chip));

const lastStarter = h => { for (let i = h.length - 1; i >= 0; i--) { const s = (h[i].cards || []).filter(id => id[0] === 'S'); if (h[i].role === 'lisa' && s.length) return +s[s.length - 1].slice(1); } return 0; };
const seenW = h => new Set([].concat(...h.filter(m => m.role === 'lisa').map(m => (m.cards || []).filter(id => id[0] === 'W'))));
// Lisa's spoken lead-ins (each has a recorded clip in assets/vo when the text matches word for word)
const LEAD = {
  start: [HEADS[0], 'Good question! Try opening with this one.'],
  next: ['You could also try:', "Here's another one."],
  last: ['One more:'],
  principles: [HEADS[2], 'Keep these in mind when you talk.'],
  W1: ['Money and caregiving? That one comes up a lot. You can say:'],
  W2: ['Afraid of getting it wrong? You can say:'],
  W3: ["They think you're too healthy for this? You can say:"],
  W4: ["Worried they can't cope? You can say:"]
};
const lead = k => LEAD[k][Math.floor(Math.random() * LEAD[k].length)];
const starter = n => ({ say: lead(n === 1 ? 'start' : n === 5 ? 'last' : 'next'), cards: ['S' + n], mood: 'explain', next: n < 5 ? [C.next, C.worried] : [C.worried, C.principles], src: 'kit' });
const principles = () => ({ say: lead('principles'), cards: ['P1', 'P2', 'P3'], mood: 'instruct', next: [C.start, C.worried], src: 'kit' });
function concern(id, h) {
  const seen = seenW(h), rest = WS.filter(w => w !== id).sort((a, b) => seen.has(a) - seen.has(b)).map(w => ITEMS[w].chip);
  return { say: lead(id), cards: [id], mood: 'explain', next: rest.slice(0, 2).concat(C.principles), src: 'kit' };
}
function worriedMenu(h) {
  const seen = seenW(h);
  return { say: 'What are they worried about? Tap the closest one, or type what they said.', cards: [], mood: 'instruct', next: WS.slice().sort((a, b) => seen.has(a) - seen.has(b)).map(w => ITEMS[w].chip), src: 'kit' };
}
const offTopic = () => ({ say: "I can only help you talk to the person you'd like as your donee. For other LPA questions, the Office of the Public Guardian can help.", cards: [], mood: 'unsure', next: STARTERS.slice(), src: 'kit' });
const RX = {
  hello: /^\s*(hi|hello|hey|yo|hiya|good (morning|afternoon|evening))\b/i,
  thanks: /\b(thank|thanks|tq|ty|cheers)\b/i,
  procedure: /\b(fees?|cost|costs|price|how much|form ?[12]|register|registration|opg|public guardian|certificate issuer|revoke|how long|singpass|who can be (my|a) donee|eligib|requirements?)\b|\b(pay|paying)\b.*\b(lpa|make|form|register|apply)\b/i,
  W1: /\b(care for|caring|look after|pay (for )?(me|my|your|the)|my (bills|expenses)|expens|responsib|bills)/i,
  W2: /\b(wrong|mistake|mess up|blame|regret)/i,
  W3: /\b(healthy|young|too early|too soon|sick|jinx|pantang|bad luck|still strong|not old)/i,
  W4: /\b(cope|coping|ability|capable|commit|busy|no time|burden|stress|overwhelm|can'?t handle|quit|stop being)/i,
  worried: /\b(worr|concern|afraid|scared|hesitan|reluctan|unsure|doubt|refus|don'?t want|not keen|said no|says no|say no|object)/i,
  principles: /\b(principle|remember|keep in mind|tips?\b|guid|mindset)/i,
  next: /^\s*(next|another|more|one more|next one|next starter)\b/i,
  start: /\b(start|begin|open|bring (it )?up|raise|conversation|talk|ask|convince|persuade|approach|what do i say|donee)/i
};
function exact(s, h) {
  const norm = x => x.trim().toLowerCase().replace(/[?.!\s]+$/, ''), t = norm(s), eq = x => t === norm(x);
  if (eq(C.start) || eq(HEADLINE)) return starter(1);
  if (eq(C.next)) return starter(Math.min(5, lastStarter(h) + 1));
  if (eq(C.worried)) return worriedMenu(h);
  if (eq(C.principles)) return principles();
  for (const w of WS) if (eq(ITEMS[w].chip)) return concern(w, h);
  return null;
}
export function offline(q, h) {
  h = h || []; const s = String(q || '');
  const ex = exact(s, h); if (ex) return ex;
  if (RX.hello.test(s)) return { say: "Hi! I'm Lisa. Thinking of asking someone you trust to be your donee? I can help you start that conversation.", cards: [], mood: 'greet', next: STARTERS.slice(), src: 'kit' };
  if (RX.thanks.test(s)) return { say: 'Anytime! Good luck with the talk. Come back whenever you want to practise.', cards: [], mood: 'cheer', next: [C.worried, C.principles], src: 'kit' };
  const asConcern = RX.worried.test(s) || /\b(he|she|they|my \w+) (is|are|was|were|says?|said|thinks?|feels?)\b/i.test(s);
  if (RX.procedure.test(s) && !(asConcern && WS.some(w => RX[w].test(s)))) return offTopic();
  for (const w of WS) if (RX[w].test(s)) return concern(w, h);
  if (RX.worried.test(s)) return worriedMenu(h);
  if (RX.principles.test(s)) return principles();
  if (RX.next.test(s) && lastStarter(h)) return starter(Math.min(5, lastStarter(h) + 1));
  if (RX.start.test(s)) return starter(1);
  return offTopic();
}

const SYSTEM = `You are Lisa Lim, "LPA Lisa", from the game LPA GO!. You are inside Donee Talk, a conversation toolkit for donors: people in Singapore making a Lasting Power of Attorney (LPA) who want to ask someone they trust to be their donee. You only help with that conversation.

TOOLKIT (the app shows these items word for word):
${CARD_IDS.map(id => id + ': "' + ITEMS[id].quote + '"' + (ITEMS[id].note ? ' (purpose: ' + ITEMS[id].note + ')' : '')).join('\n')}
S1-S5 are conversation starters, W1-W4 are replies to specific concerns a donee may raise, P1-P3 are guiding principles.

How you answer:
- Pick the one to three toolkit items that best fit what the person says. Do not repeat or reword them in "say"; the app shows them.
- "say" is a warm, plain lead-in of at most 30 words, for example naming the worry you heard. No lists, no markdown.
- Never write new scripts, legal facts or advice. If the message is not about asking or talking to a donee, say kindly that you only help with that conversation, suggest the Office of the Public Guardian for other LPA questions, and return no items.

Reply with JSON only, nothing before or after it:
{"say": "...", "cards": ["W4"], "mood": "explain", "next": ["...", "..."]}
- mood: "explain", "instruct", "cheer", "greet" or "unsure".
- next: two options copied exactly from this list: ${JSON.stringify(ALLOWED)}`;
function parse(raw) {
  raw = typeof raw === 'string' ? raw : (raw && raw.text) || '';
  const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  let j; try { j = JSON.parse(raw.slice(a, b + 1)); } catch (e) { return null; }
  if (!j || typeof j.say !== 'string' || !j.say.trim()) return null;
  const next = (Array.isArray(j.next) ? j.next : []).filter(x => ALLOWED.includes(x)).slice(0, 3);
  return { say: j.say.trim(), cards: (Array.isArray(j.cards) ? j.cards : []).filter(id => ITEMS[id]).slice(0, 3), mood: ['explain', 'instruct', 'cheer', 'greet', 'unsure'].includes(j.mood) ? j.mood : 'explain', next: next.length ? next : [C.worried, C.principles], src: 'ai' };
}
function toMessages(history, q) {
  const out = [];
  history.filter(m => m.role === 'user' || m.role === 'lisa').slice(-8).forEach(m => {
    const role = m.role === 'user' ? 'user' : 'assistant', content = role === 'user' ? m.text : JSON.stringify({ say: m.text, cards: m.cards || [] });
    if (!out.length && role !== 'user') return;
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += '\n' + content; else out.push({ role, content });
  });
  if (out.length && out[out.length - 1].role === 'user') out[out.length - 1].content += '\n' + q; else out.push({ role: 'user', content: q });
  return out;
}
export async function ask(q, history, opt) {
  history = history || [];
  const ex = exact(String(q || ''), history); if (ex) return ex;
  const ai = !(opt && opt.ai === false) && typeof window !== 'undefined' && window.claude && typeof window.claude.complete === 'function';
  if (ai) {
    try { const r = parse(await window.claude.complete({ system: SYSTEM, messages: toMessages(history, q), max_tokens: 400 })); if (r) return r; }
    catch (e) { console.warn('Donee Talk: model unavailable, using the toolkit directly', e); }
  }
  return offline(q, history);
}

const pick = a => a[Math.floor(Math.random() * a.length)];
export function poke(zone) {
  if (Math.random() < 0.4) return { text: 'Remember: \u201C' + ITEMS[pick(['P1', 'P2', 'P3'])].quote + '\u201D', cards: [], mood: 'explain' };
  return zone === 'head'
    ? { text: pick(['Oi! Practise on me first, then on your donee.', 'Eh, my hair! Okay, pick a starter.']), cards: [], mood: 'myth' }
    : { text: pick(['Hehe, that tickles!', 'Nervous? Tap a starter and we can practise.']), cards: [], mood: 'cheer' };
}
export function tapLine(target) {
  if (target === 'clock') { const t = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); return { text: "It's " + t + '. A quiet moment is a good time for a talk like this.', mood: 'point' }; }
  if (target === 'plant') return { text: 'Money plant first, then the big talk.', mood: 'cheer' };
  if (target === 'chair') return { text: 'Tea break! Call me when you want to practise.', mood: 'cheer' };
  if (target === 'cat') return { text: pick(['Meet my cat! She keeps me company while we practise.', 'She naps on the rug whenever we talk. Very supportive.']), mood: 'cheer' };
  if (target === 'window') return { text: 'Somewhere out there is someone you trust. That is who you ask.', mood: 'present' };
  return null;
}
