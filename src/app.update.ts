import { Ctx, Start, Update } from 'nestjs-telegraf';
import { SceneContext } from 'telegraf/scenes';
import { FILLING_BID_WIZARD } from './app.constatnts';

@Update()
export class AppUpdate {
  @Start()
  async createNewBid(@Ctx() ctx: SceneContext) {
    if (!!ctx.scene.state && Object.keys(ctx.scene.state).length) {
      return;
    }

    await ctx.reply(
      'Здравствуйте! 👋\n' +
        'Если вы обнаружили какую-либо проблему (например, неисправность или неудобство), пожалуйста, отправьте заявку в чат-бот. Это поможет нам оперативно ее устранить.\n\n' +
        'Чтобы отправить заявку, просто следуйте подсказкам и используйте клавиатуру бота',
    );
    await ctx.scene.enter(FILLING_BID_WIZARD, { data: {} });
  }
}
