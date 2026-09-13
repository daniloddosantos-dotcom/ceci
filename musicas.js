/* ============================================================
   Cecí - REPERTÓRIO de músicas (tudo em notação simples)
   ------------------------------------------------------------
   Cada música é uma lista de notas com duração em batidas:
       'C4:1 E4:.5 -:1'  ->  dó (1 batida), mi (meia), silêncio (1)
   O app sintetiza em 4 camadas: melodia + acordes + baixo + percussão.

   GRAVAÇÕES: se existir o arquivo  audio/musicas/<chave>.mp3
   (uma gravação de domínio público que o papai baixar), o app toca
   a gravação em vez da síntese. O nome exato de cada arquivo está
   no campo "arquivo" de cada música (ex.: audio/musicas/ciranda.mp3).
   Se a gravação tiver um começo em silêncio ou outro andamento, use
   os campos opcionais "inicioGravacao" (segundos) e "bpmGravacao".

   Este arquivo é usado em dois lugares:
   - no app (window.CeciMusicas)
   - no service worker (self.CeciMusicas), para guardar as gravações offline
   ============================================================ */
(function (raiz) {
  'use strict';

  var CT = '#3a3630';

  /* ---- ícones simples (um por música) ---- */
  function ico(conteudo) { return '<svg viewBox="0 0 100 100" aria-hidden="true">' + conteudo + '</svg>'; }
  var ICONES = {
    gato: ico('<circle cx="50" cy="52" r="30" fill="#f7d9a0" stroke="' + CT + '" stroke-width="5"/>' +
      '<path d="M28 30 L24 8 L48 22 Z M72 30 L76 8 L52 22 Z" fill="#f7d9a0" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<circle cx="40" cy="48" r="4" fill="' + CT + '"/><circle cx="60" cy="48" r="4" fill="' + CT + '"/>' +
      '<path d="M50 58 q-6 7 -12 2 M50 58 q6 7 12 2" fill="none" stroke="' + CT + '" stroke-width="4" stroke-linecap="round"/>'),
    lua: ico('<path d="M60 14 a34 34 0 1 0 22 60 a28 28 0 0 1 -22 -60 Z" fill="#c9c3e8" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M22 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" fill="#f2c94c"/>'),
    sol: ico('<circle cx="50" cy="50" r="34" fill="#f2b705" stroke="' + CT + '" stroke-width="5"/>' +
      '<circle cx="38" cy="42" r="4" fill="' + CT + '"/><circle cx="62" cy="42" r="4" fill="' + CT + '"/>' +
      '<path d="M34 58 q16 16 32 0" fill="none" stroke="' + CT + '" stroke-width="5" stroke-linecap="round"/>'),
    estrela: ico('<path d="M50 10 L61 38 L92 40 L68 60 L76 90 L50 73 L24 90 L32 60 L8 40 L39 38 Z" fill="#f2b705" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>'),
    flor: ico('<path d="M50 88 V50" stroke="#4aa657" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M50 56 q-22 -6 -26 -26 q22 2 26 26 Z" fill="#b7d9a8" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="58" cy="34" r="18" fill="#e987b8" stroke="' + CT + '" stroke-width="4"/>' +
      '<circle cx="58" cy="34" r="6" fill="#f2b705"/>'),
    roda: ico('<circle cx="50" cy="50" r="30" fill="none" stroke="#cfc6b6" stroke-width="5" stroke-dasharray="6 8"/>' +
      '<circle cx="50" cy="18" r="9" fill="#e04a3f" stroke="' + CT + '" stroke-width="4"/>' +
      '<circle cx="82" cy="50" r="9" fill="#f2b705" stroke="' + CT + '" stroke-width="4"/>' +
      '<circle cx="50" cy="82" r="9" fill="#4aa657" stroke="' + CT + '" stroke-width="4"/>' +
      '<circle cx="18" cy="50" r="9" fill="#3a72c4" stroke="' + CT + '" stroke-width="4"/>'),
    canoa: ico('<path d="M10 56 q40 30 80 0 l-10 18 h-60 Z" fill="#c98a5a" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M50 54 V20 l26 22 Z" fill="#ffffff" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M8 84 q10 -8 20 0 q10 8 20 0 q10 -8 20 0 q10 8 20 0" fill="none" stroke="#58aed8" stroke-width="5" stroke-linecap="round"/>'),
    peixe: ico('<path d="M18 50 q26 -30 54 0 q-28 30 -54 0 Z" fill="#f19a3e" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M72 50 l20 -16 v32 Z" fill="#f19a3e" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<circle cx="34" cy="46" r="4" fill="' + CT + '"/>' +
      '<circle cx="24" cy="24" r="4" fill="#9ec5e8"/><circle cx="14" cy="14" r="3" fill="#9ec5e8"/>'),
    tambor: ico('<ellipse cx="50" cy="70" rx="36" ry="12" fill="#c98a5a" stroke="' + CT + '" stroke-width="5"/>' +
      '<path d="M14 70 V42 a36 12 0 0 1 72 0 V70" fill="#e0a878" stroke="' + CT + '" stroke-width="5"/>' +
      '<ellipse cx="50" cy="42" rx="36" ry="12" fill="#f6ead8" stroke="' + CT + '" stroke-width="5"/>' +
      '<path d="M30 20 L44 40 M70 20 L56 40" stroke="' + CT + '" stroke-width="5" stroke-linecap="round"/>'),
    pedrinhas: ico('<ellipse cx="30" cy="66" rx="18" ry="13" fill="#b3a894" stroke="' + CT + '" stroke-width="5"/>' +
      '<ellipse cx="66" cy="60" rx="20" ry="15" fill="#cfc6b6" stroke="' + CT + '" stroke-width="5"/>' +
      '<ellipse cx="48" cy="36" rx="15" ry="11" fill="#e6ddcd" stroke="' + CT + '" stroke-width="5"/>'),
    cravo: ico('<path d="M34 90 V56" stroke="#4aa657" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="34" cy="42" r="18" fill="#e04a3f" stroke="' + CT + '" stroke-width="4"/>' +
      '<path d="M68 90 V60" stroke="#4aa657" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="68" cy="46" r="16" fill="#e987b8" stroke="' + CT + '" stroke-width="4"/>' +
      '<circle cx="68" cy="46" r="6" fill="#f2b705"/>'),
    rua: ico('<path d="M14 84 L40 40 H60 L86 84 Z" fill="#cfc6b6" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M50 84 V44" stroke="#ffffff" stroke-width="4" stroke-dasharray="8 8"/>' +
      '<path d="M14 34 L30 16 L46 34 Z" fill="#e04a3f" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<rect x="18" y="34" width="24" height="16" fill="#f6d06a" stroke="' + CT + '" stroke-width="4"/>'),
    soldado: ico('<rect x="30" y="14" width="40" height="30" rx="6" fill="#3a72c4" stroke="' + CT + '" stroke-width="5"/>' +
      '<rect x="24" y="40" width="52" height="8" rx="4" fill="' + CT + '"/>' +
      '<circle cx="50" cy="64" r="18" fill="#f7d9a0" stroke="' + CT + '" stroke-width="5"/>' +
      '<circle cx="43" cy="62" r="3" fill="' + CT + '"/><circle cx="57" cy="62" r="3" fill="' + CT + '"/>' +
      '<path d="M42 72 q8 6 16 0" fill="none" stroke="' + CT + '" stroke-width="4" stroke-linecap="round"/>'),
    quebranozes: ico('<rect x="30" y="8" width="40" height="26" rx="5" fill="#e04a3f" stroke="' + CT + '" stroke-width="5"/>' +
      '<rect x="26" y="30" width="48" height="8" rx="4" fill="' + CT + '"/>' +
      '<rect x="30" y="38" width="40" height="34" rx="8" fill="#f7d9a0" stroke="' + CT + '" stroke-width="5"/>' +
      '<circle cx="42" cy="50" r="3.5" fill="' + CT + '"/><circle cx="58" cy="50" r="3.5" fill="' + CT + '"/>' +
      '<rect x="38" y="60" width="24" height="8" fill="#ffffff" stroke="' + CT + '" stroke-width="3"/>' +
      '<rect x="34" y="72" width="32" height="18" rx="4" fill="#3a72c4" stroke="' + CT + '" stroke-width="5"/>'),
    cisne: ico('<path d="M22 64 q28 26 58 0 l-6 16 h-46 Z" fill="#ffffff" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M76 62 q10 -30 -8 -40 q-14 -8 -18 6 q-4 10 6 14" fill="#ffffff" stroke="' + CT + '" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M52 28 l-12 4 l12 4 Z" fill="#f19a3e" stroke="' + CT + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<circle cx="60" cy="28" r="3" fill="' + CT + '"/>' +
      '<path d="M8 88 q12 -8 24 0 q12 8 24 0 q12 -8 24 0" fill="none" stroke="#58aed8" stroke-width="5" stroke-linecap="round"/>'),
    elefante: ico('<ellipse cx="46" cy="60" rx="34" ry="24" fill="#a9b4c4" stroke="' + CT + '" stroke-width="5"/>' +
      '<circle cx="76" cy="46" r="18" fill="#a9b4c4" stroke="' + CT + '" stroke-width="5"/>' +
      '<path d="M90 56 q10 20 -4 32" fill="none" stroke="' + CT + '" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M90 56 q10 20 -4 32" fill="none" stroke="#a9b4c4" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="60" cy="44" r="12" fill="#c9d0db" stroke="' + CT + '" stroke-width="4"/>' +
      '<circle cx="80" cy="42" r="3" fill="' + CT + '"/>' +
      '<rect x="24" y="76" width="12" height="16" rx="5" fill="#a9b4c4" stroke="' + CT + '" stroke-width="4"/>' +
      '<rect x="52" y="76" width="12" height="16" rx="5" fill="#a9b4c4" stroke="' + CT + '" stroke-width="4"/>'),
    aquario: ico('<path d="M18 30 q32 -30 64 0 v50 q-32 20 -64 0 Z" fill="#cfe7f7" stroke="' + CT + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M30 60 q12 -14 26 0 q-14 14 -26 0 Z" fill="#f19a3e" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M56 60 l10 -8 v16 Z" fill="#f19a3e" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="70" cy="40" r="4" fill="#ffffff" stroke="' + CT + '" stroke-width="2"/><circle cx="64" cy="30" r="3" fill="#ffffff" stroke="' + CT + '" stroke-width="2"/>' +
      '<path d="M24 82 q8 -8 16 0 q8 8 16 0 q8 -8 16 0" fill="none" stroke="#4aa657" stroke-width="4"/>'),
    galinha: ico('<ellipse cx="46" cy="62" rx="30" ry="22" fill="#f6ead8" stroke="' + CT + '" stroke-width="5"/>' +
      '<circle cx="70" cy="40" r="15" fill="#f6ead8" stroke="' + CT + '" stroke-width="5"/>' +
      '<path d="M84 42 l12 4 l-12 6 Z" fill="#f19a3e" stroke="' + CT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M62 26 q4 -10 8 0 q4 -10 8 0 q4 -8 6 2" fill="#e04a3f" stroke="' + CT + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<circle cx="74" cy="38" r="3" fill="' + CT + '"/>' +
      '<path d="M36 84 v8 M50 84 v8" stroke="#f19a3e" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M18 56 q-12 -10 -4 -20" fill="none" stroke="' + CT + '" stroke-width="5" stroke-linecap="round"/>')
  };

  /* ---------------------------------------------------------
     As músicas.
     tipo: 'original' | 'cantiga' | 'classico'
     usos: onde a música aparece -> 'dancar', 'cantar', 'bichos', 'fundo'
     gesto: o que o gatinho faz no Cantar
     versos: letra (uma linha por linha da melodia); melodia pode mudar por verso
     compasso: batidas por compasso (só para acentuar a percussão)
     timbre: 'doce' (padrão) | 'grave' | 'brilhante' | 'sino'
     --------------------------------------------------------- */
  var MUSICAS = {

    /* ===== originais (do próprio app) ===== */
    ceci: {
      nome: 'da Cecí', tipo: 'original', bpm: 104, compasso: 4, usos: ['dancar', 'fundo'],
      icone: ICONES.gato,
      melodia:
        'G4:1 C5:1 E5:1 G5:1  E5:2 C5:2  D5:1 F5:1 A5:1 F5:1  G5:4 ' +
        'A5:1 G5:1 E5:1 C5:1  D5:2 E5:2  F5:1 E5:1 D5:1 C5:1  G4:4 ' +
        'G4:1 C5:1 E5:1 G5:1  E5:2 C5:2  D5:1 F5:1 A5:1 F5:1  G5:4 ' +
        'E5:1 F5:1 G5:1 A5:1  G5:2 E5:2 ' +
        'G5:1 E5:1 D5:1 C5:1  C5:4',
      acordes: 'C:4 Am:4 F:4 G:4  Am:4 F:4 G:4 C:4  C:4 Am:4 F:4 G:4  F:4 G:4  C:4 C:4',
      dinamica: [[16, 1], [32, 0.72], [48, 1], [56, 0.66], [64, 0.9]]
    },

    calminha: {
      nome: 'calminha', tipo: 'original', bpm: 76, compasso: 4, usos: ['fundo'],
      icone: ICONES.lua,
      melodia:
        'E5:2 D5:1 C5:1  D5:2 C5:2  A4:1 C5:1 D5:1 C5:1  G4:4 ' +
        'E5:2 D5:1 C5:1  D5:2 C5:2  A4:1 C5:1 D5:1 E5:1  C5:4 ' +
        'G4:1 A4:1 C5:2  A4:1 G4:1 E4:2  G4:1 A4:1 C5:1 D5:1  C5:4 ' +
        'E5:2 D5:1 C5:1  D5:2 C5:2  A4:1 C5:1 D5:1 E5:1  C5:6',
      acordes: 'C:4 Am:4 F:4 G:4  C:4 Am:4 F:4 C:4  Am:4 F:4 G:4 C:4  C:4 Am:4 F:4 C:6',
      dinamica: [[16, 0.85], [32, 0.7], [48, 0.6], [70, 0.75]], percussao: false
    },

    pulinho: {
      nome: 'pulinho', tipo: 'original', bpm: 126, compasso: 4, usos: ['dancar', 'fundo'],
      icone: ICONES.sol,
      melodia:
        'C5:.5 C5:.5 E5:1 G5:1 E5:1  C5:.5 C5:.5 E5:1 G5:2 ' +
        'A5:.5 A5:.5 G5:1 E5:1 D5:1  C5:1 D5:1 E5:2 ' +
        'C5:.5 C5:.5 E5:1 G5:1 E5:1  C5:.5 C5:.5 E5:1 G5:2 ' +
        'A5:.5 A5:.5 G5:1 E5:1 D5:1  D5:1 D5:1 C5:2 ' +
        'G5:.5 G5:.5 A5:1 G5:1 E5:1  F5:.5 F5:.5 G5:1 F5:1 D5:1 ' +
        'C5:.5 C5:.5 E5:1 G5:1 E5:1  D5:1 D5:1 C5:2 ' +
        'E5:1 G5:1 C6:2  C5:4',
      acordes: 'C:4 C:4 F:4 C:4  C:4 C:4 F:2 G:2 C:4  G:4 F:4 C:4 G:2 C:2  C:4 C:4',
      dinamica: [[16, 1], [32, 0.85], [48, 1], [64, 0.8], [72, 1]]
    },

    /* ===== cantigas brasileiras (domínio público) ===== */
    ciranda: {
      nome: 'Ciranda, cirandinha', tipo: 'cantiga', bpm: 100, compasso: 2, respiro: 1.5,
      usos: ['dancar', 'cantar', 'fundo'], gesto: 'rodar', icone: ICONES.roda,
      melodia: [
        'A3:.5 D4:.5 D4:.5 F#4:.5 F#4:.5 A4:1 A4:1',
        'G4:.5 F#4:.5 E4:.5 A4:.5 F#4:.5 E4:.5 D4:1',
        'F#4:.5 A4:.5 G4:.5 F#4:.5 E4:.5 D4:.5 C#4:.5 A3:.5',
        'G4:.5 E4:.5 F#4:.5 D4:.5 E4:.5 C#4:.5 D4:1'
      ],
      acordes: '-:.5 D:2 D:2 A7:2 D:2 D:2 A7:2 G:1 D:1 A7:1 D:1',
      versos: [
        ['Ciranda, cirandinha', 'Vamos todos cirandar', 'Vamos dar a meia volta', 'Volta e meia vamos dar'],
        ['O anel que tu me deste', 'Era vidro e se quebrou', 'O amor que tu me tinhas', 'Era pouco e se acabou'],
        ['Por isso, dona Cecí', 'Entre dentro desta roda', 'Diga um verso bem bonito', 'Diga adeus e vá-se embora']
      ]
    },

    canoa: {
      nome: 'A canoa virou', tipo: 'cantiga', bpm: 108, compasso: 2,
      usos: ['dancar', 'cantar', 'fundo'], gesto: 'remar', icone: ICONES.canoa,
      melodia: [
        'G4:.5 G4:.5 G4:.5 G4:.5 F4:1 E4:1',
        'G4:.5 G4:.5 C5:.5 C5:.5 C5:.5 B4:.5 A4:1',
        'A4:.5 A4:.5 D5:.5 D5:.5 D5:.5 C5:.5 B4:.5 B4:.5',
        'A4:.5 G4:.5 G4:.5 F4:.5 E4:2'
      ],
      acordes: 'C:2 C:2 C:2 G7:2 G7:2 G7:2 G7:2 C:2',
      versos: [
        ['A canoa virou', 'Pois deixaram ela virar', 'Foi por causa da Cecí', 'Que não soube remar'],
        ['Se eu fosse um peixinho', 'E soubesse nadar', 'Eu tirava a Cecí', 'Lá do fundo do mar']
      ]
    },

    'peixe-vivo': {
      nome: 'Peixe vivo', tipo: 'cantiga', bpm: 96, compasso: 3,
      usos: ['cantar', 'fundo'], gesto: 'nadar', icone: ICONES.peixe, percussao: false,
      melodia: [
        'A4:1 C5:1 C5:1 Bb4:1 Bb4:1 D5:1 D5:1 C5:2',
        'A4:1 C5:1 C5:1 Bb4:1 G4:1 Bb4:1 Bb4:1 A4:2',
        'F4:1 F4:1 D4:1 Eb4:1 F4:1 Eb4:1 D4:1 C4:2',
        'F4:1 F4:1 D4:1 Eb4:1 F4:1 Eb4:1 D4:1 C4:2',
        'D4:1 Eb4:1 F4:1 A4:1 C5:1 C5:1 Bb4:1 Bb4:1 D5:1 D5:1 C5:2',
        'A4:1 C5:1 C5:1 Bb4:1 G4:1 A4:1 Bb4:1 Bb4:2'
      ],
      acordes: 'F7:3 Bb:3 F7:3  F7:3 Eb:3 F7:3  Bb:3 F7:3 F7:3  Bb:3 F7:3 F7:3  Bb:3 F7:3 Bb:3 F7:3  F7:3 F7:3 Bb:3',
      versos: [
        ['Como pode o peixe vivo', 'Viver fora da água fria', 'Como poderei viver', 'Como poderei viver', 'Sem a tua, sem a tua companhia', 'Sem a tua companhia'],
        ['Os pastores desta aldeia', 'Já me fazem zombaria', 'Por me verem assim chorando', 'Por me verem assim chorando', 'Sem a tua, sem a tua companhia', 'Sem a tua companhia']
      ]
    },

    'marcha-soldado': {
      nome: 'Marcha, soldado', tipo: 'cantiga', bpm: 112, compasso: 2,
      usos: ['dancar', 'cantar', 'fundo'], gesto: 'marchar', icone: ICONES.soldado,
      melodia: [
        'C5:1 C5:1 A4:.5 F4:.5 F4:1',
        'A4:.5 C5:.5 C5:.5 C5:.5 A4:1 G4:1',
        'G4:.5 Bb4:.5 Bb4:.5 Bb4:.5 Bb4:.5 G4:.5 C5:1',
        'C5:.5 D5:.5 C5:.5 Bb4:.5 A4:.5 G4:.5 F4:1'
      ],
      acordes: 'F:2 F:2 F:2 C7:2 C7:2 C7:2 C7:2 F:2',
      versos: [
        { letra: ['Marcha, soldado', 'Cabeça de papel', 'Quem não marchar direito', 'Vai preso pro quartel'] },
        { letra: ['O quartel pegou fogo', 'A polícia deu sinal', 'Acode, acode, acode', 'A bandeira nacional'],
          melodia: [
            'F4:.5 A4:.5 C5:1 C5:.5 A4:.5 F4:.5 F4:.5',
            'A4:.5 C5:.5 C5:.5 C5:.5 A4:1 G4:1',
            'A4:.5 Bb4:.5 Bb4:.5 Bb4:.5 G4:.5 C5:.5 C5:1',
            'D5:.5 C5:.5 Bb4:.5 A4:.5 G4:.5 F4:1.5'
          ] },
        { letra: ['Marcha, soldado', 'Cabeça de papel', 'Quem não marchar direito', 'Vai preso pro quartel'] }
      ]
    },

    'escravos-de-jo': {
      nome: 'Escravos de Jó', tipo: 'cantiga', bpm: 104, compasso: 2,
      usos: ['dancar', 'cantar', 'fundo'], gesto: 'passar', icone: ICONES.pedrinhas,
      melodia: [
        'G4:.5 C5:1 B4:.5 A4:.5 G4:1.5 A4:.5 G4:1 A4:.5 G4:.5 F4:.5 E4:1',
        'G4:1 E4:1 G4:2 E4:.5 E4:.5 D4:.5 C4:1.5',
        'G4:.5 A4:.5 G4:.5 E4:.5 G4:.5 A4:.5 G4:.5 E4:.5 G4:.5 A4:.5 G4:.5 A4:.5 B4:.5 C5:1.5',
        'G4:.5 A4:.5 G4:.5 E4:.5 G4:.5 A4:.5 G4:.5 E4:.5 G4:.5 A4:.5 G4:.5 A4:.5 B4:.5 C5:1.5'
      ],
      acordes: 'C:2 C:2 G7:2 C:2  C:2 C:2 G7:2 C:2  C:2 C:2 G7:2 C:2  C:2 C:2 G7:2 C:2',
      versos: [
        ['Escravos de Jó jogavam caxangá', 'Tira, põe, deixa ficar', 'Guerreiros com guerreiros fazem zigue-zigue-zá', 'Guerreiros com guerreiros fazem zigue-zigue-zá'],
        ['Escravos de Jó jogavam caxangá', 'Tira, põe, deixa ficar', 'Guerreiros com guerreiros fazem zigue-zigue-zá', 'Guerreiros com guerreiros fazem zigue-zigue-zá']
      ]
    },

    'cravo-e-rosa': {
      nome: 'O cravo e a rosa', tipo: 'cantiga', bpm: 100, compasso: 2,
      usos: ['dancar', 'cantar', 'fundo'], gesto: 'balancar', icone: ICONES.cravo,
      melodia: [
        'G4:.5 G4:.5 E4:1 C5:.5 B4:.5 A4:.5 G4:.5 F4:2',
        'A4:.5 A4:.5 F4:1 C5:.5 B4:.5 A4:.5 G4:2.5',
        'G4:.5 C5:.5 C5:1 C5:.5 D5:.5 C5:.5 B4:.5 A4:2',
        'A4:.5 G4:.5 B4:1 A4:.5 F4:.5 D4:.5 C4:.5 C4:2'
      ],
      acordes: 'C:2 C:2 G7:2  F:2 G7:2 C:2  C:2 G7:2 G7:2  G7:2 G7:2 C:2',
      versos: [
        ['O cravo brigou com a rosa', 'Debaixo de uma sacada', 'O cravo saiu ferido', 'E a rosa despedaçada'],
        ['O cravo ficou doente', 'A rosa foi visitar', 'O cravo teve um desmaio', 'E a rosa pôs-se a chorar']
      ]
    },

    'se-essa-rua': {
      nome: 'Se essa rua fosse minha', tipo: 'cantiga', bpm: 84, compasso: 4,
      usos: ['cantar', 'fundo'], gesto: 'balancar', icone: ICONES.rua, percussao: false,
      melodia: [
        'G4:.5 G4:.5 C5:1 C5:2 G4:.5 E4:.5 C4:1 G4:2 B4:.5 A4:.5 G4:1 D4:2',
        'G4:.5 G4:.5 D5:1 D5:2 B4:.5 G4:.5 A4:1 G4:2 E5:.5 D5:.5 C5:3',
        'G4:.5 G4:.5 C5:1 C5:2 C5:.5 D5:.5 E5:1 D5:2 C5:.5 G4:.5 B4:1 A4:2',
        'A4:.5 A4:.5 G4:3 D5:.5 B4:.5 G4:3 F4:.5 E4:.5 D4:1 C4:2'
      ],
      acordes: 'C:4 C:4 G7:4  G7:4 G7:4 C:4  C:4 C:4 G7:4  Am:4 G7:4 C:4',
      versos: [
        ['Se essa rua, se essa rua fosse minha', 'Eu mandava, eu mandava ladrilhar', 'Com pedrinhas, com pedrinhas de brilhante', 'Para o meu, para o meu amor passar'],
        ['Nessa rua, nessa rua tem um bosque', 'Que se chama, que se chama solidão', 'Dentro dele, dentro dele mora um anjo', 'Que roubou, que roubou meu coração']
      ]
    },

    'nao-atire': {
      nome: 'Não atire o pau no gato', tipo: 'cantiga', bpm: 112, compasso: 2,
      usos: ['dancar', 'cantar', 'fundo'], gesto: 'acenar', icone: ICONES.gato,
      melodia: [
        'A4:.5 G4:.5 F4:.5 E4:.5 D4:.5 E4:.5 F4:.5 G4:.5 G4:2',
        'A4:.5 G4:.5 F4:.5 F4:.5 F4:1',
        'G4:.5 F4:.5 E4:.5 E4:.5 E4:1',
        'C5:.5 C5:.5 A4:.5 A4:.5 A4:1',
        'B4:.5 A4:.5 G4:.5 G4:.5 G4:1',
        'E4:.5 F4:.5 G4:.5 E4:.5 F4:.5 G4:.5 F4:.5 E4:.5 D4:.5 C4:1.5',
        'G4:1 C5:2'
      ],
      acordes: 'F:2 G7:2 C:2  F:3  C:3  F:3  G7:3  C:2 G7:2 C:2  G7:1 C:2',
      versos: [
        ['Não atire o pau no gato-to', 'Porque isso-so', 'Não se faz-faz-faz', 'O gatinho-nho', 'É nosso amigo-go', 'Não devemos maltratar os animais', 'Miau!'],
        ['Não atire o pau no gato-to', 'Porque isso-so', 'Não se faz-faz-faz', 'O gatinho-nho', 'É nosso amigo-go', 'Não devemos maltratar os animais', 'Miau!']
      ]
    },

    /* ===== clássicos (domínio público) ===== */
    'brahms-ninar': {
      nome: 'Canção de ninar (Brahms)', tipo: 'classico', bpm: 72, compasso: 3, respiro: 3,
      usos: ['fundo'], icone: ICONES.lua, percussao: false, repetir: 1,
      melodia:
        'E4:.5 E4:.5 G4:2 E4:.5 E4:.5 G4:2 ' +
        'E4:.5 G4:.5 C5:2 B4:2 A4:1 A4:2 G4:1 ' +
        'D4:1 E4:1 F4:1 D4:2 D4:1 E4:1 F4:2 ' +
        'D4:1 F4:1 B4:1 A4:2 G4:1 B4:1 C5:2 ' +
        'C5:1 C5:1 C5:1 A4:2 F4:1 G4:3 ' +
        'E4:1 C4:1 F4:1 G4:2 A4:1 G4:3 ' +
        'C5:1 C5:1 C5:1 A4:2 F4:1 G4:3 ' +
        'E4:1 C4:1 F4:1 E4:2 D4:1 C4:3',
      acordes: 'C:3 C:3  C:3 G7:3 G7:3  G7:3 G7:3 C:3  G7:3 G7:3 C:3  C:3 F:3 C:3  C:3 F:3 G7:3  C:3 F:3 C:3  C:3 G7:3 C:3',
      dinamica: [[15, 0.8], [33, 0.7], [51, 0.62], [69, 0.7]]
    },

    'quebra-nozes-marcha': {
      nome: 'Marcha do Quebra-Nozes', tipo: 'classico', bpm: 120, compasso: 4, repetir: 2,
      usos: ['dancar', 'fundo'], icone: ICONES.quebranozes, timbre: 'brilhante',
      melodia:
        'D5:1 D5:.34 D5:.33 D5:.33 E5:1 E5:1 ' +
        'E5:.5 D5:.5 F#5:1 D5:.5 E5:1.5 ' +
        'D5:1 D5:.34 D5:.33 D5:.33 E5:1 E5:1 ' +
        'F#5:.5 D5:.5 E5:.5 E5:.5 C5:.5 E5:.5 D5:1 ' +
        'C5:.5 B4:.5 A4:.5 G4:.5 F#4:.5 A4:.5 D5:.5 D5:.5 ' +
        'B4:.5 C5:.5 B4:.5 A4:.5 G4:2',
      acordes: 'G:4 D7:4 G:4 D7:4 C:2 D7:2 G:2 D7:1 G:1',
      final: 'G4:.5 B4:.5 D5:.5 G5:.5 D5:.5 B4:.5 G4:2',
      acordesFinal: 'G:4',
      dinamica: [[8, 1], [16, 0.85], [24, 1]]
    },

    'vivaldi-primavera': {
      nome: 'Primavera (Vivaldi)', tipo: 'classico', bpm: 104, compasso: 4, repetir: 3,
      usos: ['dancar', 'fundo'], icone: ICONES.flor,
      melodia:
        'E5:.5 E5:.5 E5:1 E5:.5 E5:.5 E5:1 ' +
        'E5:.5 G#5:.5 B5:1 B5:.5 A5:.5 G#5:1 ' +
        'E5:.5 E5:.5 E5:1 E5:.5 E5:.5 E5:1 ' +
        'E5:.5 G#5:.5 B5:1 B5:.5 A5:.5 E5:1',
      acordes: 'E:4 E:2 B:2 E:4 E:2 B:2',
      final: 'B5:1 A5:1 G#5:1 E5:5',
      acordesFinal: 'B:4 E:4',
      dinamica: [[16, 1], [32, 0.75], [48, 1], [56, 0.9]]
    },

    'mozart-estrelinha': {
      nome: 'Estrelinha (Mozart)', tipo: 'classico', bpm: 100, compasso: 4, repetir: 1,
      usos: ['dancar', 'fundo'], icone: ICONES.estrela,
      melodia:
        'C5:1 C5:1 G5:1 G5:1 A5:1 A5:1 G5:2 ' +
        'F5:1 F5:1 E5:1 E5:1 D5:1 D5:1 C5:2 ' +
        'G5:1 G5:1 F5:1 F5:1 E5:1 E5:1 D5:2 ' +
        'G5:1 G5:1 F5:1 F5:1 E5:1 E5:1 D5:2 ' +
        'C5:1 C5:1 G5:1 G5:1 A5:1 A5:1 G5:2 ' +
        'F5:1 F5:1 E5:1 E5:1 D5:1 D5:1 C5:4',
      acordes: 'C:4 F:2 C:2  F:2 C:2 G:2 C:2  C:2 F:2 C:2 G:2  C:2 F:2 C:2 G:2  C:4 F:2 C:2  F:2 C:2 G:2 C:4',
      dinamica: [[16, 1], [32, 0.74], [50, 1]]
    },

    /* ===== Carnaval dos Animais (Saint-Saëns) ===== */
    cisne: {
      nome: 'O cisne', tipo: 'classico', bpm: 66, compasso: 6, repetir: 1, bicho: 'cisne',
      usos: ['bichos', 'fundo'], icone: ICONES.cisne, percussao: false, arpejo: true,
      melodia:
        'B4:5 A4:1  G4:3 A4:1 B4:1 D5:1  E5:4 D5:1 B4:1  A4:6 ' +
        'B4:5 A4:1  G4:3 F#4:1 E4:1 D4:1  C5:3 B4:1 A4:1 G4:1  F#4:6 ' +
        'G4:2 B4:2 D5:2  G5:4 F#5:1 E5:1  D5:3 B4:1 A4:1 G4:1  A4:6 ' +
        'B4:5 A4:1  G4:3 A4:1 B4:1 D5:1  C5:3 B4:1 A4:1 F#4:1  G4:6',
      acordes: 'G:6 G:6 C:6 D7:6  G:6 Em:6 Am:6 D7:6  G:6 G:6 D7:6 D7:6  G:6 G:6 D7:6 G:6',
      dinamica: [[24, 0.75], [48, 0.85], [72, 0.95], [96, 0.7]]
    },

    elefante: {
      nome: 'O elefante', tipo: 'classico', bpm: 108, compasso: 3, repetir: 2, bicho: 'elefante',
      usos: ['bichos', 'dancar', 'fundo'], icone: ICONES.elefante, timbre: 'grave',
      melodia:
        'G2:1 C3:2 C3:1 D3:1 E3:1 F3:1 G3:3 ' +
        'G3:1 F3:1 E3:1 D3:2 D3:1 E3:1 D3:1 C3:1 B2:3 ' +
        'G2:1 C3:2 C3:1 D3:1 E3:1 F3:1 G3:3 ' +
        'A3:1 G3:1 F3:1 E3:1 D3:1 B2:1 C3:3',
      acordes: 'C:3 C:3 C:3 G7:3 G7:3 G7:3 C:3 C:3 C:3 F:3 G7:3 C:3',
      dinamica: [[18, 1], [36, 0.85]]
    },

    aquario: {
      nome: 'Aquário', tipo: 'classico', bpm: 84, compasso: 4, repetir: 1, bicho: 'peixe',
      usos: ['bichos', 'fundo'], icone: ICONES.aquario, percussao: false, timbre: 'sino', arpejo: true,
      melodia:
        'E5:3 D5:.5 C5:.5 B4:3 A4:.5 G#4:.5 A4:2 B4:2 C5:4 ' +
        'E5:3 D5:.5 C5:.5 B4:3 A4:.5 G#4:.5 A4:2 G#4:2 A4:4 ' +
        'A5:3 G5:.5 F5:.5 E5:3 D5:.5 C5:.5 B4:2 C5:2 D5:4 ' +
        'E5:3 D5:.5 C5:.5 B4:3 A4:.5 G#4:.5 A4:8',
      acordes: 'Am:4 Am:4 E7:4 Am:4  Am:4 Am:4 E7:4 Am:4  F:4 C:4 E7:4 E7:4  Am:4 Am:4 Am:4 Am:4',
      dinamica: [[16, 0.7], [32, 0.6], [48, 0.75], [64, 0.55]]
    },

    galinhas: {
      nome: 'Galinhas e galos', tipo: 'classico', bpm: 132, compasso: 2, repetir: 2, bicho: 'galinha',
      usos: ['bichos', 'fundo'], icone: ICONES.galinha, timbre: 'brilhante',
      melodia:
        'C5:.25 C5:.25 C5:.25 C5:.25 C5:.25 C5:.25 C5:.5  D5:.25 C5:.25 D5:.25 C5:.25 D5:.25 C5:.25 D5:.5 ' +
        'E5:.25 E5:.25 E5:.25 E5:.25 D5:.25 D5:.25 C5:.5  C5:.25 C5:.25 C5:.25 C5:.25 C5:.25 C5:.25 C5:.5 ' +
        'C5:.5 F5:.5 G5:.5 A5:1.5 F5:1 ' +
        'C5:.25 C5:.25 C5:.25 C5:.25 D5:.25 D5:.25 E5:.5  D5:.25 C5:.25 B4:.25 C5:.25 C5:1',
      acordes: 'C:2 G7:2 C:2 G7:2 F:2 C:2 C:2 G7:1 C:1',
      dinamica: [[8, 0.9], [16, 1]]
    }
  };

  /* ---- ajuda ---- */
  var ORDEM = ['ceci', 'pulinho', 'calminha',
               'ciranda', 'canoa', 'peixe-vivo', 'marcha-soldado', 'escravos-de-jo', 'cravo-e-rosa', 'se-essa-rua', 'nao-atire',
               'brahms-ninar', 'quebra-nozes-marcha', 'vivaldi-primavera', 'mozart-estrelinha',
               'cisne', 'elefante', 'aquario', 'galinhas'];

  ORDEM.forEach(function (chave) {
    var m = MUSICAS[chave];
    m.chave = chave;
    m.arquivo = 'audio/musicas/' + chave + '.mp3';
    if (!m.usos) m.usos = [];
    if (!m.compasso) m.compasso = 4;
  });

  function comUso(uso) {
    return ORDEM.filter(function (k) { return MUSICAS[k].usos.indexOf(uso) >= 0; }).map(function (k) { return MUSICAS[k]; });
  }

  var api = { todas: MUSICAS, ordem: ORDEM, comUso: comUso, ICONES: ICONES };
  raiz.CeciMusicas = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
