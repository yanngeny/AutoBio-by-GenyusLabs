import {parsePump,parseOdometer} from '../js/ocr.js';
let bad=0;const t=(n,ok)=>{console.log(ok?'OK  ':'FAIL',n);if(!ok)bad++;};
let p=parsePump("TOTAL\nMontant 82,00 €\nVolume 47,64 L\nPrix 1,721 €/L");t('pompe étiquettes',p.liters===47.64&&p.total===82&&p.ppl===1.721);
p=parsePump("82.00\n47.64\n1.721\n003");t('pompe sans étiquettes',p.liters===47.64&&p.total===82&&p.ppl===1.721);
p=parsePump("Total 66,37 EUR\n38,59 litres");t('pompe partielle',p.total===66.37&&p.liters===38.59);
p=parsePump("1,99 €/L\n87,00 €");t('pompe litres déduits',p.ppl===1.99&&p.total===87&&Math.abs(p.liters-43.72)<0.01);
t('compteur proche du dernier km',parseOdometer("12.4 trip\n60 703 km\n19:42",60500)===60703);
t('compteur sans ref',parseOdometer("ODO 060703 km")===60703||parseOdometer("60703km")===60703);
t('compteur ignore trip décimal',parseOdometer("1234.5\n60703",60500)===60703);
t('rien',parseOdometer("bonjour",1000)===null);

process.exit(bad?1:0);
