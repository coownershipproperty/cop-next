/**
 * lib/compare-hub-groups.js — the shape of the comparison hub, in one place.
 *
 * The hub exists in four languages. Before this file the order and the
 * grouping lived inline in pages/compare/index.js and the locale hubs did
 * not exist at all, which meant every locale comparison page emitted a
 * BreadcrumbList pointing at /es/comparativa/ — a live 404 — and the nav
 * link beside it did the same. (16 Sep 2026)
 *
 * ORDER and GROUP_SLUGS are language-independent: a slug registered here
 * appears in every language that has a translation of it, and nowhere twice.
 * HUB_COPY carries the words.
 */

// The order a buyer actually needs them in: what is this thing, then is it
// worth it, then who from, then why through us.
export const ORDER = [
  'fractional-ownership-vs-timeshare',
  'fractional-ownership-vs-second-home',
  'fractional-ownership-vs-renting',
  'which-co-ownership-operator',
  'best-fractional-ownership-companies',
  'pacaso-vs-myne',
  'myne-vs-vivla',
  'pacaso-vs-vivla',
  'myne-vs-andhamlet',
  'pacaso-alternatives',
  'cop-vs-going-direct',
];

export const GROUP_SLUGS = [
  { key: 'model', slugs: ['fractional-ownership-vs-timeshare', 'fractional-ownership-vs-second-home', 'fractional-ownership-vs-renting'] },
  { key: 'operators', slugs: ['which-co-ownership-operator', 'best-fractional-ownership-companies', 'pacaso-vs-myne', 'myne-vs-vivla', 'pacaso-vs-vivla', 'myne-vs-andhamlet', 'pacaso-alternatives'] },
  { key: 'route', slugs: ['cop-vs-going-direct'] },
];

export const HUB_COPY = {
  en: {
    title: 'Co-Ownership Compared: Operators, Timeshare, Outright',
    description: 'Every comparison in one place: co-ownership against timeshare, against a whole second home and against renting, the six operators side by side, and agent versus direct.',
    eyebrow: 'Compare',
    h1: 'Co-ownership, compared',
    subtitle: 'Every question a buyer asks before committing, answered in one place and on the same facts.',
    listName: 'Co-ownership comparisons',
    moreHeading: 'More comparisons',
    groups: {
      model: {
        heading: 'Is co-ownership the right thing at all?',
        blurb: 'Before the operator matters, the model has to. These three answer the questions everybody asks first — whether this is a timeshare wearing a better suit, whether it beats simply buying a whole house, and whether it beats not buying at all.',
      },
      operators: {
        heading: 'Which operator suits you',
        blurb: 'The models differ in ways that decide the purchase: nights a year, whether you may let the home, how resale works, and where the houses are. Every figure is measured across the 268 live listings rather than taken from anybody’s marketing.',
      },
      route: {
        heading: 'And how you buy',
        blurb: 'The question we are asked most often, answered plainly.',
      },
    },
    skipHeading: 'Or skip the reading',
    skipBody: 'The comparisons matter less once you have a home in front of you with its price, its running cost and its usage terms printed on the page. That is what every listing here carries.',
    skipLink: 'Browse the homes',
  },
  es: {
    title: 'Copropiedad comparada: operadores, multipropiedad y más',
    description: 'Todas las comparativas en un solo lugar: la copropiedad frente a la multipropiedad, frente a una segunda vivienda entera y frente al alquiler, y los seis operadores lado a lado.',
    eyebrow: 'Comparativa',
    h1: 'La copropiedad, comparada',
    subtitle: 'Todas las preguntas que un comprador se hace antes de decidirse, respondidas en un mismo sitio y con los mismos datos.',
    listName: 'Comparativas de copropiedad',
    moreHeading: 'Más comparativas',
    groups: {
      model: {
        heading: '¿Es la copropiedad lo que busca?',
        blurb: 'Antes de que importe el operador, tiene que importar el modelo. Estas tres responden a lo que todo el mundo pregunta primero: si esto es una multipropiedad con mejor traje, si sale mejor que comprar una casa entera y si sale mejor que no comprar nada.',
      },
      operators: {
        heading: 'Qué operador le conviene',
        blurb: 'Los modelos se diferencian en lo que decide la compra: noches al año, si puede alquilar la vivienda, cómo funciona la reventa y dónde están las casas. Cada cifra está medida sobre las 268 viviendas activas, no tomada del marketing de nadie.',
      },
      route: {
        heading: 'Y cómo se compra',
        blurb: 'La pregunta que más nos hacen, respondida sin rodeos.',
      },
    },
    skipHeading: 'O sáltese la lectura',
    skipBody: 'Las comparativas importan menos cuando ya tiene delante una vivienda con su precio, sus costes operativos y sus condiciones de uso impresos en la página. Eso es lo que lleva cada anuncio de este sitio.',
    skipLink: 'Ver las viviendas',
  },
  fr: {
    title: 'La copropriété comparée : opérateurs, timeshare, location',
    description: 'Toutes les comparaisons au même endroit : la copropriété face au timeshare, face à une résidence secondaire entière et face à la location, et les six opérateurs côte à côte.',
    eyebrow: 'Comparaison',
    h1: 'La copropriété, comparée',
    subtitle: 'Toutes les questions qu’un acheteur se pose avant de s’engager, traitées au même endroit et sur les mêmes chiffres.',
    listName: 'Comparaisons de copropriété',
    moreHeading: 'Autres comparaisons',
    groups: {
      model: {
        heading: 'La copropriété est-elle la bonne formule ?',
        blurb: 'Avant que l’opérateur ne compte, c’est le modèle qui compte. Ces trois pages répondent à ce que tout le monde demande en premier : est-ce un timeshare mieux habillé, cela vaut-il mieux qu’acheter une maison entière, et cela vaut-il mieux que ne rien acheter du tout.',
      },
      operators: {
        heading: 'Quel opérateur vous convient',
        blurb: 'Les modèles diffèrent sur ce qui décide l’achat : les nuits par an, le droit de louer le bien, le fonctionnement de la revente et l’emplacement des maisons. Chaque chiffre est mesuré sur les 268 biens en vente, et non repris du marketing de qui que ce soit.',
      },
      route: {
        heading: 'Et comment acheter',
        blurb: 'La question qu’on nous pose le plus souvent, traitée sans détour.',
      },
    },
    skipHeading: 'Ou passez la lecture',
    skipBody: 'Les comparaisons comptent moins une fois qu’un bien est devant vous avec son prix, ses coûts d’exploitation et ses conditions d’usage imprimés sur la page. C’est ce que porte chaque annonce de ce site.',
    skipLink: 'Voir les biens',
  },
  de: {
    title: 'Miteigentum im Vergleich: Anbieter, Timesharing, Mieten',
    description: 'Alle Vergleiche an einem Ort: Miteigentum gegen Timesharing, gegen eine ganze Zweitimmobilie und gegen Mieten — und die sechs Anbieter nebeneinander.',
    eyebrow: 'Vergleich',
    h1: 'Miteigentum im Vergleich',
    subtitle: 'Jede Frage, die sich Käufer vor der Entscheidung stellen, an einem Ort und auf derselben Zahlenbasis beantwortet.',
    listName: 'Vergleiche zum Miteigentum',
    moreHeading: 'Weitere Vergleiche',
    groups: {
      model: {
        heading: 'Ist Miteigentum überhaupt das Richtige?',
        blurb: 'Bevor der Anbieter zählt, muss das Modell zählen. Diese drei Seiten beantworten, was alle zuerst fragen: ob das ein Timesharing im besseren Anzug ist, ob es besser ist als der Kauf eines ganzen Hauses, und ob es besser ist als gar nicht zu kaufen.',
      },
      operators: {
        heading: 'Welcher Anbieter zu Ihnen passt',
        blurb: 'Die Modelle unterscheiden sich genau dort, wo die Kaufentscheidung fällt: Nächte pro Jahr, ob Sie die Immobilie vermieten dürfen, wie der Weiterverkauf läuft und wo die Häuser stehen. Jede Zahl ist an den 268 gelisteten Immobilien gemessen und nicht aus irgendwessen Marketing übernommen.',
      },
      route: {
        heading: 'Und wie Sie kaufen',
        blurb: 'Die Frage, die uns am häufigsten gestellt wird — klar beantwortet.',
      },
    },
    skipHeading: 'Oder überspringen Sie das Lesen',
    skipBody: 'Vergleiche zählen weniger, sobald eine Immobilie vor Ihnen liegt, deren Preis, laufende Kosten und Nutzungsbedingungen auf der Seite stehen. Genau das trägt hier jedes Angebot.',
    skipLink: 'Die Immobilien ansehen',
  },
};
