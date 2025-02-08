import { Ctx, Hears, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { FILLING_BID_WIZARD } from '../app.constatnts';
import { WizardContext } from 'telegraf/scenes';
import { message } from 'telegraf/filters';
import {
  acceptKeyboard,
  belowsKeyboard,
  cancelKeyboard,
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
  async enterFloor(@Ctx() ctx: WizardContext) {
    ctx.wizard.next();
    await ctx.reply('Выберите этаж', {
      reply_markup: floorsKeyboard().reply_markup,
    });
  }

  @Hears(/\d этаж/gi)
  @WizardStep(2)
  async enterBelong(@Ctx() ctx: WizardContext) {
    if (ctx.has(message('text'))) {
      (ctx.wizard.state as any).data.floor = ctx.message.text;

      ctx.wizard.next();
      await ctx.reply('Выберите принадлежность', {
        reply_markup: belowsKeyboard(ctx.message.text).reply_markup,
      });
    }
  }

  @On('message')
  @WizardStep(3)
  async enterPlace(@Ctx() ctx: WizardContext) {
    if (ctx.has(message('text'))) {
      (ctx.wizard.state as any).data.belong = ctx.message.text;

      ctx.wizard.next();
      await ctx.reply('Выберите кабинет', {
        reply_markup: roomsKeyboard(
          (ctx.wizard.state as any).data.floor,
          ctx.message.text,
        ).reply_markup,
      });
    }
  }

  @On('message')
  @WizardStep(4)
  async enterProblem(@Ctx() ctx: WizardContext) {
    if (ctx.has(message('text'))) {
      const existingBid = await this.bidService.getBid({
        created: 'last hour',
        room: ctx.message.text,
      });

      if (existingBid.length) {
        await ctx.scene.leave();
        await ctx.reply(
          'По указанному кабинету заявка уже создана. Создание заявки отменено',
          {
            reply_markup: cancelKeyboard.reply_markup,
          },
        );
        return;
      }

      (ctx.wizard.state as any).data.place = ctx.message.text;

      ctx.wizard.next();
      await ctx.reply('Опишите проблему', {
        reply_markup: cancelKeyboard.reply_markup,
      });
    }
  }

  @On('message')
  @WizardStep(5)
  async enterMedia(@Ctx() ctx: WizardContext) {
    if (ctx.has(message('text'))) {
      (ctx.wizard.state as any).data.problem = ctx.message.text;
    }

    ctx.wizard.next();
    await ctx.reply('Прикрепите фото', {
      reply_markup: skipKeyboard.reply_markup,
    });
  }

  @Hears(/пропустить/i)
  @On('photo')
  @WizardStep(6)
  async summary(@Ctx() ctx: WizardContext) {
    const { data } = ctx.wizard.state as any;
    const bidText = `Этаж: ${data.floor}\nКабинет: ${data.place}\nПринадлежность: ${data.belong}\nПроблема: ${data.problem}`;

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
  @WizardStep(7)
  async sendBid(@Ctx() ctx: WizardContext) {
    const { data } = ctx.wizard.state as any;
    const bidText = `Новая заявка\n\nЭтаж: ${data.floor}\nКабинет: ${data.place}\nПринадлежность: ${data.belong}\nПроблема: ${data.problem}`;

    const payload: Omit<BidEntity, 'id' | 'createdAt'> = {
      problem: data.problem,
      room: data.place,
    };

    if (data.photo?.file_id) {
      payload.file_url = (
        await ctx.telegram.getFileLink(data.photo.file_id)
      ).toString();
    }

    await this.bidService.saveBid(payload);

    if (data.photo) {
      await ctx.telegram.sendPhoto(
        this.configService.get('MODERATORS_CHAT_ID'),
        data.photo.file_id,
        {
          caption: bidText,
        },
      );
    } else {
      await ctx.telegram.sendMessage(
        this.configService.get('MODERATORS_CHAT_ID'),
        bidText,
      );
    }

    await ctx.scene.leave();
    await ctx.reply('Заявка создана!', {
      reply_markup: hideKeyboard.reply_markup,
    });
  }

  @Hears(/отмена/i)
  @Hears(/завершить/i)
  async stop(@Ctx() ctx: WizardContext) {
    await ctx.scene.leave();
    await ctx.reply('Создание заявки отменено', {
      reply_markup: hideKeyboard.reply_markup,
    });
  }
}
