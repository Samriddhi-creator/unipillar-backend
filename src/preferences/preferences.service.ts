import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { spawn } from 'child_process';
import { GeneratePreferencesDto } from './generate-preferences.dto';

@Injectable()
export class PreferencesService {
    constructor(private prisma: PrismaService) { }

    async generateRecommendations(
        body: GeneratePreferencesDto,
    ): Promise<any> {

        // =========================================
        // 1. FETCH DATA FROM POSTGRESQL
        // =========================================
        const dataset = await this.prisma.cutoffPrediction.findMany();

        // =========================================
        // 2. NORMALIZE DATASET FOR PYTHON ENGINE
        // =========================================
        const cleanDataset = dataset.map((d: any) => ({
            Institute: d.institute,
            college_state: d.collegeState,
            branch_shortcut: d.branchShortcut,
            degree_type: d.degreeType,
            Quota: d.quota,
            "Seat Type": d.seatType,
            Gender: d.gender,
            predicted_closing_rank_2026:
                d.predictedClosingRank2026,
            institute_type: d.instituteType,
            Global_Prestige_Index:
                d.globalPrestigeIndex,
            Global_Branch_Popularity:
                d.globalBranchPopularity,
        }));

        // =========================================
        // 3. RUN PYTHON ENGINE
        // =========================================
        return new Promise((resolve, reject) => {

            const pythonPath = process.env.PYTHON_CMD || 'python3';
            const py = spawn(
                pythonPath,
                ['-u', 'python/main.py'],
            );

            let output = '';
            let error = '';

            py.on('error', (err) => {
                console.error('Failed to spawn python for preferences:', err);
                reject({
                    message: `Python process error: ${err.message}`,
                    error: err.message,
                });
            });

            // =========================================
            // 4. PYTHON STDOUT
            // =========================================
            py.stdout.on('data', (data) => {
                output += data.toString();
            });

            // =========================================
            // 5. PYTHON STDERR
            // =========================================
            py.stderr.on('data', (data) => {
                error += data.toString();

                console.error(
                    'Python Error:',
                    data.toString(),
                );
            });

            // =========================================
            // 6. PROCESS END
            // =========================================
            py.on('close', async (code) => {

                if (code !== 0) {

                    return reject({
                        message: 'Python process failed',
                        error,
                        code,
                    });
                }

                try {

                    const parsed = JSON.parse(output);

                    // =========================================
                    // SAVE PROFILE
                    // =========================================
                    const profile =
                        await this.prisma.preferenceProfile.create({
                            data: {
                                mainCategoryRank:
                                    body.profile.mainCategoryRank,

                                advCategoryRank:
                                    body.profile.advCategoryRank,

                                category:
                                    body.profile.category,

                                homeState:
                                    body.profile.homeState,

                                gender:
                                    body.profile.gender,

                                hometownWeight:
                                    body.weights.hometown,

                                collegeWeight:
                                    body.weights.college,

                                branchWeight:
                                    body.weights.branch,

                                preferredBranches:
                                    body.branches,
                            },
                        });

                    // =========================================
                    // SAVE GENERATED LIST
                    // =========================================
                    const generatedList =
                        await this.prisma.generatedList.create({
                            data: {
                                profileId: profile.id,

                                generatedResults: parsed,

                                totalResults: parsed.length,
                            },
                        });

                    // =========================================
                    // SAVE HISTORY
                    // =========================================
                    await this.prisma.recommendationHistory.create({
                        data: {
                            profileId: profile.id,

                            generatedListId:
                                generatedList.id,
                        },
                    });

                    // =========================================
                    // RETURN RESPONSE
                    // =========================================
                    resolve({
                        success: true,
                        count: parsed.length,
                        profileId: profile.id,
                        generatedListId: generatedList.id,
                        results: parsed,
                    });

                } catch (e) {

                    reject({
                        message: 'Invalid JSON from Python',
                        rawOutput: output,
                    });
                }
            });

            // =========================================
            // 7. SEND DATA TO PYTHON
            // =========================================
            const payload = JSON.stringify({
                profile: body.profile,
                weights: body.weights,
                branches: body.branches,
                dataset: cleanDataset,
            });

            py.stdin.write(payload);

            py.stdin.end();

            // =========================================
            // 8. SAFETY TIMEOUT
            // =========================================
            setTimeout(() => {

                py.kill();

                reject({
                    message:
                        'Python process timeout (30s)',
                });

            }, 30000);
        });
    }
}