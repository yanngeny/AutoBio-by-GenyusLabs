// Dictée : le téléphone transcrit la voix (plugin natif AutoBioVoice), ce module repère les chiffres utiles.
//  « plein 42 litres 78 euros 128450 km »  →  { liters: 42, total: 78, km: 128450 }
//  « péage 12 euros 50 »                   →  { amount: 12.5, category: 'Péage' }
const NUM = '(\\d+(?:[.,]\\d+)?)';
const clean = s => String(s || '').toLowerCase().replace(/[  ]/g, ' ').replace(/(\d)\s*virgule\s*(\d)/g, '$1,$2').replace(/(\d{1,3})\s(\d{3})(?!\d)/g, '$1$2');
const f = s => (s == null ? null : parseFloat(String(s).replace(',', '.')));

export function parseFuelVoice(text) {
  const s = clean(text), out = {};
  const ppl = s.match(new RegExp(`${NUM}\\s*(?:€|euros?|eur)\\s*(?:le litre|par litre|/ ?l)`));
  if (ppl) out.ppl = f(ppl[1]);
  const rest = ppl ? s.replace(ppl[0], ' ') : s;
  const l = rest.match(new RegExp(`${NUM}\\s*(?:litres?|liters?|l\\b)`)); if (l) out.liters = f(l[1]);
  const e = rest.match(new RegExp(`${NUM}\\s*(?:€|euros?|eur)(?:\\s*(\\d{1,2})(?!\\d))?`));
  if (e) out.total = e[2] && !/[.,]/.test(e[1]) ? f(`${e[1]}.${e[2].padStart(2, '0')}`) : f(e[1]);
  const k = rest.match(/(\d{4,6})\s*(?:km|kms|kilom[eè]tres?|kilometers?)/); if (k) out.km = parseInt(k[1], 10);
  if (out.ppl && out.liters && out.total == null) out.total = Math.round(out.liters * out.ppl * 100) / 100;
  return out;
}

const CATS = [['péage', 'Péage'], ['peage', 'Péage'], ['toll', 'Péage'], ['parking', 'Parking'], ['stationnement', 'Parking'], ['taxe', 'Taxes'], ['assurance', 'Assurance'], ['accessoire', 'Accessoires']];
export function parseExpenseVoice(text) {
  const s = clean(text), out = {};
  const e = s.match(new RegExp(`${NUM}\\s*(?:€|euros?|eur)(?:\\s*(\\d{1,2})(?!\\d))?`));
  if (e) out.amount = e[2] && !/[.,]/.test(e[1]) ? f(`${e[1]}.${e[2].padStart(2, '0')}`) : f(e[1]);
  const c = CATS.find(([k]) => s.includes(k)); if (c) out.category = c[1];
  const k = s.match(/(\d{4,6})\s*(?:km|kms|kilom[eè]tres?)/); if (k) out.km = parseInt(k[1], 10);
  return out;
}

const plugin = () => window.Capacitor?.Plugins?.AutoBioVoice;
export const available = () => !!plugin();
/** Ouvre la dictée Android. Renvoie '' si annulée. */
export async function listen(lang = 'fr') {
  const { text, cancelled } = await plugin().listen({ language: lang === 'en' ? 'en-GB' : 'fr-FR' });
  return cancelled ? '' : String(text || '');
}
