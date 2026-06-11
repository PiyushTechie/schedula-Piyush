import { MigrationInterface, QueryRunner } from "typeorm";

export class DoctorAvailability1781157643233 implements MigrationInterface {
    name = 'DoctorAvailability1781157643233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "custom_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "specificDate" date NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "doctor_id" uuid, CONSTRAINT "PK_e9b8fa5803ca3d6554a7ddf7045" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "recurring_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dayOfWeek" integer NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "doctor_id" uuid, CONSTRAINT "PK_2464dd095ba418858c1aa3f4e01" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "doctors" DROP COLUMN "isAvailable"`);
        await queryRunner.query(`ALTER TABLE "custom_availability" ADD CONSTRAINT "FK_01e3c636792e6aee17e99ebc531" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" ADD CONSTRAINT "FK_814ae095c0f609eb6774680a069" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_availability" DROP CONSTRAINT "FK_814ae095c0f609eb6774680a069"`);
        await queryRunner.query(`ALTER TABLE "custom_availability" DROP CONSTRAINT "FK_01e3c636792e6aee17e99ebc531"`);
        await queryRunner.query(`ALTER TABLE "doctors" ADD "isAvailable" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`DROP TABLE "recurring_availability"`);
        await queryRunner.query(`DROP TABLE "custom_availability"`);
    }

}
