import {
    Injectable,
    BadRequestException,
} from '@nestjs/common';

import { spawn } from 'child_process';

import * as path from 'path';

import * as fs from 'fs';

import PDFDocument from 'pdfkit';

@Injectable()
export class PreferencesService {
    async generatePreferenceList(data: any) {
        try {
            // --------------------------------
            // USER PROFILE
            // --------------------------------

            const userProfile = {
                category: data.category,

                gender: data.gender,

                home_state: data.homeState,

                pwd: data.pwd === 'Yes',

                ranks: {
                    main_crl: Number(data.jeeMainsRank),

                    main_cat: Number(data.jeeMainsRank),

                    adv_crl: Number(data.jeeAdvancedRank),

                    adv_cat: Number(data.jeeAdvancedRank),
                },
            };

            // --------------------------------
            // WEIGHTS
            // --------------------------------

            const weights = {
                branch: Number(data.weights.branch),

                prestige: Number(data.weights.college),

                location: Number(data.weights.hometown),
            };

            // --------------------------------
            // PATHS
            // --------------------------------

            const pythonFile = path.join(
                process.cwd(),
                'python',
                'main.py',
            );

            const datasetPath = path.join(
                process.cwd(),
                'data',
                'JOSAA_2026_Predicted_Cutoffs.csv',
            );

            // --------------------------------
            // RUN PYTHON
            // --------------------------------

            const result: any = await new Promise(
                (resolve, reject) => {
                    const python = spawn(
                        'python',
                        [
                            pythonFile,
                            JSON.stringify(userProfile),
                            JSON.stringify(weights),
                            datasetPath,
                        ],
                        {
                            cwd: path.join(process.cwd(), 'python'),
                        },
                    );


                    let output = '';

                    let error = '';

                    python.stdout.on('data', (data) => {
                        output += data.toString();
                    });

                    python.stderr.on('data', (data) => {
                        error += data.toString();
                    });

                    python.on('close', (code) => {
                        if (code !== 0) {
                            reject(error);

                            return;
                        }

                        try {
                            resolve(JSON.parse(output));
                        } catch (err) {
                            reject(err);
                        }
                    });
                },
            );

            // --------------------------------
            // GENERATE PDF
            // --------------------------------

            const fileName = `recommendation-${Date.now()}.pdf`;

            const pdfPath = path.join(
                process.cwd(),
                'generated',
                fileName,
            );

            const doc = new PDFDocument({
                margin: 40,
            });

            const stream = fs.createWriteStream(pdfPath);

            doc.pipe(stream);

            // --------------------------------
            // TITLE
            // --------------------------------

            doc
                .fontSize(24)
                .text('UniPillar Recommendation List', {
                    align: 'center',
                });

            doc.moveDown();

            // --------------------------------
            // PROFILE
            // --------------------------------

            doc
                .fontSize(16)
                .text('Student Profile');

            doc.moveDown(0.5);

            doc.fontSize(12);

            doc.text(`JEE Mains Rank: ${data.jeeMainsRank}`);

            doc.text(
                `JEE Advanced Rank: ${data.jeeAdvancedRank}`,
            );

            doc.text(`Category: ${data.category}`);

            doc.text(`Gender: ${data.gender}`);

            doc.text(`Home State: ${data.homeState}`);

            doc.text(`PwD: ${data.pwd}`);

            doc.moveDown();

            // --------------------------------
            // WEIGHTS
            // --------------------------------

            doc
                .fontSize(16)
                .text('Priority Weights');

            doc.moveDown(0.5);

            doc.fontSize(12);

            doc.text(
                `Hometown Locality: ${data.weights.hometown}%`,
            );

            doc.text(
                `College Priority: ${data.weights.college}%`,
            );

            doc.text(
                `Branch Priority: ${data.weights.branch}%`,
            );

            doc.moveDown();

            // --------------------------------
            // COLLEGES
            // --------------------------------

            doc
                .fontSize(16)
                .text('Recommended Colleges');

            doc.moveDown();

            result.slice(0, 50).forEach((college, index) => {
                doc
                    .fontSize(13)
                    .text(
                        `${index + 1}. ${college.Institute}`,
                        {
                            underline: true,
                        },
                    );

                doc.fontSize(11);

                doc.text(
                    `Branch: ${college.branch_shortcut}`,
                );

                doc.text(
                    `Institute Type: ${college.degree_type}`,
                );

                doc.text(
                    `Quota: ${college.Quota}`,
                );

                doc.text(
                    `Seat Type: ${college['Seat Type']}`,
                );

                doc.text(
                    `Predicted Closing Rank: ${college.predicted_closing_rank_2026}`,
                );

                doc.text(
                    `Utility Score: ${college.final_utility_score}`,
                );

                doc.moveDown();
            });

            doc.end();

            // WAIT FOR PDF SAVE

            await new Promise<void>((resolve) => {
                stream.on('finish', () => resolve());
            });

            // --------------------------------
            // RETURN
            // --------------------------------

            return {
                success: true,

                pdfUrl: `http://localhost:3001/generated/${fileName}`,

                totalResults: result.length,
            };
        } catch (err) {
            console.log(err);

            throw new BadRequestException(
                'Failed to generate recommendation PDF',
            );
        }
    }
}