// AskLisa's answers: Claude (window.claude.complete) grounded in the LPA GO! Fact Bank, with an offline
// matcher over the same cards when the model is unavailable or switched off.
import { CARDS } from './lpa-go-script.js';

export const CARD_IDS = Object.keys(CARDS);
const clean = s => s.replace(/\s*\[VERIFY[^\]]*\]/g, '').trim();
export function card(id) { const c = CARDS[id]; if (!c) return null; const src = clean(c.s); return { id, text: c.t, src, short: src.split(';')[0].trim() }; }
export const STARTERS = ['What is an LPA, simply?', "I'm only 25. Do I need one?", 'Who can be my donee?', 'How much does it cost?', "Can't my family just decide for me?", 'When does it kick in?'];
const BANK = CARD_IDS.map(id => id + ': ' + CARDS[id].t + ' (Source: ' + clean(CARDS[id].s) + ')').join('\n');
const SYSTEM = `You are Lisa Lim, "LPA Lisa", 24, a social-work student on placement at the Tenang Community Club in Singapore, from the game LPA GO!. You are at home in your room, and someone is chatting with you on their phone. You help people understand Singapore's Lasting Power of Attorney (LPA).

How you answer:
- Use only the FACT BANK below for facts about the law, forms, fees, timings and numbers. Never invent figures, section numbers or procedures.
- If the fact bank does not cover it, say so plainly and suggest the Office of the Public Guardian (OPG) or a lawyer.
- You give information, not legal advice. For someone's own situation, suggest a lawyer or OPG.
- Warm, plain and brief: at most 55 words, one to three sentences, no lists, no markdown. A light Singlish touch ("lah", "can") is fine now and then, never forced.
- If asked about something unrelated, answer in one friendly line and steer back to the LPA.
- If someone sounds worried, or a family member may already have lost capacity, be kind and point them to OPG, a doctor or a lawyer.

Reply with JSON only, nothing before or after it:
{"say": "...", "cards": ["C-05"], "mood": "explain", "next": ["...", "..."]}
- cards: the IDs of the fact-bank cards you relied on (zero to three).
- mood: "myth" when correcting a misconception, "instruct" for steps or how-to, "unsure" when the bank does not cover it, "cheer" for encouragement or thanks, "greet" for hellos, otherwise "explain".
- next: two short follow-up questions, seven words or fewer each, that this person might ask you next.

FACT BANK:
${BANK}`;
const MOODS = ['explain', 'myth', 'instruct', 'unsure', 'cheer', 'greet'];
function parse(raw) {
  if (!raw) return null;
  const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
  let j = null;
  if (a >= 0 && b > a) { try { j = JSON.parse(raw.slice(a, b + 1)); } catch (e) { j = null; } }
  if (!j || typeof j.say !== 'string' || !j.say.trim()) return raw.trim() && a < 0 ? { say: raw.trim().slice(0, 400), cards: [], mood: 'explain', next: [], src: 'ai' } : null;
  return {
    say: j.say.trim(),
    cards: (Array.isArray(j.cards) ? j.cards : []).filter(id => CARDS[id]).slice(0, 3),
    mood: MOODS.includes(j.mood) ? j.mood : 'explain',
    next: (Array.isArray(j.next) ? j.next : []).filter(s => typeof s === 'string' && s.trim()).map(s => s.trim()).slice(0, 2),
    src: 'ai'
  };
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
  const ai = !(opt && opt.ai === false) && typeof window !== 'undefined' && window.claude && typeof window.claude.complete === 'function';
  if (ai) {
    try {
      const raw = await window.claude.complete({ system: SYSTEM, messages: toMessages(history || [], q), max_tokens: 500 });
      const r = parse(typeof raw === 'string' ? raw : (raw && raw.text) || '');
      if (r) return r;
    } catch (e) { console.warn('AskLisa: model unavailable, answering from the Fact Bank', e); }
  }
  return offline(q);
}

