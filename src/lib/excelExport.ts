type AoaData = (string | number | boolean | null | undefined)[][]

interface SheetState {
  aoaRows: AoaData
  jsonRows: Record<string, unknown>[]
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function buildWorkbook(sheets: Map<string, SheetState>) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  for (const [name, state] of sheets) {
    const ws = wb.addWorksheet(name)
    const hasAoa = state.aoaRows.length > 0
    const hasJson = state.jsonRows.length > 0

    if (hasAoa) {
      for (const row of state.aoaRows) {
        ws.addRow(row)
      }
    }
    if (hasJson) {
      const keys = Object.keys(state.jsonRows[0])
      if (!hasAoa) ws.addRow(keys)
      for (const row of state.jsonRows) {
        ws.addRow(keys.map((k) => row[k] ?? ''))
      }
    }

    ws.eachRow((row) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const col = ws.getColumn(colNumber)
        const len = String(cell.value ?? '').length + 2
        if (!col.width || len > col.width) col.width = Math.min(len, 50)
      })
    })
  }
  return wb
}

class WorkbookWrapper {
  _sheets = new Map<string, SheetState>()

  _ensureSheet(name: string): SheetState {
    if (!this._sheets.has(name)) {
      this._sheets.set(name, { aoaRows: [], jsonRows: [] })
    }
    return this._sheets.get(name)!
  }
}

export const XLSX = {
  utils: {
    json_to_sheet(data: Record<string, unknown>[]): WorkbookWrapper {
      const wb = new WorkbookWrapper()
      const state = wb._ensureSheet('Sheet1')
      state.jsonRows = data
      return wb
    },
    sheet_add_aoa(
      wsOrWb: WorkbookWrapper,
      data: AoaData,
      _opts?: { origin?: string }
    ) {
      const state = wsOrWb._ensureSheet('Sheet1')
      state.aoaRows.push(...data)
    },
    book_new(): WorkbookWrapper {
      return new WorkbookWrapper()
    },
    book_append_sheet(
      wb: WorkbookWrapper,
      source: WorkbookWrapper,
      name: string
    ) {
      const sourceState = source._sheets.get('Sheet1')
      if (!sourceState) return
      const target = wb._ensureSheet(name)
      target.aoaRows = sourceState.aoaRows
      target.jsonRows = sourceState.jsonRows
    },
  },

  async writeFile(wb: WorkbookWrapper, filename: string) {
    const workbook = await buildWorkbook(wb._sheets)
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    downloadBlob(blob, filename)
  },
}
