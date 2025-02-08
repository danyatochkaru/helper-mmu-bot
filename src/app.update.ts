import { Ctx, Start, Update } from 'nestjs-telegraf';
import { SceneContext } from 'telegraf/scenes';
import { FILLING_BID_WIZARD } from './app.constatnts';

@Update()
export class AppUpdate {
  @Start()
  async createNewBid(@Ctx() ctx: SceneContext) {
    await ctx.reply(
      'Создание новой заявки\n\n* Для заполнения заявки используйте клавиатуру бота',
    );
    await ctx.scene.enter(FILLING_BID_WIZARD, { data: {} });
  }
}
