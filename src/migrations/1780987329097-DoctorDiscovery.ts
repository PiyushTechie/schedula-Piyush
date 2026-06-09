import { MigrationInterface, QueryRunner } from "typeorm";

export class DoctorDiscovery1780987329097 implements MigrationInterface {
    name = 'DoctorDiscovery1780987329097'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctors" ADD "isAvailable" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctors" DROP COLUMN "isAvailable"`);
    }

}
