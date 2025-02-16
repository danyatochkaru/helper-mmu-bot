import { Ctx, Hears, On, Start, Wizard, WizardStep } from 'nestjs-telegraf';
import { FILLING_BID_WIZARD, MODERATORS, ROOMS_LIST } from '../app.constatnts';
import { WizardContext } from 'telegraf/scenes';
import { message } from 'telegraf/filters';
import {
  acceptKeyboard,
  belowsKeyboard,
  corpusKeyboard,
  floorsKeyboard,
  hideKeyboard,
  roomsKeyboard,
  skipKeyboard,
} from './bid.keyboard';
import { BidService } from './bid.service';
import { BidEntity } from './bid.entity';
import { ConfigService } from '@nestjs/config';

@Wizard(FILLING_BID_WIZARD)
export class BidWizard {
  constructor(
    private readonly bidService: BidService,
    private readonly configService: ConfigService,
  ) {}

  @WizardStep(1)
  async enterCorpus(@Ctx() ctx: WizardContext) {
    ctx.wizard.next();
    await ctx.reply('Пожалуйста, укажите корпус:', {
      reply_markup: corpusKeyboard().reply_markup,
    });
  }

  @On('message')
  @WizardStep(2)
  async enterFloor(@Ctx() ctx: WizardContext) {
    if (!ctx.has(message('text'))) {
      return;
    }

    if (ctx.message.text.startsWith('/')) {
      await this.processCommands(ctx, ctx.message.text);

      return;
    }

    if (Object.keys(ROOMS_LIST).indexOf(ctx.message.text) === -1) {
      await ctx.reply('Корпус не найден. Пожалуйста, повторите попытку:');

      return;
    }

    (ctx.wizard.state as any).data.corpus = ctx.message.text;

    ctx.wizard.next();
    await ctx.reply(
      'Пожалуйста, укажите этаж, на котором вы обнаружили проблему:',
      {
        reply_markup: floorsKeyboard(ctx.message.text).reply_markup,
      },
    );
  }

  @Hears(/\d этаж/gi)
  @Start()
  @WizardStep(3)
  async enterBelong(@Ctx() ctx: WizardContext) {
    if (!ctx.has(message('text'))) {
      return;
    }

    if (ctx.message.text.startsWith('/')) {
      await this.processCommands(ctx, ctx.message.text);

      return;
    }

    if (
      Object.keys(ROOMS_LIST[(ctx.wizard.state as any).data.corpus]).indexOf(
        ctx.message.text,
      ) === -1
    ) {
      await ctx.reply('Этаж не найден. Пожалуйста, повторите попытку:');

      return;
    }

    (ctx.wizard.state as any).data.floor = ctx.message.text;

    ctx.wizard.next();
    await ctx.reply('Пожалуйста, выберите тип помещения:', {
      reply_markup: belowsKeyboard(
        (ctx.wizard.state as any).data.corpus,
        ctx.message.text,
      ).reply_markup,
    });
  }

  @On('message')
  @WizardStep(4)
  async enterPlace(@Ctx() ctx: WizardContext) {
    if (!ctx.has(message('text'))) {
      return;
    }

    if (ctx.message.text.startsWith('/')) {
      await this.processCommands(ctx, ctx.message.text);

      return;
    }

    if (
      Object.keys(
        ROOMS_LIST[(ctx.wizard.state as any).data.corpus][
          (ctx.wizard.state as any).data.floor
        ],
      ).indexOf(ctx.message.text) === -1
    ) {
      await ctx.reply(
        'Тип помещения не найден. Пожалуйста, повторите попытку:',
      );

      return;
    }

    (ctx.wizard.state as any).data.belong = ctx.message.text;

    ctx.wizard.next();
    await ctx.reply(
      'Укажите номер помещения или локацию, где вы обнаружили проблему:',
      {
        reply_markup: roomsKeyboard(
          (ctx.wizard.state as any).data.corpus,
          (ctx.wizard.state as any).data.floor,
          ctx.message.text,
        ).reply_markup,
      },
    );
  }

