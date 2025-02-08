import { Markup } from 'telegraf';
import { ROOMS_LIST } from '../app.constatnts';

const wrappedKbd = (
  items: string[],
  options?: {
    lineLimit?: number;
    buttonType?: keyof Pick<typeof Markup.button, 'text'>;
    buttonArgs?: any[];
  },
) => {
  const btnFn = Markup.button[options.buttonType ?? 'text'];
  const columns = options.lineLimit ?? 4;

  const buttons = Array.from(
    { length: Math.ceil(items.length / columns) },
    (_, i) =>
      items.slice(i * columns, i * columns + columns).map((i) => btnFn(i)),
  );

  buttons.push([Markup.button.text('Отмена')]);

  return buttons;
};

export const floorsKeyboard = () =>
  Markup.keyboard(wrappedKbd(Object.keys(ROOMS_LIST), { lineLimit: 3 }));

export const belowsKeyboard = (floor: string) =>
  Markup.keyboard(wrappedKbd(Object.keys(ROOMS_LIST[floor]), { lineLimit: 2 }));

export const roomsKeyboard = (floor: string, belong: string) =>
  Markup.keyboard(wrappedKbd(ROOMS_LIST[floor][belong], { lineLimit: 3 }));

export const hideKeyboard = Markup.removeKeyboard();

export const skipKeyboard = Markup.keyboard([Markup.button.text('Пропустить')]);

export const cancelKeyboard = Markup.keyboard([Markup.button.text('Отмена')]);

export const acceptKeyboard = Markup.keyboard([
  [Markup.button.text('Отправить'), Markup.button.text('Отмена')],
]);
