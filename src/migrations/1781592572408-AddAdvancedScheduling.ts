import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdvancedScheduling1781592572408 implements MigrationInterface {
    name = 'AddAdvancedScheduling1781592572408'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" ADD "tokenNumber" integer`);
        await queryRunner.query(`CREATE TYPE "public"."custom_availability_schedulingtype_enum" AS ENUM('STREAM', 'WAVE')`);
        await queryRunner.query(`ALTER TABLE "custom_availability" ADD "schedulingType" "public"."custom_availability_schedulingtype_enum" NOT NULL DEFAULT 'STREAM'`);
        await queryRunner.query(`ALTER TABLE "custom_availability" ADD "slotDuration" integer NOT NULL DEFAULT '15'`);
        await queryRunner.query(`ALTER TABLE "custom_availability" ADD "bufferTime" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "custom_availability" ADD "maxCapacity" integer`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_availability_schedulingtype_enum" AS ENUM('STREAM', 'WAVE')`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" ADD "schedulingType" "public"."recurring_availability_schedulingtype_enum" NOT NULL DEFAULT 'STREAM'`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" ADD "slotDuration" integer NOT NULL DEFAULT '15'`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" ADD "bufferTime" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" ADD "maxCapacity" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_availability" DROP COLUMN "maxCapacity"`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" DROP COLUMN "bufferTime"`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" DROP COLUMN "slotDuration"`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" DROP COLUMN "schedulingType"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_availability_schedulingtype_enum"`);
        await queryRunner.query(`ALTER TABLE "custom_availability" DROP COLUMN "maxCapacity"`);
        await queryRunner.query(`ALTER TABLE "custom_availability" DROP COLUMN "bufferTime"`);
        await queryRunner.query(`ALTER TABLE "custom_availability" DROP COLUMN "slotDuration"`);
        await queryRunner.query(`ALTER TABLE "custom_availability" DROP COLUMN "schedulingType"`);
        await queryRunner.query(`DROP TYPE "public"."custom_availability_schedulingtype_enum"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "tokenNumber"`);
    }

}
