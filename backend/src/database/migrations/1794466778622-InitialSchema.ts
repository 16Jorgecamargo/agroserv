import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1794466778622 implements MigrationInterface {
  name = 'InitialSchema1794466778622';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schemaCreatedBySynchronize = await queryRunner.hasTable('users');
    if (schemaCreatedBySynchronize) return;
    await queryRunner.query(
      `CREATE TABLE "provider_profiles" ("userId" varchar PRIMARY KEY NOT NULL, "document" text NOT NULL DEFAULT (''), "serviceRadiusKm" integer NOT NULL DEFAULT (50), "yearsOfExperience" integer NOT NULL DEFAULT (0), "description" text NOT NULL DEFAULT (''), "verificationStatus" text NOT NULL DEFAULT ('not_sent'), "verificationRejectionReason" text, "identityUploadId" text, "addressUploadId" text, "verificationSubmittedAt" text, "verificationReviewedAt" text, "rating" real NOT NULL DEFAULT (0), "reviewCount" integer NOT NULL DEFAULT (0))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" text NOT NULL, "email" text NOT NULL, "passwordHash" text NOT NULL, "role" text NOT NULL, "phone" text, "avatarUrl" text, "city" text NOT NULL, "state" text NOT NULL, "status" text NOT NULL DEFAULT ('active'), "mustChangePassword" boolean NOT NULL DEFAULT (0), "termsAcceptedAt" text, "searchText" text NOT NULL DEFAULT (''), "createdAt" text NOT NULL, "deletedAt" text)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "admin_actions" ("id" varchar PRIMARY KEY NOT NULL, "adminId" varchar NOT NULL, "adminName" text NOT NULL, "action" text NOT NULL, "targetType" text NOT NULL, "targetId" text NOT NULL, "targetLabel" text NOT NULL, "reason" text, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b807cf9b03e729b3d076a6514d" ON "admin_actions" ("targetId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b8d6bfd21855eb21c4779903ad" ON "admin_actions" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "blocked_days" ("id" varchar PRIMARY KEY NOT NULL, "providerId" varchar NOT NULL, "date" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4851231c0376fb4eb1993da259" ON "blocked_days" ("providerId", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "login_attempts" ("id" varchar PRIMARY KEY NOT NULL, "email" text NOT NULL, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0aedff58b23995504f9dc99f75" ON "login_attempts" ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "tokenHash" text NOT NULL, "expiresAt" text NOT NULL, "usedAt" text, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1143abb8c3fad8b06dd857a8c9" ON "password_reset_tokens" ("tokenHash") `,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" varchar PRIMARY KEY NOT NULL, "slug" text NOT NULL, "name" text NOT NULL, "icon" text NOT NULL, "active" boolean NOT NULL DEFAULT (1), "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_420d9f679d41281f282f5bc7d0" ON "categories" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "equipment" ("id" varchar PRIMARY KEY NOT NULL, "providerId" varchar NOT NULL, "type" text NOT NULL, "model" text NOT NULL, "year" integer NOT NULL, "specs" text NOT NULL DEFAULT (''), "photos" text NOT NULL, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "services" ("id" varchar PRIMARY KEY NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "categoryId" varchar NOT NULL, "providerId" varchar NOT NULL, "city" text NOT NULL, "state" text NOT NULL, "price" real NOT NULL, "priceUnit" text NOT NULL, "rating" real NOT NULL DEFAULT (0), "reviewCount" integer NOT NULL DEFAULT (0), "available" boolean NOT NULL DEFAULT (1), "photos" text NOT NULL, "status" text NOT NULL DEFAULT ('active'), "hiddenReason" text, "statusBeforeHidden" text, "hiddenByAccountDeletion" boolean NOT NULL DEFAULT (0), "searchText" text NOT NULL DEFAULT (''), "locationText" text NOT NULL DEFAULT (''), "createdAt" text NOT NULL, "deletedAt" text)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b619ef0a4fe392dbde07eee1e" ON "services" ("providerId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "favorites" ("id" varchar PRIMARY KEY NOT NULL, "producerId" varchar NOT NULL, "serviceId" varchar NOT NULL, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_075c49754f475d9679ebb17e88" ON "favorites" ("producerId", "serviceId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "properties" ("id" varchar PRIMARY KEY NOT NULL, "producerId" varchar NOT NULL, "name" text NOT NULL, "city" text NOT NULL, "state" text NOT NULL, "accessNotes" text NOT NULL DEFAULT (''), "areaHectares" real NOT NULL, "crops" text NOT NULL, "createdAt" text NOT NULL, "deletedAt" text)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4298b685cb59b963ca3095f924" ON "properties" ("producerId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "request_events" ("id" varchar PRIMARY KEY NOT NULL, "requestId" varchar NOT NULL, "type" text NOT NULL, "actorId" text, "actorRole" text NOT NULL, "actorName" text NOT NULL, "note" text, "previousDate" text, "previousValue" real, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_16a67349ed347072437edf53d8" ON "request_events" ("requestId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "service_requests" ("id" varchar PRIMARY KEY NOT NULL, "serviceId" varchar NOT NULL, "serviceTitle" text NOT NULL, "providerId" varchar NOT NULL, "providerName" text NOT NULL, "producerId" varchar NOT NULL, "producerName" text NOT NULL, "propertyId" varchar NOT NULL, "location" text NOT NULL, "scheduledDate" text NOT NULL, "quantity" real NOT NULL, "priceUnit" text NOT NULL, "value" real NOT NULL, "notes" text, "status" text NOT NULL DEFAULT ('pending'), "counterDate" text, "counterValue" real, "counterMessage" text, "counterCreatedAt" text, "rejectReason" text, "cancelReason" text, "cancelledBy" text, "reviewId" text, "createdAt" text NOT NULL, "updatedAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07f8d78c034a3b01c8fe0921df" ON "service_requests" ("serviceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a2d28e31586e1b92ee9189e96" ON "service_requests" ("providerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18278a59472a31a2177c95076b" ON "service_requests" ("producerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80d4e9cce72ad92b06085b69b5" ON "service_requests" ("status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" varchar PRIMARY KEY NOT NULL, "requestId" varchar NOT NULL, "senderId" varchar NOT NULL, "senderName" text NOT NULL, "senderRole" text NOT NULL, "text" text NOT NULL, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a9a8327f718c21f827d6b12f4" ON "messages" ("requestId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "type" text NOT NULL, "title" text NOT NULL, "body" text, "link" text NOT NULL, "read" boolean NOT NULL DEFAULT (0), "groupKey" text, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "reports" ("id" varchar PRIMARY KEY NOT NULL, "reporterId" varchar NOT NULL, "reporterName" text NOT NULL, "reporterRole" text NOT NULL, "targetType" text NOT NULL, "targetId" text NOT NULL, "targetLabel" text NOT NULL, "reason" text NOT NULL, "description" text NOT NULL, "status" text NOT NULL DEFAULT ('open'), "resolution" text, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd7faa31851a2153125fd1af73" ON "reports" ("targetId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dab4d78b3be05c1ca4a626f57f" ON "reports" ("status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" varchar PRIMARY KEY NOT NULL, "requestId" varchar NOT NULL, "serviceId" varchar NOT NULL, "serviceTitle" text NOT NULL, "providerId" varchar NOT NULL, "producerId" varchar NOT NULL, "producerName" text NOT NULL, "rating" integer NOT NULL, "comment" text, "replyText" text, "replyCreatedAt" text, "replyUpdatedAt" text, "hidden" boolean NOT NULL DEFAULT (0), "editableUntil" text NOT NULL, "createdAt" text NOT NULL, "updatedAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5159b6693f161a26dbe3585dc4" ON "reviews" ("requestId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9563540c43639a0669f68e8ebe" ON "reviews" ("serviceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c29faa8169d9741d3a1d51483" ON "reviews" ("providerId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "uploads" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "url" text NOT NULL, "name" text NOT NULL, "contentType" text NOT NULL, "size" integer NOT NULL, "purpose" text NOT NULL DEFAULT ('public'), "fileName" text NOT NULL, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_218027b00e9cc2f9193e74621c" ON "uploads" ("url") `,
    );
    await queryRunner.query(
      `CREATE TABLE "service_equipment" ("servicesId" varchar NOT NULL, "equipmentId" varchar NOT NULL, PRIMARY KEY ("servicesId", "equipmentId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_06cbd177c7bdad20577eda10f4" ON "service_equipment" ("servicesId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5893e7c4b7f9a7b24d1d3227e8" ON "service_equipment" ("equipmentId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_provider_profiles" ("userId" varchar PRIMARY KEY NOT NULL, "document" text NOT NULL DEFAULT (''), "serviceRadiusKm" integer NOT NULL DEFAULT (50), "yearsOfExperience" integer NOT NULL DEFAULT (0), "description" text NOT NULL DEFAULT (''), "verificationStatus" text NOT NULL DEFAULT ('not_sent'), "verificationRejectionReason" text, "identityUploadId" text, "addressUploadId" text, "verificationSubmittedAt" text, "verificationReviewedAt" text, "rating" real NOT NULL DEFAULT (0), "reviewCount" integer NOT NULL DEFAULT (0), CONSTRAINT "FK_96071d5ba65f9c64f0f2dfdfaf3" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_provider_profiles"("userId", "document", "serviceRadiusKm", "yearsOfExperience", "description", "verificationStatus", "verificationRejectionReason", "identityUploadId", "addressUploadId", "verificationSubmittedAt", "verificationReviewedAt", "rating", "reviewCount") SELECT "userId", "document", "serviceRadiusKm", "yearsOfExperience", "description", "verificationStatus", "verificationRejectionReason", "identityUploadId", "addressUploadId", "verificationSubmittedAt", "verificationReviewedAt", "rating", "reviewCount" FROM "provider_profiles"`,
    );
    await queryRunner.query(`DROP TABLE "provider_profiles"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_provider_profiles" RENAME TO "provider_profiles"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_b807cf9b03e729b3d076a6514d"`);
    await queryRunner.query(`DROP INDEX "IDX_b8d6bfd21855eb21c4779903ad"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_admin_actions" ("id" varchar PRIMARY KEY NOT NULL, "adminId" varchar NOT NULL, "adminName" text NOT NULL, "action" text NOT NULL, "targetType" text NOT NULL, "targetId" text NOT NULL, "targetLabel" text NOT NULL, "reason" text, "createdAt" text NOT NULL, CONSTRAINT "FK_cf57d3f4a67dde3771b17f8c7e8" FOREIGN KEY ("adminId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_admin_actions"("id", "adminId", "adminName", "action", "targetType", "targetId", "targetLabel", "reason", "createdAt") SELECT "id", "adminId", "adminName", "action", "targetType", "targetId", "targetLabel", "reason", "createdAt" FROM "admin_actions"`,
    );
    await queryRunner.query(`DROP TABLE "admin_actions"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_admin_actions" RENAME TO "admin_actions"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b807cf9b03e729b3d076a6514d" ON "admin_actions" ("targetId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b8d6bfd21855eb21c4779903ad" ON "admin_actions" ("createdAt") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_4851231c0376fb4eb1993da259"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_blocked_days" ("id" varchar PRIMARY KEY NOT NULL, "providerId" varchar NOT NULL, "date" text NOT NULL, CONSTRAINT "FK_3089634b93f51b65aa6ad108d28" FOREIGN KEY ("providerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_blocked_days"("id", "providerId", "date") SELECT "id", "providerId", "date" FROM "blocked_days"`,
    );
    await queryRunner.query(`DROP TABLE "blocked_days"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_blocked_days" RENAME TO "blocked_days"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4851231c0376fb4eb1993da259" ON "blocked_days" ("providerId", "date") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_1143abb8c3fad8b06dd857a8c9"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_password_reset_tokens" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "tokenHash" text NOT NULL, "expiresAt" text NOT NULL, "usedAt" text, "createdAt" text NOT NULL, CONSTRAINT "FK_d6a19d4b4f6c62dcd29daa497e2" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_password_reset_tokens"("id", "userId", "tokenHash", "expiresAt", "usedAt", "createdAt") SELECT "id", "userId", "tokenHash", "expiresAt", "usedAt", "createdAt" FROM "password_reset_tokens"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_password_reset_tokens" RENAME TO "password_reset_tokens"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1143abb8c3fad8b06dd857a8c9" ON "password_reset_tokens" ("tokenHash") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_equipment" ("id" varchar PRIMARY KEY NOT NULL, "providerId" varchar NOT NULL, "type" text NOT NULL, "model" text NOT NULL, "year" integer NOT NULL, "specs" text NOT NULL DEFAULT (''), "photos" text NOT NULL, "createdAt" text NOT NULL, CONSTRAINT "FK_41c7e77583a16620c90b636410f" FOREIGN KEY ("providerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_equipment"("id", "providerId", "type", "model", "year", "specs", "photos", "createdAt") SELECT "id", "providerId", "type", "model", "year", "specs", "photos", "createdAt" FROM "equipment"`,
    );
    await queryRunner.query(`DROP TABLE "equipment"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_equipment" RENAME TO "equipment"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_8b619ef0a4fe392dbde07eee1e"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_services" ("id" varchar PRIMARY KEY NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "categoryId" varchar NOT NULL, "providerId" varchar NOT NULL, "city" text NOT NULL, "state" text NOT NULL, "price" real NOT NULL, "priceUnit" text NOT NULL, "rating" real NOT NULL DEFAULT (0), "reviewCount" integer NOT NULL DEFAULT (0), "available" boolean NOT NULL DEFAULT (1), "photos" text NOT NULL, "status" text NOT NULL DEFAULT ('active'), "hiddenReason" text, "statusBeforeHidden" text, "hiddenByAccountDeletion" boolean NOT NULL DEFAULT (0), "searchText" text NOT NULL DEFAULT (''), "locationText" text NOT NULL DEFAULT (''), "createdAt" text NOT NULL, "deletedAt" text, CONSTRAINT "FK_034b52310c2d211bc979c3cc4e8" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_8b619ef0a4fe392dbde07eee1e2" FOREIGN KEY ("providerId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_services"("id", "title", "description", "categoryId", "providerId", "city", "state", "price", "priceUnit", "rating", "reviewCount", "available", "photos", "status", "hiddenReason", "statusBeforeHidden", "hiddenByAccountDeletion", "searchText", "locationText", "createdAt", "deletedAt") SELECT "id", "title", "description", "categoryId", "providerId", "city", "state", "price", "priceUnit", "rating", "reviewCount", "available", "photos", "status", "hiddenReason", "statusBeforeHidden", "hiddenByAccountDeletion", "searchText", "locationText", "createdAt", "deletedAt" FROM "services"`,
    );
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_services" RENAME TO "services"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b619ef0a4fe392dbde07eee1e" ON "services" ("providerId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_075c49754f475d9679ebb17e88"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_favorites" ("id" varchar PRIMARY KEY NOT NULL, "producerId" varchar NOT NULL, "serviceId" varchar NOT NULL, "createdAt" text NOT NULL, CONSTRAINT "FK_989582bc6efeeb6c1a0c9d99f40" FOREIGN KEY ("producerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_307c40c36b91a85aea3f22c20d6" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_favorites"("id", "producerId", "serviceId", "createdAt") SELECT "id", "producerId", "serviceId", "createdAt" FROM "favorites"`,
    );
    await queryRunner.query(`DROP TABLE "favorites"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_favorites" RENAME TO "favorites"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_075c49754f475d9679ebb17e88" ON "favorites" ("producerId", "serviceId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_4298b685cb59b963ca3095f924"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_properties" ("id" varchar PRIMARY KEY NOT NULL, "producerId" varchar NOT NULL, "name" text NOT NULL, "city" text NOT NULL, "state" text NOT NULL, "accessNotes" text NOT NULL DEFAULT (''), "areaHectares" real NOT NULL, "crops" text NOT NULL, "createdAt" text NOT NULL, "deletedAt" text, CONSTRAINT "FK_4298b685cb59b963ca3095f924b" FOREIGN KEY ("producerId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_properties"("id", "producerId", "name", "city", "state", "accessNotes", "areaHectares", "crops", "createdAt", "deletedAt") SELECT "id", "producerId", "name", "city", "state", "accessNotes", "areaHectares", "crops", "createdAt", "deletedAt" FROM "properties"`,
    );
    await queryRunner.query(`DROP TABLE "properties"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_properties" RENAME TO "properties"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4298b685cb59b963ca3095f924" ON "properties" ("producerId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_16a67349ed347072437edf53d8"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_request_events" ("id" varchar PRIMARY KEY NOT NULL, "requestId" varchar NOT NULL, "type" text NOT NULL, "actorId" text, "actorRole" text NOT NULL, "actorName" text NOT NULL, "note" text, "previousDate" text, "previousValue" real, "createdAt" text NOT NULL, CONSTRAINT "FK_16a67349ed347072437edf53d86" FOREIGN KEY ("requestId") REFERENCES "service_requests" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_request_events"("id", "requestId", "type", "actorId", "actorRole", "actorName", "note", "previousDate", "previousValue", "createdAt") SELECT "id", "requestId", "type", "actorId", "actorRole", "actorName", "note", "previousDate", "previousValue", "createdAt" FROM "request_events"`,
    );
    await queryRunner.query(`DROP TABLE "request_events"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_request_events" RENAME TO "request_events"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_16a67349ed347072437edf53d8" ON "request_events" ("requestId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_07f8d78c034a3b01c8fe0921df"`);
    await queryRunner.query(`DROP INDEX "IDX_7a2d28e31586e1b92ee9189e96"`);
    await queryRunner.query(`DROP INDEX "IDX_18278a59472a31a2177c95076b"`);
    await queryRunner.query(`DROP INDEX "IDX_80d4e9cce72ad92b06085b69b5"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_service_requests" ("id" varchar PRIMARY KEY NOT NULL, "serviceId" varchar NOT NULL, "serviceTitle" text NOT NULL, "providerId" varchar NOT NULL, "providerName" text NOT NULL, "producerId" varchar NOT NULL, "producerName" text NOT NULL, "propertyId" varchar NOT NULL, "location" text NOT NULL, "scheduledDate" text NOT NULL, "quantity" real NOT NULL, "priceUnit" text NOT NULL, "value" real NOT NULL, "notes" text, "status" text NOT NULL DEFAULT ('pending'), "counterDate" text, "counterValue" real, "counterMessage" text, "counterCreatedAt" text, "rejectReason" text, "cancelReason" text, "cancelledBy" text, "reviewId" text, "createdAt" text NOT NULL, "updatedAt" text NOT NULL, CONSTRAINT "FK_07f8d78c034a3b01c8fe0921df3" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_7a2d28e31586e1b92ee9189e961" FOREIGN KEY ("providerId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_18278a59472a31a2177c95076b8" FOREIGN KEY ("producerId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_ca73b8f6c9241478353472df5bb" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_service_requests"("id", "serviceId", "serviceTitle", "providerId", "providerName", "producerId", "producerName", "propertyId", "location", "scheduledDate", "quantity", "priceUnit", "value", "notes", "status", "counterDate", "counterValue", "counterMessage", "counterCreatedAt", "rejectReason", "cancelReason", "cancelledBy", "reviewId", "createdAt", "updatedAt") SELECT "id", "serviceId", "serviceTitle", "providerId", "providerName", "producerId", "producerName", "propertyId", "location", "scheduledDate", "quantity", "priceUnit", "value", "notes", "status", "counterDate", "counterValue", "counterMessage", "counterCreatedAt", "rejectReason", "cancelReason", "cancelledBy", "reviewId", "createdAt", "updatedAt" FROM "service_requests"`,
    );
    await queryRunner.query(`DROP TABLE "service_requests"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_service_requests" RENAME TO "service_requests"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07f8d78c034a3b01c8fe0921df" ON "service_requests" ("serviceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a2d28e31586e1b92ee9189e96" ON "service_requests" ("providerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18278a59472a31a2177c95076b" ON "service_requests" ("producerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80d4e9cce72ad92b06085b69b5" ON "service_requests" ("status") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_1a9a8327f718c21f827d6b12f4"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_messages" ("id" varchar PRIMARY KEY NOT NULL, "requestId" varchar NOT NULL, "senderId" varchar NOT NULL, "senderName" text NOT NULL, "senderRole" text NOT NULL, "text" text NOT NULL, "createdAt" text NOT NULL, CONSTRAINT "FK_1a9a8327f718c21f827d6b12f42" FOREIGN KEY ("requestId") REFERENCES "service_requests" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_messages"("id", "requestId", "senderId", "senderName", "senderRole", "text", "createdAt") SELECT "id", "requestId", "senderId", "senderName", "senderRole", "text", "createdAt" FROM "messages"`,
    );
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_messages" RENAME TO "messages"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a9a8327f718c21f827d6b12f4" ON "messages" ("requestId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_692a909ee0fa9383e7859f9b40"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_notifications" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "type" text NOT NULL, "title" text NOT NULL, "body" text, "link" text NOT NULL, "read" boolean NOT NULL DEFAULT (0), "groupKey" text, "createdAt" text NOT NULL, CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_notifications"("id", "userId", "type", "title", "body", "link", "read", "groupKey", "createdAt") SELECT "id", "userId", "type", "title", "body", "link", "read", "groupKey", "createdAt" FROM "notifications"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_notifications" RENAME TO "notifications"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_cd7faa31851a2153125fd1af73"`);
    await queryRunner.query(`DROP INDEX "IDX_dab4d78b3be05c1ca4a626f57f"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_reports" ("id" varchar PRIMARY KEY NOT NULL, "reporterId" varchar NOT NULL, "reporterName" text NOT NULL, "reporterRole" text NOT NULL, "targetType" text NOT NULL, "targetId" text NOT NULL, "targetLabel" text NOT NULL, "reason" text NOT NULL, "description" text NOT NULL, "status" text NOT NULL DEFAULT ('open'), "resolution" text, "createdAt" text NOT NULL, CONSTRAINT "FK_4353be8309ce86650def2f8572d" FOREIGN KEY ("reporterId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_reports"("id", "reporterId", "reporterName", "reporterRole", "targetType", "targetId", "targetLabel", "reason", "description", "status", "resolution", "createdAt") SELECT "id", "reporterId", "reporterName", "reporterRole", "targetType", "targetId", "targetLabel", "reason", "description", "status", "resolution", "createdAt" FROM "reports"`,
    );
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_reports" RENAME TO "reports"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd7faa31851a2153125fd1af73" ON "reports" ("targetId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dab4d78b3be05c1ca4a626f57f" ON "reports" ("status") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_5159b6693f161a26dbe3585dc4"`);
    await queryRunner.query(`DROP INDEX "IDX_9563540c43639a0669f68e8ebe"`);
    await queryRunner.query(`DROP INDEX "IDX_4c29faa8169d9741d3a1d51483"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_reviews" ("id" varchar PRIMARY KEY NOT NULL, "requestId" varchar NOT NULL, "serviceId" varchar NOT NULL, "serviceTitle" text NOT NULL, "providerId" varchar NOT NULL, "producerId" varchar NOT NULL, "producerName" text NOT NULL, "rating" integer NOT NULL, "comment" text, "replyText" text, "replyCreatedAt" text, "replyUpdatedAt" text, "hidden" boolean NOT NULL DEFAULT (0), "editableUntil" text NOT NULL, "createdAt" text NOT NULL, "updatedAt" text NOT NULL, CONSTRAINT "FK_5159b6693f161a26dbe3585dc4f" FOREIGN KEY ("requestId") REFERENCES "service_requests" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_9563540c43639a0669f68e8ebe3" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_4c29faa8169d9741d3a1d514830" FOREIGN KEY ("providerId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_0729fd767ec2e611bca4fb7cb57" FOREIGN KEY ("producerId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_reviews"("id", "requestId", "serviceId", "serviceTitle", "providerId", "producerId", "producerName", "rating", "comment", "replyText", "replyCreatedAt", "replyUpdatedAt", "hidden", "editableUntil", "createdAt", "updatedAt") SELECT "id", "requestId", "serviceId", "serviceTitle", "providerId", "producerId", "producerName", "rating", "comment", "replyText", "replyCreatedAt", "replyUpdatedAt", "hidden", "editableUntil", "createdAt", "updatedAt" FROM "reviews"`,
    );
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_reviews" RENAME TO "reviews"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5159b6693f161a26dbe3585dc4" ON "reviews" ("requestId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9563540c43639a0669f68e8ebe" ON "reviews" ("serviceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c29faa8169d9741d3a1d51483" ON "reviews" ("providerId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_218027b00e9cc2f9193e74621c"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_uploads" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "url" text NOT NULL, "name" text NOT NULL, "contentType" text NOT NULL, "size" integer NOT NULL, "purpose" text NOT NULL DEFAULT ('public'), "fileName" text NOT NULL, "createdAt" text NOT NULL, CONSTRAINT "FK_632458210d8f0159857b0f05707" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_uploads"("id", "userId", "url", "name", "contentType", "size", "purpose", "fileName", "createdAt") SELECT "id", "userId", "url", "name", "contentType", "size", "purpose", "fileName", "createdAt" FROM "uploads"`,
    );
    await queryRunner.query(`DROP TABLE "uploads"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_uploads" RENAME TO "uploads"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_218027b00e9cc2f9193e74621c" ON "uploads" ("url") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_06cbd177c7bdad20577eda10f4"`);
    await queryRunner.query(`DROP INDEX "IDX_5893e7c4b7f9a7b24d1d3227e8"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_service_equipment" ("servicesId" varchar NOT NULL, "equipmentId" varchar NOT NULL, CONSTRAINT "FK_06cbd177c7bdad20577eda10f44" FOREIGN KEY ("servicesId") REFERENCES "services" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_5893e7c4b7f9a7b24d1d3227e8e" FOREIGN KEY ("equipmentId") REFERENCES "equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("servicesId", "equipmentId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_service_equipment"("servicesId", "equipmentId") SELECT "servicesId", "equipmentId" FROM "service_equipment"`,
    );
    await queryRunner.query(`DROP TABLE "service_equipment"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_service_equipment" RENAME TO "service_equipment"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_06cbd177c7bdad20577eda10f4" ON "service_equipment" ("servicesId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5893e7c4b7f9a7b24d1d3227e8" ON "service_equipment" ("equipmentId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_5893e7c4b7f9a7b24d1d3227e8"`);
    await queryRunner.query(`DROP INDEX "IDX_06cbd177c7bdad20577eda10f4"`);
    await queryRunner.query(
      `ALTER TABLE "service_equipment" RENAME TO "temporary_service_equipment"`,
    );
    await queryRunner.query(
      `CREATE TABLE "service_equipment" ("servicesId" varchar NOT NULL, "equipmentId" varchar NOT NULL, PRIMARY KEY ("servicesId", "equipmentId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "service_equipment"("servicesId", "equipmentId") SELECT "servicesId", "equipmentId" FROM "temporary_service_equipment"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_service_equipment"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_5893e7c4b7f9a7b24d1d3227e8" ON "service_equipment" ("equipmentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_06cbd177c7bdad20577eda10f4" ON "service_equipment" ("servicesId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_218027b00e9cc2f9193e74621c"`);
    await queryRunner.query(
      `ALTER TABLE "uploads" RENAME TO "temporary_uploads"`,
    );
    await queryRunner.query(
      `CREATE TABLE "uploads" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "url" text NOT NULL, "name" text NOT NULL, "contentType" text NOT NULL, "size" integer NOT NULL, "purpose" text NOT NULL DEFAULT ('public'), "fileName" text NOT NULL, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "uploads"("id", "userId", "url", "name", "contentType", "size", "purpose", "fileName", "createdAt") SELECT "id", "userId", "url", "name", "contentType", "size", "purpose", "fileName", "createdAt" FROM "temporary_uploads"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_uploads"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_218027b00e9cc2f9193e74621c" ON "uploads" ("url") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_4c29faa8169d9741d3a1d51483"`);
    await queryRunner.query(`DROP INDEX "IDX_9563540c43639a0669f68e8ebe"`);
    await queryRunner.query(`DROP INDEX "IDX_5159b6693f161a26dbe3585dc4"`);
    await queryRunner.query(
      `ALTER TABLE "reviews" RENAME TO "temporary_reviews"`,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" varchar PRIMARY KEY NOT NULL, "requestId" varchar NOT NULL, "serviceId" varchar NOT NULL, "serviceTitle" text NOT NULL, "providerId" varchar NOT NULL, "producerId" varchar NOT NULL, "producerName" text NOT NULL, "rating" integer NOT NULL, "comment" text, "replyText" text, "replyCreatedAt" text, "replyUpdatedAt" text, "hidden" boolean NOT NULL DEFAULT (0), "editableUntil" text NOT NULL, "createdAt" text NOT NULL, "updatedAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "reviews"("id", "requestId", "serviceId", "serviceTitle", "providerId", "producerId", "producerName", "rating", "comment", "replyText", "replyCreatedAt", "replyUpdatedAt", "hidden", "editableUntil", "createdAt", "updatedAt") SELECT "id", "requestId", "serviceId", "serviceTitle", "providerId", "producerId", "producerName", "rating", "comment", "replyText", "replyCreatedAt", "replyUpdatedAt", "hidden", "editableUntil", "createdAt", "updatedAt" FROM "temporary_reviews"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_reviews"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_4c29faa8169d9741d3a1d51483" ON "reviews" ("providerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9563540c43639a0669f68e8ebe" ON "reviews" ("serviceId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5159b6693f161a26dbe3585dc4" ON "reviews" ("requestId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_dab4d78b3be05c1ca4a626f57f"`);
    await queryRunner.query(`DROP INDEX "IDX_cd7faa31851a2153125fd1af73"`);
    await queryRunner.query(
      `ALTER TABLE "reports" RENAME TO "temporary_reports"`,
    );
    await queryRunner.query(
      `CREATE TABLE "reports" ("id" varchar PRIMARY KEY NOT NULL, "reporterId" varchar NOT NULL, "reporterName" text NOT NULL, "reporterRole" text NOT NULL, "targetType" text NOT NULL, "targetId" text NOT NULL, "targetLabel" text NOT NULL, "reason" text NOT NULL, "description" text NOT NULL, "status" text NOT NULL DEFAULT ('open'), "resolution" text, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "reports"("id", "reporterId", "reporterName", "reporterRole", "targetType", "targetId", "targetLabel", "reason", "description", "status", "resolution", "createdAt") SELECT "id", "reporterId", "reporterName", "reporterRole", "targetType", "targetId", "targetLabel", "reason", "description", "status", "resolution", "createdAt" FROM "temporary_reports"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_reports"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_dab4d78b3be05c1ca4a626f57f" ON "reports" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd7faa31851a2153125fd1af73" ON "reports" ("targetId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_692a909ee0fa9383e7859f9b40"`);
    await queryRunner.query(
      `ALTER TABLE "notifications" RENAME TO "temporary_notifications"`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "type" text NOT NULL, "title" text NOT NULL, "body" text, "link" text NOT NULL, "read" boolean NOT NULL DEFAULT (0), "groupKey" text, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "notifications"("id", "userId", "type", "title", "body", "link", "read", "groupKey", "createdAt") SELECT "id", "userId", "type", "title", "body", "link", "read", "groupKey", "createdAt" FROM "temporary_notifications"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_notifications"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_1a9a8327f718c21f827d6b12f4"`);
    await queryRunner.query(
      `ALTER TABLE "messages" RENAME TO "temporary_messages"`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" varchar PRIMARY KEY NOT NULL, "requestId" varchar NOT NULL, "senderId" varchar NOT NULL, "senderName" text NOT NULL, "senderRole" text NOT NULL, "text" text NOT NULL, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "messages"("id", "requestId", "senderId", "senderName", "senderRole", "text", "createdAt") SELECT "id", "requestId", "senderId", "senderName", "senderRole", "text", "createdAt" FROM "temporary_messages"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_messages"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_1a9a8327f718c21f827d6b12f4" ON "messages" ("requestId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_80d4e9cce72ad92b06085b69b5"`);
    await queryRunner.query(`DROP INDEX "IDX_18278a59472a31a2177c95076b"`);
    await queryRunner.query(`DROP INDEX "IDX_7a2d28e31586e1b92ee9189e96"`);
    await queryRunner.query(`DROP INDEX "IDX_07f8d78c034a3b01c8fe0921df"`);
    await queryRunner.query(
      `ALTER TABLE "service_requests" RENAME TO "temporary_service_requests"`,
    );
    await queryRunner.query(
      `CREATE TABLE "service_requests" ("id" varchar PRIMARY KEY NOT NULL, "serviceId" varchar NOT NULL, "serviceTitle" text NOT NULL, "providerId" varchar NOT NULL, "providerName" text NOT NULL, "producerId" varchar NOT NULL, "producerName" text NOT NULL, "propertyId" varchar NOT NULL, "location" text NOT NULL, "scheduledDate" text NOT NULL, "quantity" real NOT NULL, "priceUnit" text NOT NULL, "value" real NOT NULL, "notes" text, "status" text NOT NULL DEFAULT ('pending'), "counterDate" text, "counterValue" real, "counterMessage" text, "counterCreatedAt" text, "rejectReason" text, "cancelReason" text, "cancelledBy" text, "reviewId" text, "createdAt" text NOT NULL, "updatedAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "service_requests"("id", "serviceId", "serviceTitle", "providerId", "providerName", "producerId", "producerName", "propertyId", "location", "scheduledDate", "quantity", "priceUnit", "value", "notes", "status", "counterDate", "counterValue", "counterMessage", "counterCreatedAt", "rejectReason", "cancelReason", "cancelledBy", "reviewId", "createdAt", "updatedAt") SELECT "id", "serviceId", "serviceTitle", "providerId", "providerName", "producerId", "producerName", "propertyId", "location", "scheduledDate", "quantity", "priceUnit", "value", "notes", "status", "counterDate", "counterValue", "counterMessage", "counterCreatedAt", "rejectReason", "cancelReason", "cancelledBy", "reviewId", "createdAt", "updatedAt" FROM "temporary_service_requests"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_service_requests"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_80d4e9cce72ad92b06085b69b5" ON "service_requests" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18278a59472a31a2177c95076b" ON "service_requests" ("producerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a2d28e31586e1b92ee9189e96" ON "service_requests" ("providerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07f8d78c034a3b01c8fe0921df" ON "service_requests" ("serviceId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_16a67349ed347072437edf53d8"`);
    await queryRunner.query(
      `ALTER TABLE "request_events" RENAME TO "temporary_request_events"`,
    );
    await queryRunner.query(
      `CREATE TABLE "request_events" ("id" varchar PRIMARY KEY NOT NULL, "requestId" varchar NOT NULL, "type" text NOT NULL, "actorId" text, "actorRole" text NOT NULL, "actorName" text NOT NULL, "note" text, "previousDate" text, "previousValue" real, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "request_events"("id", "requestId", "type", "actorId", "actorRole", "actorName", "note", "previousDate", "previousValue", "createdAt") SELECT "id", "requestId", "type", "actorId", "actorRole", "actorName", "note", "previousDate", "previousValue", "createdAt" FROM "temporary_request_events"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_request_events"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_16a67349ed347072437edf53d8" ON "request_events" ("requestId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_4298b685cb59b963ca3095f924"`);
    await queryRunner.query(
      `ALTER TABLE "properties" RENAME TO "temporary_properties"`,
    );
    await queryRunner.query(
      `CREATE TABLE "properties" ("id" varchar PRIMARY KEY NOT NULL, "producerId" varchar NOT NULL, "name" text NOT NULL, "city" text NOT NULL, "state" text NOT NULL, "accessNotes" text NOT NULL DEFAULT (''), "areaHectares" real NOT NULL, "crops" text NOT NULL, "createdAt" text NOT NULL, "deletedAt" text)`,
    );
    await queryRunner.query(
      `INSERT INTO "properties"("id", "producerId", "name", "city", "state", "accessNotes", "areaHectares", "crops", "createdAt", "deletedAt") SELECT "id", "producerId", "name", "city", "state", "accessNotes", "areaHectares", "crops", "createdAt", "deletedAt" FROM "temporary_properties"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_properties"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_4298b685cb59b963ca3095f924" ON "properties" ("producerId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_075c49754f475d9679ebb17e88"`);
    await queryRunner.query(
      `ALTER TABLE "favorites" RENAME TO "temporary_favorites"`,
    );
    await queryRunner.query(
      `CREATE TABLE "favorites" ("id" varchar PRIMARY KEY NOT NULL, "producerId" varchar NOT NULL, "serviceId" varchar NOT NULL, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "favorites"("id", "producerId", "serviceId", "createdAt") SELECT "id", "producerId", "serviceId", "createdAt" FROM "temporary_favorites"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_favorites"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_075c49754f475d9679ebb17e88" ON "favorites" ("producerId", "serviceId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_8b619ef0a4fe392dbde07eee1e"`);
    await queryRunner.query(
      `ALTER TABLE "services" RENAME TO "temporary_services"`,
    );
    await queryRunner.query(
      `CREATE TABLE "services" ("id" varchar PRIMARY KEY NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "categoryId" varchar NOT NULL, "providerId" varchar NOT NULL, "city" text NOT NULL, "state" text NOT NULL, "price" real NOT NULL, "priceUnit" text NOT NULL, "rating" real NOT NULL DEFAULT (0), "reviewCount" integer NOT NULL DEFAULT (0), "available" boolean NOT NULL DEFAULT (1), "photos" text NOT NULL, "status" text NOT NULL DEFAULT ('active'), "hiddenReason" text, "statusBeforeHidden" text, "hiddenByAccountDeletion" boolean NOT NULL DEFAULT (0), "searchText" text NOT NULL DEFAULT (''), "locationText" text NOT NULL DEFAULT (''), "createdAt" text NOT NULL, "deletedAt" text)`,
    );
    await queryRunner.query(
      `INSERT INTO "services"("id", "title", "description", "categoryId", "providerId", "city", "state", "price", "priceUnit", "rating", "reviewCount", "available", "photos", "status", "hiddenReason", "statusBeforeHidden", "hiddenByAccountDeletion", "searchText", "locationText", "createdAt", "deletedAt") SELECT "id", "title", "description", "categoryId", "providerId", "city", "state", "price", "priceUnit", "rating", "reviewCount", "available", "photos", "status", "hiddenReason", "statusBeforeHidden", "hiddenByAccountDeletion", "searchText", "locationText", "createdAt", "deletedAt" FROM "temporary_services"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_services"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_8b619ef0a4fe392dbde07eee1e" ON "services" ("providerId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" RENAME TO "temporary_equipment"`,
    );
    await queryRunner.query(
      `CREATE TABLE "equipment" ("id" varchar PRIMARY KEY NOT NULL, "providerId" varchar NOT NULL, "type" text NOT NULL, "model" text NOT NULL, "year" integer NOT NULL, "specs" text NOT NULL DEFAULT (''), "photos" text NOT NULL, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "equipment"("id", "providerId", "type", "model", "year", "specs", "photos", "createdAt") SELECT "id", "providerId", "type", "model", "year", "specs", "photos", "createdAt" FROM "temporary_equipment"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_equipment"`);
    await queryRunner.query(`DROP INDEX "IDX_1143abb8c3fad8b06dd857a8c9"`);
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" RENAME TO "temporary_password_reset_tokens"`,
    );
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "tokenHash" text NOT NULL, "expiresAt" text NOT NULL, "usedAt" text, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "password_reset_tokens"("id", "userId", "tokenHash", "expiresAt", "usedAt", "createdAt") SELECT "id", "userId", "tokenHash", "expiresAt", "usedAt", "createdAt" FROM "temporary_password_reset_tokens"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_password_reset_tokens"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1143abb8c3fad8b06dd857a8c9" ON "password_reset_tokens" ("tokenHash") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_4851231c0376fb4eb1993da259"`);
    await queryRunner.query(
      `ALTER TABLE "blocked_days" RENAME TO "temporary_blocked_days"`,
    );
    await queryRunner.query(
      `CREATE TABLE "blocked_days" ("id" varchar PRIMARY KEY NOT NULL, "providerId" varchar NOT NULL, "date" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "blocked_days"("id", "providerId", "date") SELECT "id", "providerId", "date" FROM "temporary_blocked_days"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_blocked_days"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4851231c0376fb4eb1993da259" ON "blocked_days" ("providerId", "date") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_b8d6bfd21855eb21c4779903ad"`);
    await queryRunner.query(`DROP INDEX "IDX_b807cf9b03e729b3d076a6514d"`);
    await queryRunner.query(
      `ALTER TABLE "admin_actions" RENAME TO "temporary_admin_actions"`,
    );
    await queryRunner.query(
      `CREATE TABLE "admin_actions" ("id" varchar PRIMARY KEY NOT NULL, "adminId" varchar NOT NULL, "adminName" text NOT NULL, "action" text NOT NULL, "targetType" text NOT NULL, "targetId" text NOT NULL, "targetLabel" text NOT NULL, "reason" text, "createdAt" text NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "admin_actions"("id", "adminId", "adminName", "action", "targetType", "targetId", "targetLabel", "reason", "createdAt") SELECT "id", "adminId", "adminName", "action", "targetType", "targetId", "targetLabel", "reason", "createdAt" FROM "temporary_admin_actions"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_admin_actions"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_b8d6bfd21855eb21c4779903ad" ON "admin_actions" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b807cf9b03e729b3d076a6514d" ON "admin_actions" ("targetId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" RENAME TO "temporary_provider_profiles"`,
    );
    await queryRunner.query(
      `CREATE TABLE "provider_profiles" ("userId" varchar PRIMARY KEY NOT NULL, "document" text NOT NULL DEFAULT (''), "serviceRadiusKm" integer NOT NULL DEFAULT (50), "yearsOfExperience" integer NOT NULL DEFAULT (0), "description" text NOT NULL DEFAULT (''), "verificationStatus" text NOT NULL DEFAULT ('not_sent'), "verificationRejectionReason" text, "identityUploadId" text, "addressUploadId" text, "verificationSubmittedAt" text, "verificationReviewedAt" text, "rating" real NOT NULL DEFAULT (0), "reviewCount" integer NOT NULL DEFAULT (0))`,
    );
    await queryRunner.query(
      `INSERT INTO "provider_profiles"("userId", "document", "serviceRadiusKm", "yearsOfExperience", "description", "verificationStatus", "verificationRejectionReason", "identityUploadId", "addressUploadId", "verificationSubmittedAt", "verificationReviewedAt", "rating", "reviewCount") SELECT "userId", "document", "serviceRadiusKm", "yearsOfExperience", "description", "verificationStatus", "verificationRejectionReason", "identityUploadId", "addressUploadId", "verificationSubmittedAt", "verificationReviewedAt", "rating", "reviewCount" FROM "temporary_provider_profiles"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_provider_profiles"`);
    await queryRunner.query(`DROP INDEX "IDX_5893e7c4b7f9a7b24d1d3227e8"`);
    await queryRunner.query(`DROP INDEX "IDX_06cbd177c7bdad20577eda10f4"`);
    await queryRunner.query(`DROP TABLE "service_equipment"`);
    await queryRunner.query(`DROP INDEX "IDX_218027b00e9cc2f9193e74621c"`);
    await queryRunner.query(`DROP TABLE "uploads"`);
    await queryRunner.query(`DROP INDEX "IDX_4c29faa8169d9741d3a1d51483"`);
    await queryRunner.query(`DROP INDEX "IDX_9563540c43639a0669f68e8ebe"`);
    await queryRunner.query(`DROP INDEX "IDX_5159b6693f161a26dbe3585dc4"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP INDEX "IDX_dab4d78b3be05c1ca4a626f57f"`);
    await queryRunner.query(`DROP INDEX "IDX_cd7faa31851a2153125fd1af73"`);
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP INDEX "IDX_692a909ee0fa9383e7859f9b40"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP INDEX "IDX_1a9a8327f718c21f827d6b12f4"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP INDEX "IDX_80d4e9cce72ad92b06085b69b5"`);
    await queryRunner.query(`DROP INDEX "IDX_18278a59472a31a2177c95076b"`);
    await queryRunner.query(`DROP INDEX "IDX_7a2d28e31586e1b92ee9189e96"`);
    await queryRunner.query(`DROP INDEX "IDX_07f8d78c034a3b01c8fe0921df"`);
    await queryRunner.query(`DROP TABLE "service_requests"`);
    await queryRunner.query(`DROP INDEX "IDX_16a67349ed347072437edf53d8"`);
    await queryRunner.query(`DROP TABLE "request_events"`);
    await queryRunner.query(`DROP INDEX "IDX_4298b685cb59b963ca3095f924"`);
    await queryRunner.query(`DROP TABLE "properties"`);
    await queryRunner.query(`DROP INDEX "IDX_075c49754f475d9679ebb17e88"`);
    await queryRunner.query(`DROP TABLE "favorites"`);
    await queryRunner.query(`DROP INDEX "IDX_8b619ef0a4fe392dbde07eee1e"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "equipment"`);
    await queryRunner.query(`DROP INDEX "IDX_420d9f679d41281f282f5bc7d0"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP INDEX "IDX_1143abb8c3fad8b06dd857a8c9"`);
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(`DROP INDEX "IDX_0aedff58b23995504f9dc99f75"`);
    await queryRunner.query(`DROP TABLE "login_attempts"`);
    await queryRunner.query(`DROP INDEX "IDX_4851231c0376fb4eb1993da259"`);
    await queryRunner.query(`DROP TABLE "blocked_days"`);
    await queryRunner.query(`DROP INDEX "IDX_b8d6bfd21855eb21c4779903ad"`);
    await queryRunner.query(`DROP INDEX "IDX_b807cf9b03e729b3d076a6514d"`);
    await queryRunner.query(`DROP TABLE "admin_actions"`);
    await queryRunner.query(`DROP INDEX "IDX_97672ac88f789774dd47f7c8be"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "provider_profiles"`);
  }
}
