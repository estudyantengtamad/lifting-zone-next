import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const publicEquipmentDir = path.join(process.cwd(), 'public', 'equipment')
    if (!fs.existsSync(publicEquipmentDir)) {
      fs.mkdirSync(publicEquipmentDir, { recursive: true })
    }

    const sourceDir = 'C:\\Users\\Jayjean\\.gemini\\antigravity-ide\\brain\\2fa2ecc3-1183-4f3b-aa61-cc9b00eb199a\\.user_uploaded'

    const mapping = [
      { src: 'media_1791721724607.png', dest: 'leg-press-45.png', name: '11-Gauge Leg Press 45°' },
      { src: 'media_1791721866036.png', dest: 'smith-machine.png', name: 'Commercial Smith Machine' },
      { src: 'media_1791721902237.png', dest: 'power-rack.png', name: 'Olympic Power Rack' },
      { src: 'media_1791721950385.png', dest: 'hex-dumbbells.png', name: 'Hex Dumbbell Set 5–50kg' },
      { src: 'media_1791721991543.png', dest: 'hack-squat.png', name: 'Hack Squat Machine' },
      { src: 'media_1791730765849.png', dest: 'belt-10mm.png', name: 'Powerlifting Belt 10mm' },
      { src: 'media_1791730847783.png', dest: 'calibrated-plates.png', name: 'Calibrated Olympic Steel Plates 150kg Set' },
      { src: 'media_1791730861865.png', dest: 'cerakote-barbell.png', name: 'Cerakote Olympic Barbell 20kg' },
      { src: 'media_1791730874553.png', dest: 'adjustable-bench.png', name: 'Commercial 11-Gauge Adjustable Bench' }
    ]

    const results = []

    for (const item of mapping) {
      const srcPath = path.join(sourceDir, item.src)
      const destPath = path.join(publicEquipmentDir, item.dest)
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath)
        results.push({ name: item.name, status: 'copied', dest: `/equipment/${item.dest}` })
      } else {
        results.push({ name: item.name, status: 'source_missing', srcPath })
      }
    }

    const publicSupplementsDir = path.join(process.cwd(), 'public', 'supplements')
    if (!fs.existsSync(publicSupplementsDir)) {
      fs.mkdirSync(publicSupplementsDir, { recursive: true })
    }

    const currentSourceDir = 'C:\\Users\\Jayjean\\.gemini\\antigravity-ide\\brain\\7d6a295c-2332-4cfc-ba9a-d91b7b5044ec\\.user_uploaded'

    const supplementMapping = [
      { src: 'media_1791769698581.png', dest: 'cbum-itholate.png', name: 'CBUM Itholate Pre-Workout' },
      { src: 'media_1791769747334.png', dest: 'thavage-pre-workout.png', name: 'Thavage Pre-Workout' },
      { src: 'media_1791769798948.png', dest: 'clear-whey-isolate.png', name: 'Clear Whey Isolate' },
      { src: 'media_1791769828106.png', dest: 'whey-protein-5lb.png', name: 'Whey Protein 5lb' },
      { src: 'media_1791769908109.png', dest: 'creatine-monohydrate.png', name: 'Creatine Monohydrate' },
      { src: 'media_1791770508065.png', dest: 'creapure-creatine.png', name: 'Creapure Creatine' }
    ]

    for (const item of supplementMapping) {
      const srcPath = path.join(currentSourceDir, item.src)
      const destPath = path.join(publicSupplementsDir, item.dest)
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath)
        results.push({ name: item.name, status: 'copied', dest: `/supplements/${item.dest}` })
      } else {
        results.push({ name: item.name, status: 'source_missing', srcPath })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
