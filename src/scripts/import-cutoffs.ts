import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function importCutoffs() {
    const filePath = path.join(
        process.cwd(),
        'data',
        'JOSAA_2026_Predicted_Cutoffs.csv',
    );

    const results: any[] = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => results.push(row))
            .on('end', async () => {
                try {
                    console.log(`Rows found: ${results.length}`);

                    for (const row of results) {
                        const institute =
                            row.Institute ||
                            row['Institute'] ||
                            row['\ufeffInstitute'];

                        if (!institute) {
                            console.log('Skipping bad row:', row);
                            continue;
                        }

                        await prisma.cutoffPrediction.create({
                            data: {
                                id: `${institute}-${row.branch_shortcut}-${row.Quota}-${row['Seat Type']}-${row.Gender}`,

                                institute: institute,
                                collegeState: row.college_state,
                                branchShortcut: row.branch_shortcut,
                                degreeType: row.degree_type,
                                quota: row.Quota,
                                seatType: row['Seat Type'],
                                gender: row.Gender,

                                predictedClosingRank2026: Number(row.predicted_closing_rank_2026),
                                instituteType: row.institute_type,

                                globalPrestigeIndex: Number(row.Global_Prestige_Index),
                                globalBranchPopularity: Number(row.Global_Branch_Popularity),
                            },
                        });
                    }

                    console.log('✅ Import completed successfully');
                    resolve(true);
                } catch (err) {
                    console.error(err);
                    reject(err);
                } finally {
                    await prisma.$disconnect();
                }
            });
    });
}

importCutoffs();