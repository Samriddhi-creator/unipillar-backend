import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

// ── helpers ──────────────────────────────────────────────────────────────────

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[,*\s₹]/g, '').trim()
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

function detectType(name: string, shortName: string): string {
  const c = (name + ' ' + shortName).toUpperCase()
  if (c.includes('INDIAN INSTITUTE OF TECHNOLOGY') || shortName.toUpperCase().startsWith('IIT')) return 'IIT'
  if (
    c.includes('NATIONAL INSTITUTE OF TECHNOLOGY') ||
    ['NIT', 'MNIT', 'MANIT', 'MNNIT', 'SVNIT', 'VNIT', 'NITK'].some((p) =>
      shortName.toUpperCase().startsWith(p)
    )
  ) return 'NIT'
  if (
    c.includes('INFORMATION TECHNOLOGY') ||
    ['IIIT', 'IIITN', 'IIITM', 'IIITDM', 'IIITV'].some((p) =>
      shortName.toUpperCase().startsWith(p)
    )
  ) return 'IIIT'
  return 'OTHER'
}

// ── seed seat records ─────────────────────────────────────────────────────────

async function seedSeatRecords() {
  const results: any[] = []
  const filePath = path.join(__dirname, '../data/final_list.csv')

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`SeatRecord CSV rows loaded: ${results.length}`)
  console.log(Object.keys(results[0]))

  const formatted = results.map((row) => ({
    institute:   row['Institute'] || row['﻿Institute'],
    program:     row['Academic Program Name'],
    quota:       row['Quota'],
    seatType:    row['Seat Type'],
    gender:      row['Gender'],
    year:        Number(row['Year']),
    openingRank: Number(row['Opening Rank']),
    closingRank: Number(row['Closing Rank']),
    round:       Number(row['Round']),
    isPwd:       row['isPwd'],
  }))

  let inserted = 0
  let skipped = 0
  const batchSize = 500

  for (let i = 0; i < formatted.length; i += batchSize) {
    const batch = formatted.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map((row) =>
        prisma.seatRecord
          .upsert({
            where: {
              institute_program_quota_seatType_gender_year_round_isPwd: {
                institute:   row.institute,
                program:     row.program,
                quota:       row.quota,
                seatType:    row.seatType,
                gender:      row.gender,
                year:        row.year,
                round:       row.round,
                isPwd:       row.isPwd,
              },
            },
            update: {
              openingRank: row.openingRank,
              closingRank: row.closingRank,
            },
            create: row,
          })
          .then(() => 'inserted')
          .catch(() => 'skipped')
      )
    )

    inserted += batchResults.filter((r) => r === 'inserted').length
    skipped  += batchResults.filter((r) => r === 'skipped').length

    if (i % 5000 === 0) console.log(`SeatRecord progress: ${i}/${formatted.length}`)
  }

  console.log(`SeatRecord done — inserted/updated: ${inserted}, skipped: ${skipped}`)
}

// ── seed college fees ─────────────────────────────────────────────────────────

async function seedCollegeFees() {
  const results: any[] = []
  const filePath = path.join(__dirname, '../data/collage_fees.csv')

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`CollegeFee CSV rows loaded: ${results.length}`)

  let inserted = 0
  let skipped = 0

  for (const row of results) {
    const collegeName      = (row['CollegeName'] || '').trim()
    const collegeShortName = (row['CollegeShortName'] || '').trim()
    const fees             = parseAmount(row['Fees'] || '0')
    const instType         = detectType(collegeName, collegeShortName)

    if (!collegeName || !collegeShortName || fees === 0) {
      skipped++
      continue
    }

    await prisma.collegeFee.upsert({
      where:  { collegeShortName },
      update: { collegeName, fees, instType },
      create: { collegeName, collegeShortName, fees, instType },
    })

    inserted++
  }

  console.log(`CollegeFee done — inserted/updated: ${inserted}, skipped: ${skipped}`)
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  await seedSeatRecords()
  await seedCollegeFees()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })