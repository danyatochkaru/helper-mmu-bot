import { Markup } from 'telegraf';
import { ROOMS_LIST } from '../app.constatnts';

const wrappedKbd = (
  items: string[],
  options?: {
    lineLimit?: number;
    buttonType?: keyof Pick<typeof Markup.button, 'text'>;
  },
) => {
  const { buttonType = 'text', lineLimit = 4 } = options;
  const btnFn = Markup.button[buttonType];
  const columns = Math.min(lineLimit, 4);

  return Array.from({ length: Math.ceil(items.length / columns) }, (_, i) =>
    items.slice(i * columns, i * columns + columns).map((i) => btnFn(i)),
  );
};

export const corpusKeyboard = () =>
  Markup.keyboard(wrappedKbd(Object.keys(ROOMS_LIST), { lineLimit: 2 }));

export const floorsKeyboard = (corpus: string) =>
  Markup.keyboard(
    wrappedKbd(Object.keys(ROOMS_LIST[corpus]), {
      lineLimit: Object.keys(ROOMS_LIST[corpus])?.length / 2,
    }),
  );

export const belowsKeyboard = (corpus: string, floor: string) =>
  Markup.keyboard(
    wrappedKbd(Object.keys(ROOMS_LIST[corpus][floor]), { lineLimit: 2 }),
  );

export const roomsKeyboard = (corpus: string, floor: string, belong: string) =>
  Markup.keyboard(
    wrappedKbd(ROOMS_LIST[corpus][floor][belong], { lineLimit: 3 }),
  );

export const hideKeyboard = Markup.removeKeyboard();

export const skipKeyboard = Markup.keyboard([Markup.button.text('Пропустить')]);
