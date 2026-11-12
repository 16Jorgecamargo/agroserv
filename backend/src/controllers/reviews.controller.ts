import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CurrentUser, Public, Roles } from '../decorators/auth.decorators.js';
import type { User } from '../entities/user.entity.js';
import { CreateReviewDto, ReplyReviewDto, UpdateReviewDto } from '../dto/review.dto.js';
import type { ReviewView } from '../presenters/review.presenter.js';
import { ReviewPage, ReviewsService } from '../services/reviews.service.js';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Roles('producer')
  @Post('requests/:id/review')
  create(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewView> {
    // Avalia uma solicitação concluída
    return this.reviews.create(user, id, dto);
  }

  @Roles('producer')
  @Patch('reviews/:id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<ReviewView> {
    // Edita a própria avaliação dentro do prazo
    return this.reviews.update(user, id, dto);
  }

  @Public()
  @Get('services/:id/reviews')
  listForService(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
    @CurrentUser() user?: User,
  ): Promise<ReviewPage> {
    // Avaliações públicas de um serviço
    return this.reviews.listForService(id, query, user);
  }

  @Roles('provider')
  @Get('provider/reviews')
  listForProvider(@CurrentUser() user: User, @Query() query: Record<string, unknown>): Promise<ReviewPage> {
    // Avaliações recebidas pelo prestador
    return this.reviews.listForProvider(user.id, query);
  }

  @Roles('provider')
  @Put('provider/reviews/:id/reply')
  reply(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
  ): Promise<ReviewView> {
    // Responde ou edita a resposta de uma avaliação
    return this.reviews.reply(user, id, dto);
  }
}
