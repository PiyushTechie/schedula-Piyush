import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchedulingTypeToAppointment1781593776618 implements MigrationInterface {
    name = 'AddSchedulingTypeToAppointment1781593776618'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."appointment_schedulingtype_enum" AS ENUM('STREAM', 'WAVE')`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD "schedulingType" "public"."appointment_schedulingtype_enum" NOT NULL DEFAULT 'STREAM'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "schedulingType"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_schedulingtype_enum"`);
    }

}