// ---- offline: intents point at cards, then the best-matching sentences are quoted
const INTENTS = [
  { re: /^\s*(hi|hello|hey|yo|hiya|good (morning|afternoon|evening))\b/i, say: "Hi! I'm Lisa. Ask me anything about the Lasting Power of Attorney and I'll keep it simple.", mood: 'greet', next: ['What is an LPA, simply?', 'Who can be my donee?'] },
  { re: /\b(thank|thanks|tq|ty|cheers)\b/i, say: 'Anytime! Ask me again whenever something about the LPA confuses you.', mood: 'cheer', next: ['How do I make one?', 'How much does it cost?'] },
  { re: /\b(cost|fee|fees|price|free|pay|how much|charge|waive)/i, cards: ['C-18', 'C-17'], kw: 'fee waived pay citizens charge professional', mood: 'explain' },
  { re: /\b(young|age|old people|elderly|21|too early|only \d\d|twenties|student)\b/i, cards: ['C-05', 'C-02'], kw: '21 older capacity lost crash', mood: 'myth' },
  { re: /\b(next[- ]of[- ]kin|family|children|kids|son|daughter|spouse|wife|husband|mum|mom|mother|dad|father|parents?|automatic)/i, cards: ['C-21', 'C-30'], kw: 'automatic authority court deputy spouse children', mood: 'myth' },
  { re: /\b(donee|who can|appoint|choose|pick|trust)\b/i, cards: ['C-06', 'C-07'], kw: 'donee 21 individual bankrupt jointly severally', mood: 'explain' },
  { re: /\b(certificate issuer|ci|doctor|lawyer|psychiatrist|certif)/i, cards: ['C-17'], kw: 'certificate issuer doctor lawyer psychiatrist checks', mood: 'explain' },
  { re: /\b(how (do|to|can)|steps?|apply|make one|process|opgo|singpass|register|sign up|start)\b/i, cards: ['C-18'], kw: 'opgo singpass draft accept certifies registered', mood: 'instruct' },
  { re: /\b(how long|weeks?|days?|waiting|wait)\b/i, cards: ['C-18'], kw: 'waiting period weeks working days registered', mood: 'explain' },
  { re: /\b(revoke|cancel|change|amend|update|remove)\b/i, cards: ['C-19'], kw: 'revoke cancel amended revoke-and-remake', mood: 'explain' },
  { re: /\b(when|activate|kick in|start working|use it|take effect)\b/i, cards: ['C-10', 'C-28'], kw: 'sleeps needed lack capacity doctor certifies', mood: 'explain' },
  { re: /\b(medical|treatment|life[- ]?support|life[- ]sustaining|pull the plug|amd|hospital|surgery)\b/i, cards: ['C-11', 'C-08'], kw: 'life-sustaining treatment doctors medical', mood: 'myth' },
  { re: /\b(will|wills|wasiat|faraid|die|death|estate|inherit)/i, cards: ['C-25'], kw: 'will death revoked', mood: 'explain' },
  { re: /\b(money|bank|account|property|cpf|bills|hdb|house|flat|insurance)\b/i, cards: ['C-09', 'C-14'], kw: 'bank accounts bills property cpf', mood: 'explain' },
  { re: /\b(gift|ang ?pao|hongbao|donat)/i, cards: ['C-14'], kw: 'gifts expressly value reasonable', mood: 'explain' },
  { re: /\b(professional|no one|nobody|single|alone|childless|no family)\b/i, cards: ['C-22', 'C-30'], kw: 'professional donee trust company friends', mood: 'explain' },
  { re: /\bform ?(1|2|one|two)\b|\bforms?\b/i, cards: ['C-16', 'C-35'], kw: 'form 1 form 2 lawyer standard', mood: 'explain' },
  { re: /\b(capacity|dementia|stroke|coma|test|lose my mind)\b/i, cards: ['C-04', 'C-02'], kw: 'understand retain weigh communicate decision', mood: 'explain' },
  { re: /\b(abuse|misuse|cheat|scam|safe|safeguard|protect|report|complain)/i, cards: ['C-20', 'C-29'], kw: 'public guardian safeguards complaints accountable', mood: 'explain' },
  { re: /\b(what('?s| is)|explain|meaning|mean|define)\b.*\b(lpa|lasting power|attorney)\b|^\s*(lpa|lasting power of attorney)\s*\??\s*$/i, cards: ['C-27', 'C-10'], kw: 'lasting capacity designed', mood: 'explain' },
  { re: /\b(how many|statistics?|numbers?|percent|people have)\b/i, cards: ['C-26'], kw: '400,000 one in seven', mood: 'explain' }
];
const NEXT = {
  'C-18': ['Who can be my donee?', 'What does the doctor check?'], 'C-05': ['What if I lose capacity suddenly?', 'How do I make one?'],
  'C-21': ['What does a deputy do?', 'How do I make one?'], 'C-06': ['Can I have two donees?', 'Can my donee be paid?'],
  'C-17': ['How long until it is registered?', 'How much does it cost?'], 'C-19': ['Can I change my donee?', 'When does it kick in?'],
  'C-10': ['Who decides I lack capacity?', 'What can my donee decide?'], 'C-11': ['Is an LPA the same as an AMD?', 'What can my donee decide?'],
  'C-25': ['Do I still need a will?', 'When does it kick in?'], 'C-09': ['Can my donee give gifts?', 'Who can be my donee?'],
  'C-22': ['How much do they charge?', 'Who can be my donee?'], 'C-27': ['Do I need one at 25?', 'How do I make one?']
};
const STOP = new Set('a an the is are am i me my you your it its to of for and or in on at do does can could will would should what how who when why which if be with about this that there they them we our not no yes so just'.split(' '));
const words = s => s.toLowerCase().replace(/[^a-z0-9' -]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
const sentences = t => t.match(/[^.!?]+[.!?]+/g) || [t];
function quote(id, q, kw) {
  const want = new Set(words(q + ' ' + (kw || '')));
  const ss = sentences(CARDS[id].t).map((s, i) => ({ s: s.trim(), i, score: words(s).filter(w => want.has(w)).length + (i === 0 ? 0.5 : 0) }));
  const best = ss.slice().sort((a, b) => b.score - a.score);
  const pick = [best[0]];
  if (best[1] && (pick[0].s.split(' ').length + best[1].s.split(' ').length) <= 52 && best[1].score > 0) pick.push(best[1]);
  return pick.sort((a, b) => a.i - b.i).map(p => p.s).join(' ');
}
const PREFACE = { myth: 'Common mix-up! ', instruct: '', explain: '', unsure: '' };
export function offline(q) {
  const it = INTENTS.find(x => x.re.test(q));
  if (it && it.say) return { say: it.say, cards: [], mood: it.mood, next: it.next, src: 'bank' };
  let ids = it ? it.cards : null, kw = it ? it.kw : '';
  if (!ids) {
    const want = new Set(words(q)); let best = null, bs = 0;
    CARD_IDS.forEach(id => { const sc = words(CARDS[id].t).filter(w => want.has(w)).length; if (sc > bs) { bs = sc; best = id; } });
    if (bs < 2) return { say: "Hmm, that one's not in my notes. The Office of the Public Guardian or a lawyer can tell you properly. I can explain who can be your donee, or what happens without an LPA.", cards: [], mood: 'unsure', next: ['Who can be my donee?', 'What happens without an LPA?'], src: 'bank' };
    ids = [best];
  }
  const mood = it ? it.mood : 'explain';
  return { say: PREFACE[mood] + quote(ids[0], q, kw), cards: ids.slice(0, 2), mood, next: NEXT[ids[0]] || ['How do I make one?', 'Who can be my donee?'], src: 'bank' };
}

// ---- little lines for pokes and taps
const pick = a => a[Math.floor(Math.random() * a.length)];
const FACTS = ['C-27', 'C-05', 'C-10', 'C-21', 'C-12', 'C-36', 'C-01', 'C-31'];
export function poke(zone) {
  if (Math.random() < 0.45) { const id = pick(FACTS); return { text: 'Did you know? ' + sentences(CARDS[id].t)[0].trim(), cards: [id], mood: 'explain' }; }
  return zone === 'head'
    ? { text: pick(['Oi! That is where I keep all my LPA facts.', 'Eh, my hair!', 'Ow! Okay, okay. Ask me something.']), cards: [], mood: 'myth' }
    : { text: pick(['Hehe, that tickles!', 'You poke, I talk LPA. Deal?', 'Okay, I am listening!']), cards: [], mood: 'cheer' };
}
export function tapLine(target) {
  if (target === 'clock') { const t = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); return { text: "It's " + t + '. The clock never waits, and neither does capacity.', mood: 'point' }; }
  if (target === 'plant') return { text: 'Money plant first, then LPA.', mood: 'cheer' };
  if (target === 'chair') return { text: 'Tea break! Call me when you have a question.', mood: 'cheer' };
  if (target === 'window') return { text: "That's Tenang out there. Every block has someone who should make one.", mood: 'present' };
  return null;
}
