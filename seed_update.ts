import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

// ... existing code

async function seedCutoffPredictions() {
  const results: any[] = []
  const filePath = path.join(__dirname, '../data/JOSAA_2026_Predicted_Cutoffs.csv')

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`CutoffPrediction CSV rows loaded: ${results.length}`)

  let inserted = 0
  let skipped = 0
  const batchSize = 500

  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map((row) => {
        const institute = row['Institute'] || ''
        const branchShortcut = row['branch_shortcut'] || ''
        const quota = row['Quota'] || ''
        const seatType = row['Seat Type'] || ''
        const gender = row['Gender'] || ''
        
        // Generate a deterministic ID based on unique fields to allow upsert
        const idId = `${institute}-${branchShortcut}-${quota}-${seatType}-${gender}`.replace(/\s+/g, '-').substring(0, 191)

        return prisma.cutoffPrediction
          .upsert({
            where: { id: idId },
            update: {
              predictedClosingRank2026: Number(row['predicted_closing_rank_2026']) || 0,
              globalPrestigeIndex: parseFloat(row['Global_Prestige_Index']) || 0,
              globalBranchPopularity: parseFloat(row['Global_Branch_Popularity']) || 0,
            },
            create: {
              id: idId,
              institute: institute,
              collegeState: row['college_state'],
              branchShortcut: branchShortcut,
              degreeType: row['degree_type'],
              quota: quota,
              seatType: seatType,
              gender: gender,
              predictedClosingRank2026: Number(row['predicted_closing_rank_2026']) || 0,
              instituteType: row['institute_type'],
              globalPrestigeIndex: parseFloat(row['Global_Prestige_Index']) || 0,
              globalBranchPopularity: parseFloat(row['Global_Branch_Popularity']) || 0,
            },
          })
          .then(() => 'inserted')
          .catch((err) => {
             console.error("Error inserting:", err.message);
             return 'skipped'
          })
      })
    )

    inserted += batchResults.filter((r) => r === 'inserted').length
    skipped  += batchResults.filter((r) => r === 'skipped').length

    if (i % 5000 === 0) console.log(`CutoffPrediction progress: ${i}/${results.length}`)
  }

  console.log(`CutoffPrediction done — inserted/updated: ${inserted}, skipped: ${skipped}`)
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  await seedSeatRecords()
  await seedCollegeFees()
  await seedCutoffPredictions()
}

