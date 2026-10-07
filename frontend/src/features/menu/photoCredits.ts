/**
 * Where each dish photo came from.
 *
 * Every photo is used under a licence that allows commercial use, and the CC BY
 * and CC BY-SA ones require credit, so the credit ships with the app rather than
 * sitting in a file nobody opens. Photos were cropped and resized; they keep
 * their own licence, which is not the licence of the code.
 */
export type PhotoCredit = {
  itemId: string
  title: string
  creator: string
  license: string
  licenseUrl: string
  source: string
}

export const PHOTO_CREDITS: PhotoCredit[] = [
  {
    itemId: 'agua',
    title: 'BORJOMI GEORGIAN MINERAL WATER glass bottle0.5 barcode4860019001346 codeCG2RUBY1 date30.10.2019L10 1',
    creator: 'Matsievsky',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File%3ABORJOMI%20GEORGIAN%20MINERAL%20WATER%20glass%20bottle0.5%20barcode4860019001346%20codeCG2RUBY1%20date30.10.2019L10%201.jpg',
  },
  {
    itemId: 'ancho',
    title: 'Cut of Sirloin Steak in Medium',
    creator: 'Ceeseven',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File%3ACut%20of%20Sirloin%20Steak%20in%20Medium.jpg',
  },
  {
    itemId: 'bolinho-bacalhau',
    title: 'Bolinhos de bacalhau',
    creator: 'Eduardo P',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    source: 'https://commons.wikimedia.org/wiki/File%3ABolinhos%20de%20bacalhau.jpg',
  },
  {
    itemId: 'burrata',
    title: 'Burrata 06',
    creator: 'Arnaud 25',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File%3ABurrata%2006.jpg',
  },
  {
    itemId: 'cacio-e-pepe',
    title: 'Cacio e pepe',
    creator: 'Popo le Chien',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    source: 'https://commons.wikimedia.org/wiki/File%3ACacio%20e%20pepe.jpg',
  },
  {
    itemId: 'carpaccio',
    title: 'Carpaccio de boeuf',
    creator: 'M wassim salah',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File%3ACarpaccio%20de%20boeuf.jpg',
  },
  {
    itemId: 'chopp',
    title: 'Beer wuerzburger hofbraue v',
    creator: 'Christian "VisualBeo" Horvat',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'http://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File%3ABeer%20wuerzburger%20hofbraue%20v.jpg',
  },
  {
    itemId: 'limonada',
    title: 'Lemonade - 27682817724',
    creator: 'HarshLight',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    source: 'https://commons.wikimedia.org/wiki/File%3ALemonade%20-%2027682817724.jpg',
  },
  {
    itemId: 'linguine-frutos',
    title: 'Pasta with Calamari, Mussels & Prawns in a spicy tomato sauce. (43496515800)',
    creator: 'CharmaineZoe\'s Marvelous Melange from England',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    source: 'https://commons.wikimedia.org/wiki/File%3APasta%20with%20Calamari%2C%20Mussels%20%26%20Prawns%20in%20a%20spicy%20tomato%20sauce.%20%2843496515800%29.jpg',
  },
  {
    itemId: 'pao-na-chapa',
    title: 'Wholemeal Sourdough Bread, Smoked butter with sherry and apple and Olive Oil from the Duero valley - Alma, Lisbon (52740671865)',
    creator: 'Haydn Blackey from Cardiff, Wales',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
    source: 'https://commons.wikimedia.org/wiki/File%3AWholemeal%20Sourdough%20Bread%2C%20Smoked%20butter%20with%20sherry%20and%20apple%20and%20Olive%20Oil%20from%20the%20Duero%20valley%20-%20Alma%2C%20Lisbon%20%2852740671865%29.jpg',
  },
  {
    itemId: 'peixe-do-dia',
    title: 'Grilled plated salmon fillet',
    creator: 'DanaTentis',
    license: 'CC0',
    licenseUrl: 'http://creativecommons.org/publicdomain/zero/1.0/deed.en',
    source: 'https://commons.wikimedia.org/wiki/File%3AGrilled%20plated%20salmon%20fillet.jpg',
  },
  {
    itemId: 'petit-gateau',
    title: 'Chocolate lava cake',
    creator: 'sanctumsolitude',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    source: 'https://commons.wikimedia.org/wiki/File%3AChocolate%20lava%20cake.jpg',
  },
  {
    itemId: 'pudim',
    title: 'Pudim de leite (3544225805)',
    creator: 'Marcelo Träsel from Porto Alegre, Brasil',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
    source: 'https://commons.wikimedia.org/wiki/File%3APudim%20de%20leite%20%283544225805%29.jpg',
  },
  {
    itemId: 'rague-costela',
    title: 'Tagliatelle al ragù (image modified)',
    creator: 'Ivan Vighetto',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'http://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File%3ATagliatelle%20al%20rag%C3%B9%20%28image%20modified%29.jpg',
  },
  {
    itemId: 'ravioli-ricota',
    title: 'Tortelli d\'erbetta',
    creator: 'Clop',
    license: 'Public domain',
    licenseUrl: '',
    source: 'https://commons.wikimedia.org/wiki/File%3ATortelli%20d%27erbetta.jpg',
  },
  {
    itemId: 'risoto-cogumelos',
    title: 'Risotto ai funghi porcini',
    creator: 'Number55',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    source: 'https://commons.wikimedia.org/wiki/File%3ARisotto%20ai%20funghi%20porcini.JPG',
  },
  {
    itemId: 'tiramisu',
    title: 'Tiramisu in Ankara',
    creator: 'E4024',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File%3ATiramisu%20in%20Ankara.jpg',
  },
  {
    itemId: 'vinho-taca',
    title: 'Museo3 vivancos briones lou',
    creator: 'Nicolás Pérez',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'http://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File%3AMuseo3%20vivancos%20briones%20lou.jpg',
  },
]
