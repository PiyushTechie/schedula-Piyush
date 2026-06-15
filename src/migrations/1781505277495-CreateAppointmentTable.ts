import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAppointmentTable1781505277495 implements MigrationInterface {
    name = 'CreateAppointmentTable1781505277495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."appointment_status_enum" AS ENUM('BOOKED', 'CANCELLED', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "appointment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointmentDate" date NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "status" "public"."appointment_status_enum" NOT NULL DEFAULT 'BOOKED', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "patientId" uuid, "doctorId" uuid, CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_5ce4c3130796367c93cd817948e" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_514bcc3fb1b8140f85bf1cde6e2" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_514bcc3fb1b8140f85bf1cde6e2"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_5ce4c3130796367c93cd817948e"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
    }

}
