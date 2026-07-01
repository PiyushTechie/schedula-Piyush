import { MigrationInterface, QueryRunner } from "typeorm";

export class Day20FutureBooking1782886419937 implements MigrationInterface {
    name = 'Day20FutureBooking1782886419937'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctors" ADD "allowFutureBooking" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "doctors" ADD "maxFutureBookingDays" integer`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_REMINDER')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "isReminderSent" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "isReminderSent" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_REMINDER', 'FOLLOW_UP_REMINDER')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "doctors" DROP COLUMN "maxFutureBookingDays"`);
        await queryRunner.query(`ALTER TABLE "doctors" DROP COLUMN "allowFutureBooking"`);
    }

}
