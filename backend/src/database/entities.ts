import { AdminAction } from '../admin/entities/admin-action.entity.js';
import { BlockedDay } from '../agenda/entities/blocked-day.entity.js';
import { LoginAttempt } from '../auth/entities/login-attempt.entity.js';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { Equipment } from '../equipment/entities/equipment.entity.js';
import { Favorite } from '../favorites/entities/favorite.entity.js';
import { Message } from '../messages/entities/message.entity.js';
import { Notification } from '../notifications/entities/notification.entity.js';
import { Property } from '../properties/entities/property.entity.js';
import { ProviderProfile } from '../providers/entities/provider-profile.entity.js';
import { Report } from '../reports/entities/report.entity.js';
import { RequestEvent } from '../requests/entities/request-event.entity.js';
import { ServiceRequest } from '../requests/entities/service-request.entity.js';
import { Review } from '../reviews/entities/review.entity.js';
import { Service } from '../services/entities/service.entity.js';
import { Upload } from '../uploads/entities/upload.entity.js';
import { User } from '../users/entities/user.entity.js';

export const ENTITIES = [
  User, ProviderProfile, PasswordResetToken, LoginAttempt, Category, Equipment, Service,
  Property, ServiceRequest, RequestEvent, Review, Message, Notification, Report, Upload,
  AdminAction, Favorite, BlockedDay,
];