  @On('message')
  @WizardStep(5)
  async enterProblem(@Ctx() ctx: WizardContext) {
    if (!ctx.has(message('text'))) {
      return;
    }

    if (ctx.message.text.startsWith('/')) {
      await this.processCommands(ctx, ctx.message.text);

      return;
    }

    if (
      Object.values(
        ROOMS_LIST[(ctx.wizard.state as any).data.corpus][
          (ctx.wizard.state as any).data.floor
        ],
      )
        .flat()
        .indexOf(ctx.message.text) === -1
    ) {
      await ctx.reply(
        'Номер помещения не найден. Пожалуйста, повторите попытку:',
      );

      return;
    }

    const existingBid = await this.bidService.getBid({
      created: 'last hour',
      room: ctx.message.text,
      corpus: (ctx.wizard.state as any).data.corpus,
    });

    if (existingBid.length) {
      await ctx.scene.leave();
      await ctx.reply(
        'Спасибо за обращение! Заявка уже находится в работе. Мы делаем всё возможное, чтобы решить проблему в кратчайшие сроки.',
        {
          reply_markup: hideKeyboard.reply_markup,
        },
      );
      return;
    }

    (ctx.wizard.state as any).data.place = ctx.message.text;

    ctx.wizard.next();
    await ctx.reply(
      'Пожалуйста, опишите проблему как можно подробнее. Это поможет нам оперативно её устранить',
      {
        reply_markup: hideKeyboard.reply_markup,
      },
    );
  }

  @On('message')
  @WizardStep(6)
  async enterMedia(@Ctx() ctx: WizardContext) {
    if (!ctx.has(message('text'))) {
      return;
    }

    if (ctx.message.text.startsWith('/')) {
      await this.processCommands(ctx, ctx.message.text);

      return;
    }

    (ctx.wizard.state as any).data.problem = ctx.message.text;

    ctx.wizard.next();
    await ctx.reply(
      'Если у вас есть возможность, прикрепите фотографию проблемы. Это поможет нам быстрее разобраться в ситуации:',
      {
        reply_markup: skipKeyboard.reply_markup,
      },
    );
  }

  @Hears(/пропустить/i)
  @On('photo')
  @Start()
  @WizardStep(7)
  async summary(@Ctx() ctx: WizardContext) {
    if (ctx.has(message('text')) && ctx.message.text.startsWith('/')) {
      await this.processCommands(ctx, ctx.message.text);

      return;
    }

    const { data } = ctx.wizard.state as any;
    const bidText = `Этаж: ${data.floor}\nТип помещения: ${data.belong}\nНомер помещения: ${data.corpus} | ${data.place}\nПроблема: ${data.problem}`;

    if (ctx.has(message('photo'))) {
      const [photo] = ctx.message.photo.toSorted(
        (a, b) => b.file_size - a.file_size,
      );

      (ctx.wizard.state as any).data.photo = photo;

      await ctx.telegram.sendPhoto(ctx.message.chat.id, photo.file_id, {
        caption: bidText,
        reply_markup: acceptKeyboard.reply_markup,
      });
    } else {
      await ctx.telegram.sendMessage(ctx.message.chat.id, bidText, {
        reply_markup: acceptKeyboard.reply_markup,
      });
    }
    ctx.wizard.next();
  }

  @Hears(/отправить/i)
  @WizardStep(8)
  async sendBid(@Ctx() ctx: WizardContext) {
    const { data } = ctx.wizard.state as any;
    const bidText = `Новая заявка\n\nЭтаж: ${data.floor}\nТип помещения: ${data.belong}\nНомер помещения: ${data.corpus} | ${data.place}\nПроблема: ${data.problem}`;

    const payload: Omit<BidEntity, 'id' | 'createdAt'> = {
      problem: data.problem,
      room: data.place,
      corpus: data.corpus,
    };

    if (data.photo?.file_id) {
      payload.file_url = (
        await ctx.telegram.getFileLink(data.photo.file_id)
      ).toString();
    }

    await this.bidService.saveBid(payload);

    if (data.photo) {
      await ctx.telegram.sendPhoto(
        this.configService.get(MODERATORS[data.corpus]),
        data.photo.file_id,
        {
          caption: bidText,
        },
      );
    } else {
      await ctx.telegram.sendMessage(
        this.configService.get(MODERATORS[data.corpus]),
        bidText,
      );
    }

    await ctx.scene.leave();
    await ctx.reply(
      'Спасибо за предоставленную информацию! Мы уже приступили к выполнению вашей заявки.',
      {
        reply_markup: hideKeyboard.reply_markup,
      },
    );
  }

  @Hears(/отмена/i)
  @Hears(/завершить/i)
  async stop(@Ctx() ctx: WizardContext) {
    await ctx.scene.leave();
    await ctx.reply('Создание заявки отменено', {
      reply_markup: hideKeyboard.reply_markup,
    });
  }

  processCommands(ctx: WizardContext, command: string) {
    if (command.startsWith('/')) {
      if (command === '/start') {
        return ctx.scene.reenter();
      }
    }
  }
}
