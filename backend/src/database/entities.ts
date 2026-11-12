import { AdminAction } from '../entities/admin-action.entity.js';
import { BlockedDay } from '../entities/blocked-day.entity.js';
import { LoginAttempt } from '../entities/login-attempt.entity.js';
import { PasswordResetToken } from '../entities/password-reset-token.entity.js';
import { Category } from '../entities/category.entity.js';
import { Equipment } from '../entities/equipment.entity.js';
import { Favorite } from '../entities/favorite.entity.js';
import { Message } from '../entities/message.entity.js';
import { Notification } from '../entities/notification.entity.js';
import { Property } from '../entities/property.entity.js';
import { ProviderProfile } from '../entities/provider-profile.entity.js';
import { Report } from '../entities/report.entity.js';
import { RequestEvent } from '../entities/request-event.entity.js';
import { ServiceRequest } from '../entities/service-request.entity.js';
import { Review } from '../entities/review.entity.js';
import { Service } from '../entities/service.entity.js';
import { Upload } from '../entities/upload.entity.js';
import { User } from '../entities/user.entity.js';

export const ENTITIES = [
  User, ProviderProfile, PasswordResetToken, LoginAttempt, Category, Equipment, Service,
  Property, ServiceRequest, RequestEvent, Review, Message, Notification, Report, Upload,
  AdminAction, Favorite, BlockedDay,
];
